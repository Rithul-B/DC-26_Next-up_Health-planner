import type { AppState } from "@/lib/types";
import { WHOLE_FAMILY } from "@/lib/types";

export const STORE_KEY = "next-up-v1";

export const seedState: AppState = {
  people: [
    { id: "you", name: "You", talkStyle: "plain" },
    { id: "dad", name: "Dad", talkStyle: "few-words" },
    { id: "sam", name: "Sam", talkStyle: "encouraging" },
  ],
  activePersonId: "you",
  role: "person",
  ease: {
    largeText: false,
    highContrast: false,
    reduceMotion: false,
  },
  items: [
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
  ],
  completions: {},
  postponed: {},
  checkIns: {},
  family: [
    {
      id: "flu-all",
      kind: "vaccine",
      who: WHOLE_FAMILY,
      lastDone: "2025-10-18",
      due: "2026-10-15",
      note: "Everyone. Same clinic as last year.",
    },
    {
      id: "dad-physical",
      kind: "checkup",
      who: "dad",
      lastDone: "2025-03-12",
      due: "2026-03-12",
      note: "Annual physical. Ask for the blood work printout.",
    },
    {
      id: "sam-dentist",
      kind: "dentist",
      who: "sam",
      lastDone: "2026-06-08",
      due: "2026-12-08",
      note: "Cleaning. No account needed — just a name on the board.",
    },
    {
      id: "you-eyes",
      kind: "eyes",
      who: "you",
      lastDone: "2026-04-22",
      due: "2027-04-22",
      note: "All clear this year.",
    },
  ],
};
