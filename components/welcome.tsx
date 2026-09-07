"use client";

import { HouseMark } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { emailLooksOk } from "@/lib/email";
import { MAX_HOUSEHOLD_PEOPLE, MIN_PASSWORD_LENGTH } from "@/lib/limits";
import { NEED_REASONS } from "@/lib/reasons";
import { useStore } from "@/lib/store";
import type { NeedReason, Role } from "@/lib/types";
import { DEMO_JOIN_CODE, MEDICAL_DISCLAIMER } from "@/lib/types";
import { enableDeviceNotifications } from "@/lib/notify";
import { useState } from "react";

type Step =
  | "pick"
  | "login"
  | "claim"
  | "role"
  | "account"
  | "why"
  | "family-ask"
  | "family"
  | "review"
  | "join"
  | "notify";

type FamilyDraft = {
  firstName: string;
  age: string;
  email: string;
  weightNote: string;
  heightNote: string;
  conditions: string;
  extraNotes: string;
};

const emptyPerson = (): FamilyDraft => ({
  firstName: "",
  age: "",
  email: "",
  weightNote: "",
  heightNote: "",
  conditions: "",
  extraNotes: "",
});

export function WelcomeScreen() {
  const {
    phase,
    signup,
    login,
    claimInvite,
    joinHousehold,
    openDemo,
    stayLocal,
    finishNotify,
    state,
    setEase,
  } = useStore();
  const [step, setStep] = useState<Step>(phase === "notify" ? "notify" : "pick");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notifyNote, setNotifyNote] = useState<string | null>(null);

  const [role, setRole] = useState<Role>("person");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [age, setAge] = useState("");
  const [weightNote, setWeightNote] = useState("");
  const [heightNote, setHeightNote] = useState("");
  const [conditions, setConditions] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [showHeadExtra, setShowHeadExtra] = useState(false);
  const [reasons, setReasons] = useState<NeedReason[]>([]);
  const [people, setPeople] = useState<FamilyDraft[]>([]);
  const [inviteCode, setInviteCode] = useState("");
  const [viewEveryone, setViewEveryone] = useState(true);
  const [code, setCode] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  async function run(fn: () => Promise<string | null>, next?: Step) {
    setBusy(true);
    setError(null);
    const message = await fn();
    setBusy(false);
    if (message) {
      setError(message);
      return;
    }
    if (next) setStep(next);
  }

  function toggleReason(id: NeedReason) {
    setReasons((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id],
    );
  }

  function updatePerson(index: number, patch: Partial<FamilyDraft>) {
    setPeople((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  const extraSlots = MAX_HOUSEHOLD_PEOPLE - 1;
  const showNotify = phase === "notify" || step === "notify";

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro kicker="Next Up" title="Start here" mark={<HouseMark />}>
        <p>
          {step === "pick"
            ? "Log in or create a house. One next step. Your people."
            : step === "notify"
              ? "A ping when something is due — if this device can receive it."
              : "Plain words. Large buttons. You can skip extra medical notes."}
        </p>
      </PageIntro>

      {showNotify ? (
        <WeightCard className="space-y-4" weight="important">
          <h2 className="text-xl font-semibold">Turn on notifications?</h2>
          <p className="text-muted-foreground">
            If you allow it, this browser can show a banner while Next Up is
            open. Locked-screen push can work with Web Push if this site is set
            up for it and you say yes. A phone that is fully off, or has no
            network, cannot notify you. We will not pretend it can.
          </p>
          {state.household ? (
            <p className="text-sm text-muted-foreground">
              Signed in as {state.memberName}. House: {state.household.name}.
            </p>
          ) : null}
          {notifyNote ? <p>{notifyNote}</p> : null}
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const note = await enableDeviceNotifications();
              setBusy(false);
              setNotifyNote(note);
              if (!note.includes("blocked")) setEase({ reminders: true });
            }}
          >
            Allow notifications
          </Button>
          <Button
            variant="outline"
            className="h-14 w-full rounded-2xl text-lg"
            onClick={finishNotify}
          >
            Not now
          </Button>
        </WeightCard>
      ) : null}

      {!showNotify && step === "pick" ? (
        <div className="flex flex-col gap-3">
          <Button
            className="h-16 rounded-2xl text-lg font-semibold"
            onClick={() => {
              setError(null);
              setStep("login");
            }}
          >
            Log in
          </Button>
          <Button
            variant="outline"
            className="h-16 rounded-2xl text-lg font-semibold"
            onClick={() => {
              setError(null);
              setStep("role");
            }}
          >
            Sign up
          </Button>
          <Button
            variant="ghost"
            className="h-14 text-base"
            onClick={() => {
              setError(null);
              setStep("claim");
            }}
          >
            I have an invite code
          </Button>
          <Button
            variant="ghost"
            className="h-14 text-base"
            onClick={() => {
              setError(null);
              setStep("join");
            }}
          >
            Join with a house code
          </Button>
          <Button
            variant="ghost"
            className="h-12 text-base"
            disabled={busy}
            onClick={() => void run(openDemo)}
          >
            Open the sample house
          </Button>
          <Button variant="ghost" className="h-12 text-base" onClick={stayLocal}>
            Stay on this device only
          </Button>
          <p className="text-sm text-muted-foreground">
            Sample house uses code {DEMO_JOIN_CODE}. It is an example, not your
            family. No paid plan. This is not medical care.
          </p>
        </div>
      ) : null}

      {!showNotify && step === "login" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">Log in</h2>
          <Field id="login-email" label="Email" value={email} onChange={setEmail} type="email" />
          <Field
            id="login-pass"
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
          />
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={busy || !emailLooksOk(email) || !password}
            onClick={() => void run(() => login(email.trim(), password))}
          >
            Log in
          </Button>
          <Button variant="ghost" className="h-12" onClick={() => setStep("pick")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {!showNotify && step === "claim" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">Claim your invite</h2>
          <p className="text-muted-foreground">
            Use the email they added and the one-time code. Then set your own
            password.
          </p>
          <Field id="claim-email" label="Email" value={email} onChange={setEmail} type="email" />
          <Field
            id="claim-code"
            label="Invite code"
            value={inviteCode}
            onChange={(v) => setInviteCode(v.toUpperCase())}
          />
          <Field
            id="claim-pass"
            label="New password"
            value={password}
            onChange={setPassword}
            type="password"
          />
          <p className="text-sm font-medium">When you open this house</p>
          <Button
            type="button"
            variant={viewEveryone ? "default" : "outline"}
            className="h-14 justify-start rounded-2xl text-base"
            onClick={() => setViewEveryone(true)}
          >
            See everyone
          </Button>
          <Button
            type="button"
            variant={!viewEveryone ? "default" : "outline"}
            className="h-14 justify-start rounded-2xl text-base"
            onClick={() => setViewEveryone(false)}
          >
            Only me
          </Button>
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={
              busy ||
              !emailLooksOk(email) ||
              !inviteCode.trim() ||
              password.length < MIN_PASSWORD_LENGTH
            }
            onClick={() =>
              void run(() =>
                claimInvite(email.trim(), inviteCode.trim(), password, viewEveryone),
              )
            }
          >
            Claim and enter
          </Button>
          <Button variant="ghost" className="h-12" onClick={() => setStep("pick")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {!showNotify && step === "role" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">Who is this for?</h2>
          <Button
            type="button"
            variant={role === "person" ? "default" : "outline"}
            className="h-16 justify-start rounded-2xl text-lg"
            onClick={() => setRole("person")}
          >
            This is for me
          </Button>
          <Button
            type="button"
            variant={role === "helper" ? "default" : "outline"}
            className="h-16 justify-start rounded-2xl text-lg"
            onClick={() => setRole("helper")}
          >
            I’m a helper
          </Button>
          <Button className="h-14 w-full rounded-2xl text-lg" onClick={() => setStep("account")}>
            Continue
          </Button>
          <Button variant="ghost" className="h-12" onClick={() => setStep("pick")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {!showNotify && step === "account" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">You are the head of this house</h2>
          <p className="text-muted-foreground">
            Your email signs you in. Family you add later each need their own
            email. Same email cannot sit in two houses.
          </p>
          <Field id="head-name" label="Your first name" value={firstName} onChange={setFirstName} />
          <Field id="head-email" label="Your email" value={email} onChange={setEmail} type="email" />
          <Field
            id="head-pass"
            label={`Password (${MIN_PASSWORD_LENGTH}+ characters)`}
            value={password}
            onChange={setPassword}
            type="password"
          />
          <Field
            id="house-name"
            label="House name (optional)"
            value={householdName}
            onChange={setHouseholdName}
            placeholder={firstName ? `${firstName}’s house` : "Our house"}
          />
          {showHeadExtra ? (
            <div className="space-y-4">
              <Field id="head-age" label="Age (years, optional)" value={age} onChange={setAge} />
              <OptionalMedical
                idPrefix="head-"
                weightNote={weightNote}
                heightNote={heightNote}
                conditions={conditions}
                extraNotes={extraNotes}
                onWeight={setWeightNote}
                onHeight={setHeightNote}
                onConditions={setConditions}
                onExtra={setExtraNotes}
              />
            </div>
          ) : (
            <Button variant="outline" className="h-12 rounded-2xl" onClick={() => setShowHeadExtra(true)}>
              Add optional notes about you
            </Button>
          )}
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={
              !firstName.trim() ||
              !emailLooksOk(email) ||
              password.length < MIN_PASSWORD_LENGTH
            }
            onClick={() => setStep("why")}
          >
            Continue
          </Button>
          <Button variant="ghost" className="h-12" onClick={() => setStep("role")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {!showNotify && step === "why" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">Why are you here?</h2>
          <p className="text-muted-foreground">Pick any that fit. You can change this later.</p>
          {NEED_REASONS.map((row) => (
            <Button
              key={row.id}
              type="button"
              variant={reasons.includes(row.id) ? "default" : "outline"}
              className="h-auto min-h-16 justify-start whitespace-normal rounded-2xl py-3 text-left text-base"
              onClick={() => toggleReason(row.id)}
            >
              <span>
                <span className="block font-semibold">{row.label}</span>
                <span className="block text-sm opacity-80">{row.hint}</span>
              </span>
            </Button>
          ))}
          <Button className="h-14 w-full rounded-2xl text-lg" onClick={() => setStep("family-ask")}>
            Continue
          </Button>
          <Button variant="ghost" className="h-12" onClick={() => setStep("account")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {!showNotify && step === "family-ask" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">Whole family?</h2>
          <p className="text-muted-foreground">
            Up to {MAX_HOUSEHOLD_PEOPLE} people including you. Each person needs
            an email.
          </p>
          <Button
            className="h-16 rounded-2xl text-lg"
            onClick={() => {
              setPeople(people.length ? people : [emptyPerson()]);
              setStep("family");
            }}
          >
            Add family
          </Button>
          <Button
            variant="outline"
            className="h-16 rounded-2xl text-lg"
            onClick={() => {
              setPeople([]);
              setStep("review");
            }}
          >
            Just me
          </Button>
          <Button variant="ghost" className="h-12" onClick={() => setStep("why")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {!showNotify && step === "family" ? (
        <div className="space-y-4">
          {people.map((person, index) => (
            <WeightCard key={index} className="space-y-4">
              <h2 className="text-xl font-semibold">Person {index + 2}</h2>
              <Field
                id={`p-name-${index}`}
                label="First name"
                value={person.firstName}
                onChange={(v) => updatePerson(index, { firstName: v })}
              />
              <Field
                id={`p-age-${index}`}
                label="Age (years)"
                value={person.age}
                onChange={(v) => updatePerson(index, { age: v })}
              />
              <Field
                id={`p-email-${index}`}
                label="Email"
                value={person.email}
                onChange={(v) => updatePerson(index, { email: v })}
                type="email"
              />
              <OptionalMedical
                idPrefix={`p-${index}-`}
                weightNote={person.weightNote}
                heightNote={person.heightNote}
                conditions={person.conditions}
                extraNotes={person.extraNotes}
                onWeight={(v) => updatePerson(index, { weightNote: v })}
                onHeight={(v) => updatePerson(index, { heightNote: v })}
                onConditions={(v) => updatePerson(index, { conditions: v })}
                onExtra={(v) => updatePerson(index, { extraNotes: v })}
              />
              {people.length > 1 ? (
                <Button
                  variant="ghost"
                  className="h-12"
                  onClick={() => setPeople((prev) => prev.filter((_, i) => i !== index))}
                >
                  Remove
                </Button>
              ) : null}
            </WeightCard>
          ))}
          {people.length < extraSlots ? (
            <Button
              variant="outline"
              className="h-14 w-full rounded-2xl text-lg"
              onClick={() => setPeople((prev) => [...prev, emptyPerson()])}
            >
              Add another person
            </Button>
          ) : null}
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={
              people.some(
                (row) =>
                  !row.firstName.trim() ||
                  !row.age.trim() ||
                  !emailLooksOk(row.email),
              )
            }
            onClick={() => setStep("review")}
          >
            Continue
          </Button>
          <Button variant="ghost" className="h-12" onClick={() => setStep("family-ask")}>
            Back
          </Button>
        </div>
      ) : null}

      {!showNotify && step === "review" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">Emails for this house</h2>
          <ul className="space-y-2 text-base">
            <li>
              <strong>{firstName}</strong> (head) · {email}
            </li>
            {people.map((row) => (
              <li key={row.email}>
                <strong>{row.firstName}</strong> · {row.email}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            We will show invite codes on Family if email sending is not set up.
            We do not fake sending mail.
          </p>
          <p className="text-sm text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={busy}
            onClick={() =>
              void run(() =>
                signup({
                  role,
                  firstName: firstName.trim(),
                  email: email.trim(),
                  password,
                  householdName: householdName.trim() || undefined,
                  reasons,
                  age: age.trim() ? Number(age) : null,
                  weightNote: weightNote.trim() || undefined,
                  heightNote: heightNote.trim() || undefined,
                  conditions: conditions.trim() || undefined,
                  extraNotes: extraNotes.trim() || undefined,
                  people: people.map((row) => ({
                    firstName: row.firstName.trim(),
                    email: row.email.trim(),
                    age: row.age.trim() ? Number(row.age) : null,
                    weightNote: row.weightNote.trim() || undefined,
                    heightNote: row.heightNote.trim() || undefined,
                    conditions: row.conditions.trim() || undefined,
                    extraNotes: row.extraNotes.trim() || undefined,
                  })),
                }),
              )
            }
          >
            Create house
          </Button>
          <Button
            variant="ghost"
            className="h-12"
            onClick={() => setStep(people.length ? "family" : "family-ask")}
          >
            Back
          </Button>
        </WeightCard>
      ) : null}

      {!showNotify && step === "join" ? (
        <WeightCard className="space-y-4">
          <h2 className="text-xl font-semibold">House code</h2>
          <p className="text-muted-foreground">
            Sample house: {DEMO_JOIN_CODE}. A real house still needs the email
            the head added for you.
          </p>
          <Field
            id="join-code"
            label="House code"
            value={code}
            onChange={(v) => setCode(v.toUpperCase())}
            placeholder={DEMO_JOIN_CODE}
          />
          <Field
            id="join-email"
            label="Your email (skip for the sample)"
            value={joinEmail}
            onChange={setJoinEmail}
            type="email"
          />
          <Field
            id="join-pass"
            label="Your password (skip for the sample)"
            value={joinPassword}
            onChange={setJoinPassword}
            type="password"
          />
          <Button
            className="h-14 w-full rounded-2xl text-lg"
            disabled={busy || !code.trim()}
            onClick={() =>
              void run(() =>
                joinHousehold({
                  code: code.trim(),
                  email: joinEmail.trim() || undefined,
                  password: joinPassword.trim() || undefined,
                  role,
                }),
              )
            }
          >
            Join
          </Button>
          <Button variant="ghost" className="h-12" onClick={() => setStep("pick")}>
            Back
          </Button>
        </WeightCard>
      ) : null}

      {error ? <p className="text-base text-destructive">{error}</p> : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 text-lg"
      />
    </div>
  );
}

function OptionalMedical({
  idPrefix = "",
  weightNote,
  heightNote,
  conditions,
  extraNotes,
  onWeight,
  onHeight,
  onConditions,
  onExtra,
}: {
  idPrefix?: string;
  weightNote: string;
  heightNote: string;
  conditions: string;
  extraNotes: string;
  onWeight: (value: string) => void;
  onHeight: (value: string) => void;
  onConditions: (value: string) => void;
  onExtra: (value: string) => void;
}) {
  const [open, setOpen] = useState(
    Boolean(weightNote || heightNote || conditions || extraNotes),
  );
  if (!open) {
    return (
      <Button variant="outline" className="h-12 rounded-2xl" onClick={() => setOpen(true)}>
        Optional: weight, height, conditions, notes
      </Button>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Optional. Write in your own words. This is not a diagnosis picker and
        we will not name a disease as a fact about you.
      </p>
      <Field id={`${idPrefix}w`} label="Weight (optional)" value={weightNote} onChange={onWeight} />
      <Field id={`${idPrefix}h`} label="Height (optional)" value={heightNote} onChange={onHeight} />
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}c`} className="text-base">
          Conditions or syndromes (optional, your words)
        </Label>
        <Textarea
          id={`${idPrefix}c`}
          value={conditions}
          onChange={(e) => onConditions(e.target.value)}
          className="min-h-24 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}n`} className="text-base">
          Extra notes (optional)
        </Label>
        <Textarea
          id={`${idPrefix}n`}
          value={extraNotes}
          onChange={(e) => onExtra(e.target.value)}
          className="min-h-20 text-base"
        />
      </div>
      <Button
        variant="ghost"
        className="h-12"
        onClick={() => {
          onWeight("");
          onHeight("");
          onConditions("");
          onExtra("");
          setOpen(false);
        }}
      >
        Skip extra notes
      </Button>
    </div>
  );
}
