import type { AppState, PersonalItem, Person } from "@/lib/types";

export const STORE_KEY = "next-up-v1";

export const samplePeople: Person[] = [
  { id: "you", name: "You", talkStyle: "plain" },
  { id: "dad", name: "Dad", talkStyle: "few-words" },
  { id: "sam", name: "Sam", talkStyle: "encouraging" },
];

export const sampleItems: PersonalItem[] = [
  {
    id: "you-vitamin",
    personId: "you",
    kind: "med",
    title: "Morning vitamin",
    timeOfDay: "morning",
    weight: "everyday",
    note: "The small bottle by the kettle.",
  },
  {
    id: "you-walk",
    personId: "you",
    kind: "appointment",
    title: "Afternoon walk",
    timeOfDay: "afternoon",
    weight: "important",
    note: "Ten minutes around the block is enough.",
  },
  {
    id: "dad-bp",
    personId: "dad",
    kind: "med",
    title: "Blood pressure tablet",
    timeOfDay: "morning",
    weight: "important",
    note: "With water. After breakfast.",
  },
  {
    id: "dad-heart",
    personId: "dad",
    kind: "med",
    title: "Evening heart tablet",
    timeOfDay: "evening",
    weight: "critical",
    note: "This one cannot wait until tomorrow.",
  },
  {
    id: "sam-inhaler",
    personId: "sam",
    kind: "med",
    title: "Inhaler before sport",
    timeOfDay: "afternoon",
    weight: "everyday",
    note: "Two puffs. Then go play.",
  },
];

const ease = {
  largeText: false,
  extraLargeText: false,
  highContrast: false,
  reduceMotion: false,
  reminders: false,
  fewWords: false,
  hideExtra: false,
};

/** Local-only start: just you. The You / Dad / Sam cast is the sample house. */
export const seedState: AppState = {
  people: [{ id: "you", name: "You", talkStyle: "plain" }],
  activePersonId: "you",
  role: "person",
  ease,
  sync: "local",
  dbAvailable: false,
  household: null,
  memberName: null,
  items: [sampleItems[0]],
  completions: {},
  postponed: {},
  checkIns: {},
  family: [],
  symptoms: [],
  isHead: false,
  viewEveryone: true,
  email: null,
  memberId: null,
  userId: null,
  reasons: [],
  invites: [],
  mailSent: false,
};
