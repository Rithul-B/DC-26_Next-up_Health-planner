import { prisma } from "@/lib/db";
import { completionKey } from "@/lib/dates";
import type {
  CheckInFeeling,
  FamilyKind,
  FamilyRecord,
  HouseholdSnapshot,
  ItemKind,
  Person,
  PersonalItem,
  TalkStyle,
  TimeOfDay,
  Weight,
} from "@/lib/types";

function groupKeys(
  rows: { personId: string; day: string; itemId: string }[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const row of rows) {
    const key = completionKey(row.personId, row.day);
    out[key] = [...(out[key] ?? []), row.itemId];
  }
  return out;
}

export async function readSnapshot(
  householdId: string,
): Promise<HouseholdSnapshot> {
  const [people, items, completions, postponed, checkIns, family] =
    await Promise.all([
      prisma.person.findMany({
        where: { householdId },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.personalItem.findMany({ where: { householdId } }),
      prisma.completion.findMany({ where: { householdId } }),
      prisma.postpone.findMany({ where: { householdId } }),
      prisma.checkIn.findMany({ where: { householdId } }),
      prisma.familyRecord.findMany({ where: { householdId } }),
    ]);

  const checkMap: Record<string, CheckInFeeling> = {};
  for (const row of checkIns) {
    checkMap[completionKey(row.personId, row.day)] = row.feeling as CheckInFeeling;
  }

  return {
    people: people.map(
      (row): Person => ({
        id: row.id,
        name: row.name,
        talkStyle: row.talkStyle as TalkStyle,
      }),
    ),
    items: items.map(
      (row): PersonalItem => ({
        id: row.id,
        personId: row.personId,
        kind: row.kind as ItemKind,
        title: row.title,
        timeOfDay: row.timeOfDay as TimeOfDay,
        weight: row.weight as Weight,
        note: row.note ?? undefined,
        place: row.place ?? undefined,
        due: row.due ?? undefined,
      }),
    ),
    completions: groupKeys(completions),
    postponed: groupKeys(postponed),
    checkIns: checkMap,
    family: family.map(
      (row): FamilyRecord => ({
        id: row.id,
        kind: row.kind as FamilyKind,
        who: row.who,
        lastDone: row.lastDone,
        due: row.due,
        note: row.note ?? undefined,
      }),
    ),
  };
}

function explode(
  map: Record<string, string[]>,
): { personId: string; day: string; itemId: string }[] {
  const rows: { personId: string; day: string; itemId: string }[] = [];
  for (const [key, ids] of Object.entries(map)) {
    const [personId, day] = key.split(":");
    if (!personId || !day) continue;
    for (const itemId of ids) {
      rows.push({ personId, day, itemId });
    }
  }
  return rows;
}

export async function writeSnapshot(
  householdId: string,
  snap: HouseholdSnapshot,
) {
  await prisma.$transaction(async (tx) => {
    await tx.completion.deleteMany({ where: { householdId } });
    await tx.postpone.deleteMany({ where: { householdId } });
    await tx.checkIn.deleteMany({ where: { householdId } });
    await tx.personalItem.deleteMany({ where: { householdId } });
    await tx.familyRecord.deleteMany({ where: { householdId } });
    await tx.person.deleteMany({ where: { householdId } });

    if (snap.people.length) {
      await tx.person.createMany({
        data: snap.people.map((person, index) => ({
          id: person.id,
          householdId,
          name: person.name,
          talkStyle: person.talkStyle,
          sortOrder: index,
        })),
      });
    }

    if (snap.items.length) {
      await tx.personalItem.createMany({
        data: snap.items.map((item) => ({
          id: item.id,
          householdId,
          personId: item.personId,
          kind: item.kind,
          title: item.title,
          timeOfDay: item.timeOfDay,
          weight: item.weight,
          note: item.note ?? null,
          place: item.place ?? null,
          due: item.due ?? null,
        })),
      });
    }

    const done = explode(snap.completions);
    if (done.length) {
      await tx.completion.createMany({
        data: done.map((row) => ({ ...row, householdId })),
      });
    }

    const later = explode(snap.postponed);
    if (later.length) {
      await tx.postpone.createMany({
        data: later.map((row) => ({ ...row, householdId })),
      });
    }

    const feelings = Object.entries(snap.checkIns)
      .map(([key, feeling]) => {
        const [personId, day] = key.split(":");
        return personId && day ? { personId, day, feeling, householdId } : null;
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (feelings.length) {
      await tx.checkIn.createMany({ data: feelings });
    }

    if (snap.family.length) {
      await tx.familyRecord.createMany({
        data: snap.family.map((row) => ({
          id: row.id,
          householdId,
          kind: row.kind,
          who: row.who,
          lastDone: row.lastDone,
          due: row.due,
          note: row.note ?? null,
        })),
      });
    }
  });
}

export function householdPublic(row: {
  id: string;
  name: string;
  joinCode: string;
  passwordHash: string | null;
}) {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.joinCode,
    hasPassword: Boolean(row.passwordHash),
  };
}
