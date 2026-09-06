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
import { seedState, STORE_KEY } from "@/lib/seed";
import type {
  AppState,
  CheckInFeeling,
  EaseSettings,
  FamilyRecord,
  HouseholdInfo,
  HouseholdSnapshot,
  Person,
  PersonalItem,
  Role,
  TalkStyle,
  Weight,
} from "@/lib/types";
import { FALLBACK_PERSON, TIME_ORDER, WEIGHT_ORDER } from "@/lib/types";

export const LOCAL_ONLY_KEY = "next-up-local-only";
export const EASE_KEY = "next-up-ease-v1";

type Phase = "welcome" | "app";

type JoinInput = {
  code: string;
  name: string;
  password?: string;
  role: Role;
  talkStyle?: TalkStyle;
  personId?: string;
  addPerson?: boolean;
};

type CreateInput = {
  householdName: string;
  yourName: string;
  password?: string;
  role: Role;
  talkStyle?: TalkStyle;
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
  markDone: (itemId: string) => void;
  undoDone: (itemId: string) => void;
  postpone: (itemId: string) => void;
  setCheckIn: (feeling: CheckInFeeling) => void;
  addPerson: (person: Omit<Person, "id">) => void;
  addItem: (item: Omit<PersonalItem, "id">) => string;
  updateItem: (itemId: string, patch: Partial<Omit<PersonalItem, "id">>) => void;
  removeItem: (itemId: string) => void;
  unpostpone: (itemId: string) => void;
  addFamily: (record: Omit<FamilyRecord, "id">) => void;
  markFamilyDone: (id: string, nextDue: string, note?: string) => void;
  promoteFamily: (id: string, weight: Weight) => string | null;
  stayLocal: () => void;
  createHousehold: (input: CreateInput) => Promise<string | null>;
  joinHousehold: (input: JoinInput) => Promise<string | null>;
  openDemo: () => Promise<string | null>;
  leaveHousehold: () => Promise<void>;
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
      role: parsed.role === "helper" ? "helper" : "person",
      activePersonId: parsed.activePersonId ?? seedState.activePersonId,
      sync: "local",
      dbAvailable: false,
      household: null,
      memberName: null,
    };
  } catch {
    return { ...seedState, ease: loadEase() };
  }
}

function applyRemote(
  prev: AppState,
  payload: {
    state: HouseholdSnapshot;
    role: string;
    personId: string;
    memberName: string;
    household: HouseholdInfo;
  },
): AppState {
  return {
    ...prev,
    ...payload.state,
    role: payload.role === "helper" ? "helper" : "person",
    activePersonId: payload.personId,
    sync: "household",
    dbAvailable: true,
    household: payload.household,
    memberName: payload.memberName,
    ease: prev.ease,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("app");
  const [saveError, setSaveError] = useState<string | null>(null);
  const skipPut = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  const applyLocal = useCallback(() => {
    const local = loadLocalState();
    setState(local);
    setPhase("app");
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap", { credentials: "same-origin" });
      if (!res.ok) throw new Error("bad");
      const data = (await res.json()) as {
        db: boolean;
        session: null | {
          role: string;
          personId: string;
          memberName: string;
          household: HouseholdInfo;
        };
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

      if (data.session && data.state) {
        localStorage.removeItem(LOCAL_ONLY_KEY);
        setState((prev) =>
          applyRemote(
            { ...prev, ease },
            {
              state: data.state!,
              role: data.session!.role,
              personId: data.session!.personId,
              memberName: data.session!.memberName,
              household: data.session!.household,
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
  }, [ready, state.sync, state.people, state.items, state.completions, state.postponed, state.checkIns, state.family]);

  useEffect(() => {
    function onFocus() {
      if (stateRef.current.sync !== "household") return;
      void fetch("/api/state", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data?.state) return;
          skipPut.current = true;
          setState((prev) => ({
            ...prev,
            ...data.state,
            role: data.role === "helper" ? "helper" : "person",
            activePersonId: data.personId,
            household: data.household ?? prev.household,
            memberName: data.memberName ?? prev.memberName,
          }));
        })
        .catch(() => null);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const person =
    state.people.find((p) => p.id === state.activePersonId) ??
    state.people[0] ??
    FALLBACK_PERSON;

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

  const persistSession = useCallback((next: { role?: Role; personId?: string }) => {
    if (stateRef.current.sync !== "household") return;
    void fetch("/api/session", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => null);
  }, []);

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
      patch((s) => ({ ...s, activePersonId: id }));
      persistSession({ personId: id });
    },
    setEase: (ease) => patch((s) => ({ ...s, ease: { ...s.ease, ...ease } })),
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
        const list = (s.postponed[key] ?? []).filter((id) => id !== itemId);
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
    addPerson: (next) =>
      patch((s) => {
        const id = uid();
        return {
          ...s,
          people: [...s.people, { ...next, id }],
          activePersonId: id,
        };
      }),
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
    stayLocal: () => {
      localStorage.setItem(LOCAL_ONLY_KEY, "1");
      const local = loadLocalState();
      setState({ ...local, dbAvailable: true, sync: "local" });
      setPhase("app");
    },
    createHousehold: async (input) => {
      const res = await fetch("/api/household", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return data?.error ?? "Could not start that house.";
      skipPut.current = true;
      localStorage.removeItem(LOCAL_ONLY_KEY);
      setState((prev) => applyRemote(prev, data));
      setPhase("app");
      return null;
    },
    joinHousehold: async (input) => {
      const res = await fetch("/api/join", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return data?.error ?? "Could not join that house.";
      skipPut.current = true;
      localStorage.removeItem(LOCAL_ONLY_KEY);
      setState((prev) => applyRemote(prev, data));
      setPhase("app");
      return null;
    },
    openDemo: async () => {
      const res = await fetch("/api/demo", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return data?.error ?? "Could not open the sample house.";
      skipPut.current = true;
      localStorage.removeItem(LOCAL_ONLY_KEY);
      setState((prev) => applyRemote(prev, data));
      setPhase("app");
      return null;
    },
    leaveHousehold: async () => {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
      localStorage.removeItem(LOCAL_ONLY_KEY);
      const local = loadLocalState();
      setState({
        ...local,
        dbAvailable: state.dbAvailable,
        sync: "local",
        household: null,
      });
      setPhase(state.dbAvailable ? "welcome" : "app");
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
