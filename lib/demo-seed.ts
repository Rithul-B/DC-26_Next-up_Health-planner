import { prisma } from "@/lib/db";
import { DEMO_JOIN_CODE } from "@/lib/types";

export async function ensureDemoHousehold() {
  const existing = await prisma.household.findUnique({
    where: { joinCode: DEMO_JOIN_CODE },
  });
  if (existing) return existing;

  try {
    return await createDemoHousehold();
  } catch {
    const again = await prisma.household.findUnique({
      where: { joinCode: DEMO_JOIN_CODE },
    });
    if (again) return again;
    throw new Error("Could not open the sample house.");
  }
}

async function createDemoHousehold() {
  const household = await prisma.household.create({
    data: {
      id: "demo-household",
      name: "Demo house",
      joinCode: DEMO_JOIN_CODE,
    },
  });

  await prisma.person.createMany({
    data: [
      { id: "you", householdId: household.id, name: "You", talkStyle: "plain", sortOrder: 0 },
      { id: "dad", householdId: household.id, name: "Dad", talkStyle: "few-words", sortOrder: 1 },
      { id: "sam", householdId: household.id, name: "Sam", talkStyle: "encouraging", sortOrder: 2 },
    ],
  });

  await prisma.member.create({
    data: {
      id: "demo-you",
      householdId: household.id,
      name: "You",
      role: "person",
      personId: "you",
    },
  });

  await prisma.personalItem.createMany({
    data: [
      {
        id: "you-vitamin",
        householdId: household.id,
        personId: "you",
        kind: "med",
        title: "Morning vitamin",
        timeOfDay: "morning",
        weight: "everyday",
        note: "The small bottle by the kettle.",
      },
      {
        id: "you-walk",
        householdId: household.id,
        personId: "you",
        kind: "appointment",
        title: "Afternoon walk",
        timeOfDay: "afternoon",
        weight: "important",
        note: "Ten minutes around the block is enough.",
      },
      {
        id: "dad-bp",
        householdId: household.id,
        personId: "dad",
        kind: "med",
        title: "Blood pressure tablet",
        timeOfDay: "morning",
        weight: "important",
        note: "With water. After breakfast.",
      },
      {
        id: "dad-heart",
        householdId: household.id,
        personId: "dad",
        kind: "med",
        title: "Evening heart tablet",
        timeOfDay: "evening",
        weight: "critical",
        note: "This one cannot wait until tomorrow.",
      },
      {
        id: "sam-inhaler",
        householdId: household.id,
        personId: "sam",
        kind: "med",
        title: "Inhaler before sport",
        timeOfDay: "afternoon",
        weight: "everyday",
        note: "Two puffs. Then go play.",
      },
    ],
  });

  await prisma.familyRecord.createMany({
    data: [
      {
        id: "flu-all",
        householdId: household.id,
        kind: "vaccine",
        who: "wholeFamily",
        lastDone: "2025-10-18",
        due: "2026-10-15",
        note: "Everyone. Same clinic as last year.",
      },
      {
        id: "dad-physical",
        householdId: household.id,
        kind: "checkup",
        who: "dad",
        lastDone: "2025-03-12",
        due: "2026-03-12",
        note: "Annual physical. Ask for the blood work printout.",
      },
      {
        id: "sam-dentist",
        householdId: household.id,
        kind: "dentist",
        who: "sam",
        lastDone: "2026-06-08",
        due: "2026-12-08",
        note: "Cleaning. Just a name on the board.",
      },
      {
        id: "you-eyes",
        householdId: household.id,
        kind: "eyes",
        who: "you",
        lastDone: "2026-04-22",
        due: "2027-04-22",
        note: "All clear this year.",
      },
    ],
  });

  return household;
}
