"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { completionKey, todayKey } from "@/lib/dates";
import { seedState, STORE_KEY } from "@/lib/seed";
import type {
  AppState,
  CheckInFeeling,
  EaseSettings,
  FamilyRecord,
  Person,
  PersonalItem,
  Role,
  Weight,
} from "@/lib/types";
import { TIME_ORDER, WEIGHT_ORDER } from "@/lib/types";

type Store = {
  ready: boolean;
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
  removeItem: (itemId: string) => void;
  addFamily: (record: Omit<FamilyRecord, "id">) => void;
  markFamilyDone: (id: string, nextDue: string, note?: string) => void;
  promoteFamily: (id: string, weight: Weight) => string | null;
};

const StoreContext = createContext<Store | null>(null);

function uid(): string {
  return crypto.randomUUID();
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seedState;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.people?.length) return seedState;
    return { ...seedState, ...parsed };
  } catch {
    return seedState;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(seedState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const person =
    state.people.find((p) => p.id === state.activePersonId) ?? state.people[0];

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

  const value: Store = {
    ready,
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
    setRole: (role) => patch((s) => ({ ...s, role })),
    setActivePerson: (id) => patch((s) => ({ ...s, activePersonId: id })),
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
            title: `${row.kind === "other" ? "Follow-up" : row.kind} follow-up`,
            timeOfDay: "morning",
            weight,
            note: row.note,
          },
        ],
      }));
      return itemId;
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
