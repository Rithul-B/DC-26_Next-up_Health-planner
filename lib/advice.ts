import { MEDICAL_DISCLAIMER } from "@/lib/types";

export const medicalDisclaimer = MEDICAL_DISCLAIMER;

export const redFlagLines = [
  "Trouble breathing, or lips or face looking blue.",
  "Chest pain, or pain that spreads to an arm or jaw.",
  "A seizure, fainting, or you cannot wake someone.",
  "A sudden very bad headache, confusion, or one-sided weakness.",
  "Bleeding that will not stop, or a bad allergic swelling.",
  "A baby who will not wake, or is floppy or not feeding.",
  "Thoughts of suicide or of harming yourself or someone else.",
];

export const careTopics = [
  {
    id: "fever",
    title: "Fever",
    summary: "A warm body is a common sign. It is not a diagnosis on its own.",
    tips: [
      "Rest and sip fluids if you can.",
      "Dress light. A cool cloth on the forehead can feel better.",
      "Write down how you feel and when it started, so you can tell a clinician.",
      "We will not tell you a medicine or a dose. A pharmacist or clinician can.",
    ],
    seekCare:
      "Get urgent help if breathing is hard, a rash looks purple, a baby under 3 months has a fever, a neck is stiff, or the person is very sleepy or confused.",
  },
  {
    id: "missed-dose",
    title: "Missed a dose",
    summary: "Forgetting a tablet happens. Do not guess a double dose.",
    tips: [
      "Check the bottle or leaflet if you still have it.",
      "Call the pharmacist who filled it, or the clinic that prescribed it.",
      "Say the name on the label, when you last took it, and when you noticed the miss.",
      "Do not take extra on your own. Next Up will not tell you a milligram or a schedule.",
    ],
    seekCare:
      "If you feel worse, faint, or have trouble breathing after a missed or extra dose, get urgent help and bring the bottle if you can.",
  },
  {
    id: "cold",
    title: "Coughs and colds",
    summary: "Most colds ease with rest. This is not a test for flu or COVID.",
    tips: [
      "Rest. Drink what you can keep down.",
      "Honey in warm water can soothe a throat for people over 1 year old. Ask a pharmacist about children.",
      "Wash hands. Cover coughs.",
      "A clinician can tell you if you need a test or a different plan.",
    ],
    seekCare:
      "Get urgent help if breathing is hard, lips look blue, chest pain starts, or a child is drawing in at the ribs.",
  },
  {
    id: "tummy",
    title: "Upset stomach",
    summary: "Queasy or loose stool is common. It is not a diagnosis.",
    tips: [
      "Small sips of water or an oral rehydration drink from a pharmacy.",
      "Bland food when you feel ready. Skip alcohol.",
      "Note what you ate and when it started, for a clinician if you call.",
    ],
    seekCare:
      "Get urgent help for blood in stool or vomit, a very dry mouth, no urine, severe belly pain, or confusion.",
  },
  {
    id: "sleep",
    title: "Sleep is hard",
    summary: "A rough night is not a disorder name from this app.",
    tips: [
      "Keep the room dim and the phone away if you can.",
      "A short wind-down: lights down, same time each night.",
      "If worry loops, write one sentence and set it aside until morning.",
      "A clinician can talk about ongoing sleep trouble. We will not prescribe.",
    ],
    seekCare:
      "Get urgent help if you cannot stay awake in a dangerous way (driving), or if low mood includes thoughts of suicide — call 988 in the US.",
  },
] as const;

export const livingTips = [
  {
    id: "questions",
    title: "Living with a long-term condition",
    lines: [
      "Keep a short list of questions for the next clinic visit.",
      "Note what helps a day feel easier, in your own words. That is a journal, not a diagnosis.",
      "Bring an up-to-date list of medicines to the pharmacist or clinician. Ask them about changes.",
      "Pace energy. One next step is enough.",
      "This app does not name a disease as a fact about you, and it does not set treatment.",
    ],
  },
  {
    id: "helper",
    title: "If you help someone",
    lines: [
      "Ask how they want to be talked to. Few words is fine.",
      "Share the house so they see the same board you do — if they want that.",
      "You can hide extra panels in Easier if the screen feels busy.",
      "You are not their doctor. Sit with them for clinic calls if they ask.",
    ],
  },
] as const;

export const verbalSessions = [
  {
    id: "breathe",
    title: "Four breaths",
    steps: [
      "Sit or lie down. Unclench your jaw.",
      "Breathe in slowly while you count four.",
      "Hold gently for four, if that feels okay. Skip the hold if it does not.",
      "Breathe out for four.",
      "Do that four times. You can stop whenever you want.",
    ],
  },
  {
    id: "here",
    title: "I am here",
    steps: [
      "Look around. Name one colour you see. Out loud is fine.",
      "Feel both feet, or the chair under you.",
      "Say: “I am here. This feeling can move.”",
      "Name one small next step. It can be water, or sitting still.",
    ],
  },
  {
    id: "five",
    title: "Five things",
    steps: [
      "Name five things you can see.",
      "Four things you can touch.",
      "Three things you can hear.",
      "Two things you can smell, or remember smelling.",
      "One slow breath out.",
    ],
  },
] as const;

export const verbalTherapyNote =
  "This is a short guided pause. It is not therapy and does not replace a therapist or a crisis line. If you might hurt yourself, call 988 in the US or local emergency help.";

export function journalPrompt(): string {
  return "What did you notice in your body or mood? Write it in your words. We will not turn this into a disease name.";
}

export const adviceIntro =
  "Calm notes for everyday health. Talk to a clinician or pharmacist before you change medicines or treatment. Seek care if a red-flag line fits.";
