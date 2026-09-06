import {
  demoFamilyRecords,
  isStaleDemoFamilyRow,
} from "@/lib/demo-family";
import { prisma } from "@/lib/db";
import { sampleItems, samplePeople } from "@/lib/seed";
import { DEMO_JOIN_CODE } from "@/lib/types";

export async function ensureDemoHousehold() {
  const existing = await prisma.household.findUnique({
    where: { joinCode: DEMO_JOIN_CODE },
  });
  if (existing) {
    await refreshDemoHousehold(existing.id, existing.name);
    return existing;
  }

  try {
    return await createDemoHousehold();
  } catch {
    const again = await prisma.household.findUnique({
      where: { joinCode: DEMO_JOIN_CODE },
    });
    if (again) {
      await refreshDemoHousehold(again.id, again.name);
      return again;
    }
    throw new Error("Could not open the sample house.");
  }
}

async function refreshDemoHousehold(householdId: string, name: string) {
  if (name === "Demo house") {
    await prisma.household.update({
      where: { id: householdId },
      data: { name: "Sample house" },
    });
  }

  const rows = await prisma.familyRecord.findMany({
    where: { householdId },
  });
  const fresh = demoFamilyRecords();
  const byId = new Map(fresh.map((row) => [row.id, row]));

  for (const row of rows) {
    if (!isStaleDemoFamilyRow(row)) continue;
    const update = byId.get(row.id);
    if (!update) continue;
    await prisma.familyRecord.update({
      where: { id: row.id },
      data: { lastDone: update.lastDone, due: update.due },
    });
  }
}

async function createDemoHousehold() {
  const household = await prisma.household.create({
    data: {
      id: "demo-household",
      name: "Sample house",
      joinCode: DEMO_JOIN_CODE,
    },
  });

  await prisma.person.createMany({
    data: samplePeople.map((person, sortOrder) => ({
      id: person.id,
      householdId: household.id,
      name: person.name,
      talkStyle: person.talkStyle,
      sortOrder,
    })),
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
    data: sampleItems.map((item) => ({
      id: item.id,
      householdId: household.id,
      personId: item.personId,
      kind: item.kind,
      title: item.title,
      timeOfDay: item.timeOfDay,
      weight: item.weight,
      note: item.note ?? null,
    })),
  });

  await prisma.familyRecord.createMany({
    data: demoFamilyRecords().map((row) => ({
      id: row.id,
      householdId: household.id,
      kind: row.kind,
      who: row.who,
      lastDone: row.lastDone,
      due: row.due,
      note: row.note ?? null,
    })),
  });

  return household;
}
