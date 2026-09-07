export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type Weight = "everyday" | "important" | "critical";
export type Role = "person" | "helper";
export type TalkStyle = "plain" | "few-words" | "encouraging";
export type ItemKind = "med" | "appointment";
export type FamilyKind = "checkup" | "dentist" | "eyes" | "vaccine" | "other";
export type CheckInFeeling = "good" | "ok" | "hard";
export type SyncMode = "local" | "household";
export type NeedReason = "checkups" | "reminders" | "advice" | "meds";

export type Person = {
  id: string;
  name: string;
  talkStyle: TalkStyle;
  age?: number;
  weightNote?: string;
  heightNote?: string;
  conditions?: string;
  extraNotes?: string;
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
  due?: string;
};

export type FamilyRecord = {
  id: string;
  kind: FamilyKind;
  who: string;
  lastDone: string;
  due: string;
  note?: string;
};

export type SymptomNote = {
  id: string;
  personId: string;
  feltOn: string;
  body: string;
};

export type EaseSettings = {
  largeText: boolean;
  extraLargeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  reminders: boolean;
  fewWords: boolean;
  hideExtra: boolean;
};

export type HouseholdInfo = {
  id: string;
  name: string;
  joinCode: string;
  hasPassword: boolean;
};

export type InviteInfo = {
  id: string;
  name: string;
  email: string;
  inviteCode: string | null;
  claimed: boolean;
  isHead: boolean;
  personId: string | null;
};

export type HouseholdSnapshot = {
  people: Person[];
  items: PersonalItem[];
  completions: Record<string, string[]>;
  postponed: Record<string, string[]>;
  checkIns: Record<string, CheckInFeeling>;
  family: FamilyRecord[];
  symptoms: SymptomNote[];
};

export type AppState = HouseholdSnapshot & {
  activePersonId: string;
  role: Role;
  ease: EaseSettings;
  sync: SyncMode;
  dbAvailable: boolean;
  household: HouseholdInfo | null;
  memberName: string | null;
  isHead: boolean;
  viewEveryone: boolean;
  email: string | null;
  memberId: string | null;
  userId: string | null;
  reasons: NeedReason[];
  invites: InviteInfo[];
  mailSent: boolean;
};

export const WHOLE_FAMILY = "wholeFamily";

export const TIME_ORDER: TimeOfDay[] = [
  "morning",
  "afternoon",
  "evening",
  "night",
];

export const WEIGHT_ORDER: Weight[] = ["critical", "important", "everyday"];

export const FALLBACK_PERSON: Person = {
  id: "you",
  name: "You",
  talkStyle: "plain",
};

export const DEMO_JOIN_CODE = "NEXTUP";

export const MEDICAL_DISCLAIMER =
  "Next Up is a planner. It is not a diagnosis, not a prescription, and not a replacement for a clinician, pharmacist, or therapist. If you feel unsafe or this is an emergency, get urgent help now.";
