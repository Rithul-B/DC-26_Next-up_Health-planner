import { prisma } from "@/lib/db";
import { completionKey } from "@/lib/dates";
import type {
  CheckInFeeling,
  FamilyKind,
  FamilyRecord,
  HouseholdSnapshot,
  InviteInfo,
  ItemKind,
  Person,
  PersonalItem,
  SymptomNote,
  TalkStyle,
  TimeOfDay,
  Weight,
} from "@/lib/types";
import { WHOLE_FAMILY } from "@/lib/types";

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

function mapPerson(row: {
  id: string;
  name: string;
  talkStyle: string;
  age: number | null;
  weightNote: string | null;
  heightNote: string | null;
  conditions: string | null;
  extraNotes: string | null;
}): Person {
  return {
    id: row.id,
    name: row.name,
    talkStyle: row.talkStyle as TalkStyle,
    age: row.age ?? undefined,
    weightNote: row.weightNote ?? undefined,
    heightNote: row.heightNote ?? undefined,
    conditions: row.conditions ?? undefined,
    extraNotes: row.extraNotes ?? undefined,
  };
}

export async function readSnapshot(
  householdId: string,
): Promise<HouseholdSnapshot> {
  const [people, items, completions, postponed, checkIns, family, symptoms] =
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
      prisma.symptomNote.findMany({
        where: { householdId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const checkMap: Record<string, CheckInFeeling> = {};
  for (const row of checkIns) {
    checkMap[completionKey(row.personId, row.day)] = row.feeling as CheckInFeeling;
  }

  return {
    people: people.map(mapPerson),
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
    symptoms: symptoms.map(
      (row): SymptomNote => ({
        id: row.id,
        personId: row.personId,
        feltOn: row.feltOn,
        body: row.body,
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

function personData(person: Person, householdId: string, index: number) {
  return {
    id: person.id,
    householdId,
    name: person.name,
    talkStyle: person.talkStyle,
    sortOrder: index,
    age: person.age ?? null,
    weightNote: person.weightNote ?? null,
    heightNote: person.heightNote ?? null,
    conditions: person.conditions ?? null,
    extraNotes: person.extraNotes ?? null,
  };
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
    await tx.symptomNote.deleteMany({ where: { householdId } });
    await tx.person.deleteMany({ where: { householdId } });

    if (snap.people.length) {
      await tx.person.createMany({
        data: snap.people.map((person, index) =>
          personData(person, householdId, index),
        ),
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

    if (snap.symptoms.length) {
      await tx.symptomNote.createMany({
        data: snap.symptoms.map((row) => ({
          id: row.id,
          householdId,
          personId: row.personId,
          feltOn: row.feltOn,
          body: row.body,
        })),
      });
    }
  });
}

function keysForPerson(
  map: Record<string, string[]>,
  personId: string,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(map)) {
    if (key.startsWith(`${personId}:`)) out[key] = value;
  }
  return out;
}

function keysExceptPerson(
  map: Record<string, string[]>,
  personId: string,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(map)) {
    if (!key.startsWith(`${personId}:`)) out[key] = value;
  }
  return out;
}

export function filterSnapshot(
  snap: HouseholdSnapshot,
  personId: string,
  viewEveryone: boolean,
  isHead: boolean,
): HouseholdSnapshot {
  if (isHead || viewEveryone) return snap;
  const feelings: HouseholdSnapshot["checkIns"] = {};
  for (const [key, feeling] of Object.entries(snap.checkIns)) {
    if (key.startsWith(`${personId}:`)) feelings[key] = feeling;
  }
  return {
    people: snap.people.filter((person) => person.id === personId),
    items: snap.items.filter((item) => item.personId === personId),
    completions: keysForPerson(snap.completions, personId),
    postponed: keysForPerson(snap.postponed, personId),
    checkIns: feelings,
    family: snap.family.filter(
      (row) => row.who === personId || row.who === WHOLE_FAMILY,
    ),
    symptoms: snap.symptoms.filter((row) => row.personId === personId),
  };
}

export function mergeMemberSnapshot(
  existing: HouseholdSnapshot,
  incoming: HouseholdSnapshot,
  personId: string,
): HouseholdSnapshot {
  const otherPeople = existing.people.filter((person) => person.id !== personId);
  const self = incoming.people.find((person) => person.id === personId);
  const feelings: HouseholdSnapshot["checkIns"] = {};
  for (const [key, feeling] of Object.entries(existing.checkIns)) {
    if (!key.startsWith(`${personId}:`)) feelings[key] = feeling;
  }
  for (const [key, feeling] of Object.entries(incoming.checkIns)) {
    if (key.startsWith(`${personId}:`)) feelings[key] = feeling;
  }
  return {
    people: self ? [...otherPeople, self] : existing.people,
    items: [
      ...existing.items.filter((item) => item.personId !== personId),
      ...incoming.items.filter((item) => item.personId === personId),
    ],
    completions: {
      ...keysExceptPerson(existing.completions, personId),
      ...keysForPerson(incoming.completions, personId),
    },
    postponed: {
      ...keysExceptPerson(existing.postponed, personId),
      ...keysForPerson(incoming.postponed, personId),
    },
    checkIns: feelings,
    family: existing.family,
    symptoms: [
      ...existing.symptoms.filter((row) => row.personId !== personId),
      ...incoming.symptoms.filter((row) => row.personId === personId),
    ],
  };
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

export async function listInvites(householdId: string): Promise<InviteInfo[]> {
  const members = await prisma.member.findMany({
    where: { householdId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.user?.email ?? "",
    inviteCode: member.claimedAt ? null : member.inviteCode,
    claimed: Boolean(member.claimedAt),
    isHead: member.isHead,
    personId: member.personId,
  }));
}
