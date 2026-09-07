"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { familyKindLabels } from "@/lib/copy";
import { completionKey, todayKey } from "@/lib/dates";
import { refreshStaleFamily } from "@/lib/demo-family";
import { MAX_HOUSEHOLD_PEOPLE } from "@/lib/limits";
import { seedState, STORE_KEY } from "@/lib/seed";
import type {
  AppState,
  CheckInFeeling,
  EaseSettings,
  FamilyRecord,
  HouseholdInfo,
  HouseholdSnapshot,
  InviteInfo,
  NeedReason,
  Person,
  PersonalItem,
  Role,
  SymptomNote,
  TalkStyle,
  Weight,
} from "@/lib/types";
import { FALLBACK_PERSON, TIME_ORDER, WEIGHT_ORDER } from "@/lib/types";

export const LOCAL_ONLY_KEY = "next-up-local-only";
export const EASE_KEY = "next-up-ease-v1";

type Phase = "welcome" | "notify" | "app";

type JoinInput = {
  code: string;
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
};

export type SignupInput = {
  role: Role;
  firstName: string;
  email: string;
  password: string;
  householdName?: string;
  reasons: NeedReason[];
  age?: number | null;
  weightNote?: string;
  heightNote?: string;
  conditions?: string;
  extraNotes?: string;
  talkStyle?: TalkStyle;
  people: {
    firstName: string;
    email: string;
    age?: number | null;
    weightNote?: string;
    heightNote?: string;
    conditions?: string;
    extraNotes?: string;
  }[];
};

export type MemberDraft = {
  firstName: string;
  email: string;
  age?: number | null;
  weightNote?: string;
  heightNote?: string;
  conditions?: string;
  extraNotes?: string;
  talkStyle?: TalkStyle;
  role?: Role;
};

type RemotePayload = {
  state: HouseholdSnapshot;
  role: string;
  personId: string;
  memberName: string;
  household: HouseholdInfo;
  isHead?: boolean;
  viewEveryone?: boolean;
  email?: string | null;
  memberId?: string | null;
  userId?: string | null;
  reasons?: NeedReason[];
  invites?: InviteInfo[];
  mailSent?: boolean;
};

type Store = {
  ready: boolean;
  phase: Phase;
  saveError: string | null;
  state: AppState;
  person: Person;
  todayItems: PersonalItem[];
  openItems: PersonalItem[];
  nextItem: PersonalItem | null;
  screenWeight: Weight;
  highestOpenWeight: Weight;
  isDone: (itemId: string) => boolean;
  isPostponed: (itemId: string) => boolean;
  checkIn: CheckInFeeling | undefined;
  setRole: (role: Role) => void;
  setActivePerson: (id: string) => void;
  setEase: (ease: Partial<EaseSettings>) => void;
  setViewEveryone: (on: boolean) => Promise<void>;
  markDone: (itemId: string) => void;
  undoDone: (itemId: string) => void;
  postpone: (itemId: string) => void;
  setCheckIn: (feeling: CheckInFeeling) => void;
  addPerson: (person: Omit<Person, "id">) => string | null;
  addHouseholdMember: (draft: MemberDraft) => Promise<string | null>;
  addItem: (item: Omit<PersonalItem, "id">) => string;
  updateItem: (itemId: string, patch: Partial<Omit<PersonalItem, "id">>) => void;
  removeItem: (itemId: string) => void;
  unpostpone: (itemId: string) => void;
  addFamily: (record: Omit<FamilyRecord, "id">) => void;
  markFamilyDone: (id: string, nextDue: string, note?: string) => void;
  promoteFamily: (id: string, weight: Weight) => string | null;
  addSymptom: (body: string, feltOn?: string) => void;
  removeSymptom: (id: string) => void;
  updatePerson: (personId: string, patch: Partial<Omit<Person, "id">>) => void;
  stayLocal: () => void;
  finishNotify: () => void;
  signup: (input: SignupInput) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  claimInvite: (
    email: string,
    inviteCode: string,
    password: string,
    viewEveryone: boolean,
  ) => Promise<string | null>;
  joinHousehold: (input: JoinInput) => Promise<string | null>;
  openDemo: () => Promise<string | null>;
  leaveHousehold: () => Promise<void>;
  signOut: () => Promise<void>;
  removeMember: (memberId: string) => Promise<string | null>;
};

const StoreContext = createContext<Store | null>(null);

function uid(): string {
  return crypto.randomUUID();
}

function snapshotOf(state: AppState): HouseholdSnapshot {
  return {
    people: state.people,
    items: state.items,
    completions: state.completions,
    postponed: state.postponed,
    checkIns: state.checkIns,
    family: state.family,
    symptoms: state.symptoms,
  };
}

function emptyRemote(): Pick<
  AppState,
  | "isHead"
  | "viewEveryone"
  | "email"
  | "memberId"
  | "userId"
  | "reasons"
  | "invites"
  | "mailSent"
> {
  return {
    isHead: false,
    viewEveryone: true,
    email: null,
    memberId: null,
    userId: null,
    reasons: [],
    invites: [],
    mailSent: false,
  };
}

function loadEase(): EaseSettings {
  try {
    const raw = localStorage.getItem(EASE_KEY);
    if (!raw) return seedState.ease;
    return { ...seedState.ease, ...(JSON.parse(raw) as Partial<EaseSettings>) };
  } catch {
    return seedState.ease;
  }
}

function loadLocalState(): AppState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const ease = loadEase();
    if (!raw) return { ...seedState, ease };
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed.people?.length) return { ...seedState, ease };
    const family = refreshStaleFamily(parsed.family ?? seedState.family);
    return {
      ...seedState,
      ...parsed,
      people: parsed.people,
      ease: { ...ease, ...parsed.ease },
      items: parsed.items ?? seedState.items,
      completions: parsed.completions ?? {},
      postponed: parsed.postponed ?? {},
      checkIns: parsed.checkIns ?? {},
      family,
      symptoms: parsed.symptoms ?? [],
      role: parsed.role === "helper" ? "helper" : "person",
      activePersonId: parsed.activePersonId ?? seedState.activePersonId,
      sync: "local",
      dbAvailable: false,
      household: null,
      memberName: null,
      ...emptyRemote(),
    };
  } catch {
    return { ...seedState, ease: loadEase() };
  }
}

function applyRemote(prev: AppState, payload: RemotePayload): AppState {
  return {
    ...prev,
    ...payload.state,
    symptoms: payload.state.symptoms ?? [],
    role: payload.role === "helper" ? "helper" : "person",
    activePersonId: payload.personId,
    sync: "household",
    dbAvailable: true,
    household: payload.household,
    memberName: payload.memberName,
    ease: prev.ease,
    isHead: Boolean(payload.isHead),
    viewEveryone: payload.isHead ? true : payload.viewEveryone !== false,
    email: payload.email ?? null,
    memberId: payload.memberId ?? null,
    userId: payload.userId ?? null,
    reasons: payload.reasons ?? [],
    invites: payload.invites ?? [],
    mailSent: Boolean(payload.mailSent),
  };
}

function asRemote(data: RemotePayload | null): RemotePayload | null {
  if (!data?.state || !data.household) return null;
  return data;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("app");
  const [saveError, setSaveError] = useState<string | null>(null);
  const skipPut = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  const bootstrap = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { credentials: "same-origin" });
      if (!res.ok) throw new Error("bad");
      const data = (await res.json()) as {
        db: boolean;
        session: null | RemotePayload;
        state?: HouseholdSnapshot;
      };

      const localOnly = localStorage.getItem(LOCAL_ONLY_KEY) === "1";
      const ease = loadEase();

      if (!data.db) {
        const local = loadLocalState();
        setState({ ...local, ease, dbAvailable: false, sync: "local" });
        setPhase("app");
        return;
      }

      if (data.session && (data.state || data.session.state)) {
        localStorage.removeItem(LOCAL_ONLY_KEY);
        setState((prev) =>
          applyRemote(
            { ...prev, ease },
            {
              ...data.session!,
              state: data.state ?? data.session!.state,
            },
          ),
        );
        setPhase("app");
        return;
      }

      setState((prev) => ({
        ...prev,
        ...loadLocalState(),
        ease,
        dbAvailable: true,
        sync: "local",
        household: null,
        ...emptyRemote(),
      }));
      setPhase(localOnly ? "app" : "welcome");
    } catch {
      const local = loadLocalState();
      setState({ ...local, dbAvailable: false, sync: "local" });
      setPhase("app");
    } finally {
      skipPut.current = true;
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(EASE_KEY, JSON.stringify(state.ease));
    if (state.sync === "local") {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          ...snapshotOf(state),
          role: state.role,
          activePersonId: state.activePersonId,
        }),
      );
    }
  }, [ready, state]);

  useEffect(() => {
    if (!ready || state.sync !== "household") return;
    if (skipPut.current) {
      skipPut.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch("/api/state", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshotOf(stateRef.current)),
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as {
              error?: string;
            } | null;
            setSaveError(body?.error ?? "Could not save to the shared house.");
            return;
          }
          setSaveError(null);
        })
        .catch(() => {
          setSaveError("Could not save to the shared house.");
        });
    }, 400);
    return () => window.clearTimeout(handle);
  }, [
    ready,
    state.sync,
    state.people,
    state.items,
    state.completions,
    state.postponed,
    state.checkIns,
    state.family,
    state.symptoms,
  ]);

  useEffect(() => {
    function onFocus() {
      if (stateRef.current.sync !== "household") return;
      void fetch("/api/state", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.state) return;
          skipPut.current = true;
          setState((prev) => applyRemote(prev, data as RemotePayload));
        })
        .catch(() => null);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const rawPerson =
    state.people.find((p) => p.id === state.activePersonId) ??
    state.people[0] ??
    FALLBACK_PERSON;
  const person: Person = state.ease.fewWords
    ? { ...rawPerson, talkStyle: "few-words" }
    : rawPerson;

  const day = todayKey();
  const doneSet = new Set(state.completions[completionKey(person.id, day)] ?? []);
  const postSet = new Set(state.postponed[completionKey(person.id, day)] ?? []);

  const todayItems = useMemo(() => {
    return state.items
      .filter((item) => item.personId === person.id)
      .slice()
      .sort((a, b) => {
        const tw = WEIGHT_ORDER.indexOf(a.weight) - WEIGHT_ORDER.indexOf(b.weight);
        if (tw !== 0) return tw;
        return TIME_ORDER.indexOf(a.timeOfDay) - TIME_ORDER.indexOf(b.timeOfDay);
      });
  }, [state.items, person.id]);

  const openItems = useMemo(
    () =>
      todayItems.filter(
        (item) => !doneSet.has(item.id) && !postSet.has(item.id),
      ),
    [todayItems, state.completions, state.postponed, person.id, day],
  );

  const nextItem = openItems[0] ?? null;

  const highestOpenWeight: Weight = openItems.some((i) => i.weight === "critical")
    ? "critical"
    : openItems.some((i) => i.weight === "important")
      ? "important"
      : "everyday";

  const screenWeight = nextItem?.weight ?? highestOpenWeight;

  const patch = useCallback((fn: (prev: AppState) => AppState) => {
    setState(fn);
  }, []);

  const persistSession = useCallback(
    (next: { role?: Role; personId?: string; viewEveryone?: boolean }) => {
      if (stateRef.current.sync !== "household") return;
      void fetch("/api/session", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.state) return;
          skipPut.current = true;
          setState((prev) => applyRemote(prev, data as RemotePayload));
        })
        .catch(() => null);
    },
    [],
  );

  async function postAuth(
    url: string,
    body: unknown,
    after: Phase = "app",
  ): Promise<string | null> {
    const res = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return (data?.error as string) ?? "That did not work.";
    const remote = asRemote(data as RemotePayload);
    if (!remote) return "Could not open that house.";
    skipPut.current = true;
    localStorage.removeItem(LOCAL_ONLY_KEY);
    setState((prev) => applyRemote(prev, remote));
    setPhase(after);
    return null;
  }

  const value: Store = {
    ready,
    phase,
    saveError,
    state,
    person,
    todayItems,
    openItems,
    nextItem,
    screenWeight,
    highestOpenWeight,
    isDone: (itemId) => doneSet.has(itemId),
    isPostponed: (itemId) => postSet.has(itemId),
    checkIn: state.checkIns[completionKey(person.id, day)],
    setRole: (role) => {
      patch((s) => ({ ...s, role }));
      persistSession({ role });
    },
    setActivePerson: (id) => {
      if (!state.isHead && !state.viewEveryone && id !== state.activePersonId) {
        return;
      }
      patch((s) => ({ ...s, activePersonId: id }));
      persistSession({ personId: id });
    },
    setEase: (ease) => patch((s) => ({ ...s, ease: { ...s.ease, ...ease } })),
    setViewEveryone: async (on) => {
      if (state.isHead) return;
      patch((s) => ({ ...s, viewEveryone: on }));
      persistSession({ viewEveryone: on });
    },
    markDone: (itemId) =>
      patch((s) => {
        const key = completionKey(s.activePersonId);
        const list = new Set(s.completions[key] ?? []);
        list.add(itemId);
        return { ...s, completions: { ...s.completions, [key]: [...list] } };
      }),
    undoDone: (itemId) =>
      patch((s) => {
        const key = completionKey(s.activePersonId);
        const list = (s.completions[key] ?? []).filter((id) => id !== itemId);
        return { ...s, completions: { ...s.completions, [key]: list } };
      }),
    postpone: (itemId) =>
      patch((s) => {
        const key = completionKey(s.activePersonId);
        const list = new Set(s.postponed[key] ?? []);
        list.add(itemId);
        return { ...s, postponed: { ...s.postponed, [key]: [...list] } };
      }),
    unpostpone: (itemId) =>
      patch((s) => {
        const key = completionKey(s.activePersonId);
        const list = (s.postponed[key] ?? []).filter((row) => row !== itemId);
        return { ...s, postponed: { ...s.postponed, [key]: list } };
      }),
    setCheckIn: (feeling) =>
      patch((s) => ({
        ...s,
        checkIns: {
          ...s.checkIns,
          [completionKey(s.activePersonId)]: feeling,
        },
      })),
    addPerson: (next) => {
      if (state.people.length >= MAX_HOUSEHOLD_PEOPLE) return null;
      const id = uid();
      patch((s) => ({
        ...s,
        people: [...s.people, { ...next, id }],
        activePersonId: id,
      }));
      return id;
    },
    addHouseholdMember: async (draft) => {
      const res = await fetch("/api/members", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return (data?.error as string) ?? "Could not add that person.";
      skipPut.current = true;
      setState((prev) => applyRemote(prev, data as RemotePayload));
      return null;
    },
    addItem: (item) => {
      const id = uid();
      patch((s) => ({ ...s, items: [...s.items, { ...item, id }] }));
      return id;
    },
    updateItem: (itemId, next) =>
      patch((s) => ({
        ...s,
        items: s.items.map((row) => {
          if (row.id !== itemId) return row;
          const merged = { ...row, ...next };
          if ("note" in next && !next.note) delete merged.note;
          return merged;
        }),
      })),
    removeItem: (itemId) =>
      patch((s) => ({ ...s, items: s.items.filter((i) => i.id !== itemId) })),
    addFamily: (record) =>
      patch((s) => ({ ...s, family: [...s.family, { ...record, id: uid() }] })),
    markFamilyDone: (id, nextDue, note) =>
      patch((s) => ({
        ...s,
        family: s.family.map((row) =>
          row.id === id
            ? { ...row, lastDone: todayKey(), due: nextDue, note: note ?? row.note }
            : row,
        ),
      })),
    promoteFamily: (id, weight) => {
      const row = state.family.find((f) => f.id === id);
      if (!row) return null;
      const personId = row.who === "wholeFamily" ? state.activePersonId : row.who;
      const itemId = uid();
      patch((s) => ({
        ...s,
        activePersonId: personId,
        items: [
          ...s.items,
          {
            id: itemId,
            personId,
            kind: "appointment",
            title:
              row.kind === "other"
                ? "Follow-up"
                : `${familyKindLabels[row.kind]} follow-up`,
            timeOfDay: "morning",
            weight,
            note: row.note,
          },
        ],
      }));
      persistSession({ personId });
      return itemId;
    },
    addSymptom: (body, feltOn) => {
      const note: SymptomNote = {
        id: uid(),
        personId: state.activePersonId,
        feltOn: feltOn || todayKey(),
        body: body.trim(),
      };
      if (!note.body) return;
      patch((s) => ({ ...s, symptoms: [note, ...s.symptoms] }));
    },
    removeSymptom: (id) =>
      patch((s) => ({ ...s, symptoms: s.symptoms.filter((row) => row.id !== id) })),
    updatePerson: (personId, next) =>
      patch((s) => ({
        ...s,
        people: s.people.map((row) =>
          row.id === personId ? { ...row, ...next } : row,
        ),
      })),
    stayLocal: () => {
      localStorage.setItem(LOCAL_ONLY_KEY, "1");
      const local = loadLocalState();
      setState({ ...local, dbAvailable: true, sync: "local" });
      setPhase("app");
    },
    finishNotify: () => setPhase("app"),
    signup: (input) => postAuth("/api/signup", input, "notify"),
    login: (email, password) => postAuth("/api/login", { email, password }),
    claimInvite: (email, inviteCode, password, viewEveryone) =>
      postAuth("/api/claim", { email, inviteCode, password, viewEveryone }, "notify"),
    joinHousehold: (input) => postAuth("/api/join", input),
    openDemo: () => postAuth("/api/demo", {}),
    leaveHousehold: async () => {
      await fetch("/api/leave", { method: "POST", credentials: "same-origin" });
      localStorage.removeItem(LOCAL_ONLY_KEY);
      const local = loadLocalState();
      setState({
        ...local,
        dbAvailable: state.dbAvailable,
        sync: "local",
        household: null,
        ...emptyRemote(),
      });
      setPhase(state.dbAvailable ? "welcome" : "app");
    },
    signOut: async () => {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
      localStorage.removeItem(LOCAL_ONLY_KEY);
      const local = loadLocalState();
      setState({
        ...local,
        dbAvailable: state.dbAvailable,
        sync: "local",
        household: null,
        ...emptyRemote(),
      });
      setPhase(state.dbAvailable ? "welcome" : "app");
    },
    removeMember: async (memberId) => {
      const res = await fetch("/api/members", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return (data?.error as string) ?? "Could not remove them.";
      skipPut.current = true;
      setState((prev) => applyRemote(prev, data as RemotePayload));
      return null;
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
