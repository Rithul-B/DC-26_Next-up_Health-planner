import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_CODE = "NEXTUP";

const STALE = {
  "flu-all": { lastDone: "2025-10-18", due: "2026-10-15" },
  "dad-physical": { lastDone: "2025-03-12", due: "2026-03-12" },
  "sam-dentist": { lastDone: "2026-06-08", due: "2026-12-08" },
  "you-eyes": { lastDone: "2026-04-22", due: "2027-04-22" },
};

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftIso(days, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

function demoFamilyDates(from = new Date()) {
  return {
    "flu-all": { lastDone: shiftIso(-323, from), due: shiftIso(39, from) },
    "dad-physical": { lastDone: shiftIso(-365, from), due: shiftIso(12, from) },
    "sam-dentist": { lastDone: shiftIso(-90, from), due: shiftIso(93, from) },
    "you-eyes": { lastDone: shiftIso(-137, from), due: shiftIso(228, from) },
  };
}

async function refreshExisting(household) {
  if (household.name === "Demo house") {
    await prisma.household.update({
      where: { id: household.id },
      data: { name: "Sample house" },
    });
  }

  const rows = await prisma.familyRecord.findMany({
    where: { householdId: household.id },
  });
  const fresh = demoFamilyDates();
  let updated = 0;
  for (const row of rows) {
    const stale = STALE[row.id];
    if (!stale || stale.lastDone !== row.lastDone || stale.due !== row.due) {
      continue;
    }
    const next = fresh[row.id];
    if (!next) continue;
    await prisma.familyRecord.update({
      where: { id: row.id },
      data: { lastDone: next.lastDone, due: next.due },
    });
    updated += 1;
  }
  if (updated) {
    console.log(`Refreshed ${updated} sample Family Center dates.`);
  } else {
    console.log("Demo household already present.");
  }
}

async function main() {
  const existing = await prisma.household.findUnique({
    where: { joinCode: DEMO_CODE },
  });
  if (existing) {
    await refreshExisting(existing);
    return;
  }

  const household = await prisma.household.create({
    data: {
      id: "demo-household",
      name: "Sample house",
      joinCode: DEMO_CODE,
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

  const dates = demoFamilyDates();
  await prisma.familyRecord.createMany({
    data: [
      {
        id: "flu-all",
        householdId: household.id,
        kind: "vaccine",
        who: "wholeFamily",
        lastDone: dates["flu-all"].lastDone,
        due: dates["flu-all"].due,
        note: "Everyone. Same clinic as last year.",
      },
      {
        id: "dad-physical",
        householdId: household.id,
        kind: "checkup",
        who: "dad",
        lastDone: dates["dad-physical"].lastDone,
        due: dates["dad-physical"].due,
        note: "Annual physical. Ask for the blood work printout.",
      },
      {
        id: "sam-dentist",
        householdId: household.id,
        kind: "dentist",
        who: "sam",
        lastDone: dates["sam-dentist"].lastDone,
        due: dates["sam-dentist"].due,
        note: "Cleaning. Just a name on the board.",
      },
      {
        id: "you-eyes",
        householdId: household.id,
        kind: "eyes",
        who: "you",
        lastDone: dates["you-eyes"].lastDone,
        due: dates["you-eyes"].due,
        note: "All clear this year.",
      },
    ],
  });

  console.log("Seeded sample household NEXTUP.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
