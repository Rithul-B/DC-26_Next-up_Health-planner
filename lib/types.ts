export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Weight = "everyday" | "important" | "critical";
export type Role = "person" | "helper";
export type TalkStyle = "plain" | "few-words" | "encouraging";
export type ItemKind = "med" | "appointment";
export type FamilyKind = "checkup" | "dentist" | "eyes" | "vaccine" | "other";
export type CheckInFeeling = "good" | "ok" | "hard";

export type Person = {
  id: string;
  name: string;
  talkStyle: TalkStyle;
};

export type PersonalItem = {
  id: string;
  personId: string;
  kind: ItemKind;
  title: string;
  timeOfDay: TimeOfDay;
  weight: Weight;
  note?: string;
  place?: string;
};

export type FamilyRecord = {
  id: string;
  kind: FamilyKind;
  who: string;
  lastDone: string;
  due: string;
  note?: string;
};

export type EaseSettings = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
};

export type AppState = {
  people: Person[];
  activePersonId: string;
  role: Role;
  ease: EaseSettings;
  items: PersonalItem[];
  completions: Record<string, string[]>;
  postponed: Record<string, string[]>;
  checkIns: Record<string, CheckInFeeling>;
  family: FamilyRecord[];
};

export const WHOLE_FAMILY = "wholeFamily";

export const TIME_ORDER: TimeOfDay[] = [
  "morning",
  "afternoon",
  "evening",
  "night",
];

export const WEIGHT_ORDER: Weight[] = ["critical", "important", "everyday"];
