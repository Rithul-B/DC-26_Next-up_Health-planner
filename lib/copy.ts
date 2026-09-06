import type {
  CheckInFeeling,
  FamilyKind,
  Person,
  PersonalItem,
  TalkStyle,
  TimeOfDay,
  Weight,
} from "@/lib/types";

export const timeLabels: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export const weightLabels: Record<Weight, string> = {
  everyday: "Everyday",
  important: "Important",
  critical: "Critical",
};

export const familyKindLabels: Record<FamilyKind, string> = {
  checkup: "Checkup",
  dentist: "Dentist",
  eyes: "Eyes",
  vaccine: "Vaccine",
  other: "Other",
};

export function greeting(person: Person, weight: Weight): string {
  if (weight === "critical") return person.name;
  if (person.talkStyle === "encouraging") return `Hey ${person.name}.`;
  if (person.talkStyle === "few-words") return person.name;
  return `Hi ${person.name}.`;
}

export function periodLine(
  period: TimeOfDay,
  weight: Weight,
  style: TalkStyle,
): string {
  if (weight === "critical") return "";
  if (weight === "important") {
    if (period === "morning") return "Start with this.";
    if (period === "afternoon") return "Still on the list.";
    if (period === "evening") return "Before the day closes.";
    return "This is still waiting.";
  }
  if (style === "few-words") {
    if (period === "morning") return "Morning.";
    if (period === "afternoon") return "Afternoon.";
    if (period === "evening") return "Evening.";
    return "Night.";
  }
  if (style === "encouraging") {
    if (period === "morning") return "Easy start. One small thing.";
    if (period === "afternoon") return "The day is open. This is next.";
    if (period === "evening") return "Almost through. Then you can stop.";
    return "Keep this short. Then rest.";
  }
  if (period === "morning") return "The kettle part of the day.";
  if (period === "afternoon") return "Daylight still. This is next.";
  if (period === "evening") return "Lamps on. Then you’re free.";
  return "Quiet hours. One last step.";
}

export function householdLine(
  name: string,
  waiting: number,
  weight: Weight,
): string {
  if (weight === "critical") return name;
  const you = name === "You";
  if (waiting === 0) return you ? "You’re clear" : `${name} is clear`;
  if (waiting === 1) return you ? "You have one" : `${name} has one`;
  return you ? `You have ${waiting}` : `${name} has ${waiting}`;
}

export function nextHeading(weight: Weight, style: TalkStyle): string {
  if (weight === "critical") return "This one matters";
  if (weight === "important") return "Next up";
  if (style === "encouraging") return "Your next easy step";
  if (style === "few-words") return "Next";
  return "Your next thing";
}

export function whyLine(item: PersonalItem, style: TalkStyle): string {
  if (item.weight === "critical") return "Do this now. Then you can rest.";
  if (item.kind === "appointment") {
    return item.place ? `At ${item.place}.` : "This visit is today.";
  }
  if (style === "encouraging") return "Small step. Then you’re done.";
  if (style === "few-words") return "Take it. Then tick it.";
  return "When this is done, you’re free for a bit.";
}

export function helperWhisper(item: PersonalItem): string | undefined {
  const text = item.note?.trim();
  return text ? text : undefined;
}

function joinTitles(items: PersonalItem[]): string {
  const titles = items.map((item) => item.title);
  if (titles.length === 0) return "";
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} and ${titles[1]}`;
  return `${titles.length} things`;
}

function actorName(person: Person): string {
  return person.name === "You" ? "You" : person.name;
}

export function tonightHeading(style: TalkStyle, period: TimeOfDay): string {
  const nightish = period === "evening" || period === "night";
  if (style === "few-words") return nightish ? "Enough for tonight" : "Enough for today";
  if (nightish) return "That’s enough for tonight";
  return "That’s enough for today";
}

export function tonightDoneLine(
  done: PersonalItem[],
  person: Person,
  style: TalkStyle,
): string {
  if (done.length === 0) return "";
  const who = actorName(person);
  const what = joinTitles(done);
  if (style === "few-words") {
    return done.length <= 2 ? what : `${done.length} done.`;
  }
  if (who === "You") {
    if (style === "encouraging") {
      return done.length <= 2 ? `You did ${what}. That counts.` : `You did ${what} today. That counts.`;
    }
    return done.length <= 2 ? `You did ${what}.` : `You did ${what} today.`;
  }
  if (style === "encouraging") {
    return done.length <= 2
      ? `${who} did ${what}. That counts.`
      : `${who} did ${what} today. That counts.`;
  }
  return done.length <= 2 ? `${who} did ${what}.` : `${who} did ${what} today.`;
}

export function tonightMorningLine(
  waiting: PersonalItem[],
  style: TalkStyle,
): string {
  if (waiting.length === 0) {
    if (style === "few-words") return "Nothing for morning.";
    return "Nothing waiting for morning.";
  }
  const what = joinTitles(waiting);
  if (style === "few-words") return `${what} in the morning.`;
  if (style === "encouraging") {
    return `${what} can wait until morning. You’re free now.`;
  }
  return `${what} can wait until morning.`;
}

export function doneLine(weight: Weight, style: TalkStyle): string {
  if (weight === "critical") return "Marked done.";
  if (style === "encouraging") return "Nice. That’s done.";
  if (style === "few-words") return "Done.";
  return "Nice. That’s one less thing.";
}

export function caughtUp(style: TalkStyle): string {
  if (style === "encouraging") return "You’re all caught up. That’s enough for now.";
  if (style === "few-words") return "Nothing waiting.";
  return "Nothing waiting. You’re all caught up.";
}

export function checkInPrompt(style: TalkStyle): string {
  if (style === "few-words") return "How is today?";
  if (style === "encouraging") return "Quick check — how does today feel?";
  return "How is today going?";
}

export const checkInLabels: Record<CheckInFeeling, string> = {
  good: "Good",
  ok: "Okay",
  hard: "Hard",
};

export const talkStyleLabels: Record<TalkStyle, string> = {
  plain: "Plain and calm",
  "few-words": "Few words",
  encouraging: "Encouraging",
};
