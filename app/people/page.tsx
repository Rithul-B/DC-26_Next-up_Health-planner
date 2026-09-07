"use client";

import { HelperMark } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { talkStyleLabels } from "@/lib/copy";
import { emailLooksOk } from "@/lib/email";
import { MAX_HOUSEHOLD_PEOPLE } from "@/lib/limits";
import { useStore } from "@/lib/store";
import type { TalkStyle } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const styles: TalkStyle[] = ["plain", "few-words", "encouraging"];

export default function PeoplePage() {
  const { state, addPerson, addHouseholdMember, removeMember } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [weightNote, setWeightNote] = useState("");
  const [heightNote, setHeightNote] = useState("");
  const [conditions, setConditions] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [talkStyle, setTalkStyle] = useState<TalkStyle>("plain");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canAdd =
    state.role === "helper" || state.isHead;
  const atCap = state.people.length >= MAX_HOUSEHOLD_PEOPLE;
  const synced = state.sync === "household";

  if (!canAdd) {
    return (
      <div className="space-y-4">
        <h1 className="page-title">People</h1>
        <p className="text-lg text-muted-foreground">
          Only a helper or the head can add a person.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/settings" />}
          className="h-12 rounded-2xl"
        >
          Go to Easier
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro title="People" mark={<HelperMark />}>
        <p>
          Up to {MAX_HOUSEHOLD_PEOPLE} people including the head. Each person in
          a shared house needs their own email. Conditions are your words, not a
          diagnosis.
        </p>
      </PageIntro>

      <ul className="space-y-2">
        {state.people.map((person) => {
          const invite = state.invites.find((row) => row.personId === person.id);
          return (
            <WeightCard key={person.id} as="li">
              <p className="text-lg font-semibold">{person.name}</p>
              <p className="text-sm text-muted-foreground">
                {talkStyleLabels[person.talkStyle]}
                {person.age != null ? ` · ${person.age}` : ""}
              </p>
              {invite?.email ? (
                <p className="text-sm text-muted-foreground">{invite.email}</p>
              ) : null}
              {person.conditions ? (
                <p className="mt-1 text-sm">Notes: {person.conditions}</p>
              ) : null}
              {state.isHead && invite && !invite.isHead ? (
                <Button
                  variant="ghost"
                  className="mt-2 h-11 px-0"
                  onClick={() => void removeMember(invite.id)}
                >
                  Remove from house
                </Button>
              ) : null}
            </WeightCard>
          );
        })}
      </ul>

      {atCap ? (
        <p className="text-muted-foreground">
          This house is full ({MAX_HOUSEHOLD_PEOPLE} people).
        </p>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Add a person</h2>
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim() || atCap) return;
              setError(null);
              if (synced) {
                if (!emailLooksOk(email) || !age.trim()) {
                  setError("Need first name, age, and an email.");
                  return;
                }
                setBusy(true);
                const message = await addHouseholdMember({
                  firstName: name.trim(),
                  email: email.trim(),
                  age: Number(age),
                  weightNote: weightNote.trim() || undefined,
                  heightNote: heightNote.trim() || undefined,
                  conditions: conditions.trim() || undefined,
                  extraNotes: extraNotes.trim() || undefined,
                  talkStyle,
                });
                setBusy(false);
                if (message) {
                  setError(message);
                  return;
                }
                router.push("/family");
                return;
              }
              addPerson({
                name: name.trim(),
                talkStyle,
                age: age.trim() ? Number(age) : undefined,
                weightNote: weightNote.trim() || undefined,
                heightNote: heightNote.trim() || undefined,
                conditions: conditions.trim() || undefined,
                extraNotes: extraNotes.trim() || undefined,
              });
              router.push("/helper");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">First name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="h-14 text-lg"
              />
            </div>
            {synced ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 text-lg"
                />
              </div>
            ) : null}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">How to talk</legend>
              <div className="flex flex-col gap-2">
                {styles.map((style) => (
                  <Button
                    key={style}
                    type="button"
                    variant={talkStyle === style ? "default" : "outline"}
                    className="h-14 justify-start rounded-2xl text-base"
                    onClick={() => setTalkStyle(style)}
                  >
                    {talkStyleLabels[style]}
                  </Button>
                ))}
              </div>
            </fieldset>
            <p className="text-sm text-muted-foreground">
              Optional notes. Skip if you want. Not a disease picker.
            </p>
            <div className="space-y-2">
              <Label htmlFor="w">Weight (optional)</Label>
              <Input id="w" value={weightNote} onChange={(e) => setWeightNote(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h">Height (optional)</Label>
              <Input id="h" value={heightNote} onChange={(e) => setHeightNote(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c">Conditions or syndromes (optional, your words)</Label>
              <Textarea id="c" value={conditions} onChange={(e) => setConditions(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n">Extra notes (optional)</Label>
              <Textarea id="n" value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} />
            </div>
            {error ? <p className="text-destructive">{error}</p> : null}
            <Button type="submit" className="h-14 w-full rounded-2xl text-lg" disabled={busy}>
              Add person
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
