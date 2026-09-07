"use client";

import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { EmptyMark, FeelingMark, HelperMark } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adviceIntro,
  careTopics,
  journalPrompt,
  livingTips,
  redFlagLines,
  verbalSessions,
  verbalTherapyNote,
} from "@/lib/advice";
import { formatDay, todayKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { MEDICAL_DISCLAIMER } from "@/lib/types";
import { useMemo, useState } from "react";

type Place = {
  id: string;
  name: string;
  kind: "hospital" | "pharmacy";
  lat: number;
  lon: number;
  address?: string;
  mapsUrl: string;
  osmUrl: string;
};

export default function AdvicePage() {
  const { state, person, addSymptom, removeSymptom, screenWeight } = useStore();
  const few = state.ease.fewWords;
  const [tab, setTab] = useState<"journal" | "topics" | "talk" | "near">(
    "journal",
  );

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro
        kicker={few ? "Tips" : "Calm notes"}
        title={few ? "Advice" : "Advice"}
        mark={<HelperMark />}
        quiet={screenWeight === "critical"}
      >
        <p>{few ? "Not a diagnosis." : adviceIntro}</p>
      </PageIntro>

      <WeightCard weight="important">
        <MedicalDisclaimer />
      </WeightCard>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Advice">
        {(
          [
            ["journal", few ? "Notes" : "Journal"],
            ["topics", few ? "Topics" : "Care topics"],
            ["talk", few ? "Pause" : "A quiet pause"],
            ["near", few ? "Near" : "Nearby"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={tab === id ? "default" : "outline"}
            className="h-12 rounded-full px-4 text-base"
            onClick={() => setTab(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "journal" ? (
        <Journal
          few={few}
          notes={state.symptoms.filter((row) => row.personId === person.id)}
          onAdd={addSymptom}
          onRemove={removeSymptom}
        />
      ) : null}
      {tab === "topics" ? <Topics few={few} /> : null}
      {tab === "talk" ? <Talk few={few} /> : null}
      {tab === "near" ? <Nearby few={few} /> : null}
    </div>
  );
}

function Journal({
  few,
  notes,
  onAdd,
  onRemove,
}: {
  few: boolean;
  notes: { id: string; feltOn: string; body: string }[];
  onAdd: (body: string, feltOn?: string) => void;
  onRemove: (id: string) => void;
}) {
  const [body, setBody] = useState("");
  const [feltOn, setFeltOn] = useState(todayKey());

  return (
    <div className="space-y-4">
      <WeightCard className="space-y-3">
        <h2 className="text-xl font-semibold">
          {few ? "What you noticed" : "Symptom journal"}
        </h2>
        <p className="text-muted-foreground">{journalPrompt()}</p>
        <p className="text-sm text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
        <div className="space-y-2">
          <Label htmlFor="felt">Day</Label>
          <Input
            id="felt"
            type="date"
            value={feltOn}
            onChange={(e) => setFeltOn(e.target.value)}
            className="h-12"
          />
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-28 text-base"
          placeholder="Tired after lunch. Warm forehead. Not sure."
        />
        <Button
          className="h-14 w-full rounded-2xl text-lg"
          disabled={!body.trim()}
          onClick={() => {
            onAdd(body.trim(), feltOn);
            setBody("");
          }}
        >
          Save note
        </Button>
      </WeightCard>

      <WeightCard weight="important" className="space-y-2">
        <h2 className="text-xl font-semibold">Get urgent care if</h2>
        <ul className="list-disc space-y-2 pl-5">
          {redFlagLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          In the US, 911 for emergency. 988 for suicide and crisis. We cannot
          diagnose you from these notes.
        </p>
      </WeightCard>

      {notes.length === 0 ? (
        <WeightCard>
          <EmptyMark className="mb-3 h-14 w-14" />
          <p>{few ? "No notes yet." : "No journal notes yet."}</p>
        </WeightCard>
      ) : (
        <ul className="space-y-3">
          {notes.map((row) => (
            <WeightCard key={row.id} as="li">
              <p className="text-sm text-muted-foreground">{formatDay(row.feltOn)}</p>
              <p className="mt-1 text-lg">{row.body}</p>
              <Button
                variant="ghost"
                className="mt-2 h-11 px-0"
                onClick={() => onRemove(row.id)}
              >
                Remove
              </Button>
            </WeightCard>
          ))}
        </ul>
      )}
    </div>
  );
}

function Topics({ few }: { few: boolean }) {
  const [open, setOpen] = useState<string | null>(careTopics[0].id);
  return (
    <div className="space-y-4">
      {careTopics.map((topic) => (
        <WeightCard key={topic.id} className="space-y-3">
          <Button
            variant="ghost"
            className="h-auto w-full justify-start px-0 text-left text-xl font-semibold"
            onClick={() => setOpen(open === topic.id ? null : topic.id)}
          >
            {topic.title}
          </Button>
          {open === topic.id ? (
            <>
              <p className="text-muted-foreground">{topic.summary}</p>
              <ul className="list-disc space-y-2 pl-5">
                {topic.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              <p className="font-medium">When to seek care</p>
              <p>{topic.seekCare}</p>
              <p className="text-sm text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
            </>
          ) : (
            <p className="text-muted-foreground">{few ? "" : topic.summary}</p>
          )}
        </WeightCard>
      ))}
      {livingTips.map((block) => (
        <WeightCard key={block.id} className="space-y-3">
          <h2 className="text-xl font-semibold">{block.title}</h2>
          <ul className="list-disc space-y-2 pl-5">
            {block.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </WeightCard>
      ))}
    </div>
  );
}

function Talk({ few }: { few: boolean }) {
  const [active, setActive] = useState<(typeof verbalSessions)[number] | null>(
    null,
  );
  const [step, setStep] = useState(0);

  if (active) {
    const line = active.steps[step];
    return (
      <WeightCard className="space-y-4" weight="important">
        <p className="text-sm text-muted-foreground">{active.title}</p>
        <p className="text-2xl font-semibold leading-snug">{line}</p>
        <FeelingMark feeling="ok" className="h-16 w-16" />
        <div className="flex flex-col gap-2">
          {step < active.steps.length - 1 ? (
            <Button
              className="h-14 rounded-2xl text-lg"
              onClick={() => setStep((n) => n + 1)}
            >
              Next
            </Button>
          ) : (
            <Button className="h-14 rounded-2xl text-lg" onClick={() => setActive(null)}>
              Done
            </Button>
          )}
          <Button variant="ghost" className="h-12" onClick={() => setActive(null)}>
            Stop
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{verbalTherapyNote}</p>
      </WeightCard>
    );
  }

  return (
    <div className="space-y-4">
      <WeightCard>
        <p>{few ? "A short pause. Not therapy." : verbalTherapyNote}</p>
      </WeightCard>
      {verbalSessions.map((session) => (
        <WeightCard key={session.id} className="space-y-3">
          <h2 className="text-xl font-semibold">{session.title}</h2>
          <p className="text-muted-foreground">
            {session.steps.length} short steps. Stop whenever you want.
          </p>
          <Button
            className="h-14 rounded-2xl text-lg"
            onClick={() => {
              setActive(session);
              setStep(0);
            }}
          >
            Start
          </Button>
        </WeightCard>
      ))}
    </div>
  );
}

function Nearby({ few }: { few: boolean }) {
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [source, setSource] = useState<string | null>(null);

  const hospitals = useMemo(
    () => places.filter((row) => row.kind === "hospital"),
    [places],
  );
  const pharmacies = useMemo(
    () => places.filter((row) => row.kind === "pharmacy"),
    [places],
  );

  async function load(params: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/places?${params}`);
      const data = (await res.json()) as {
        places?: Place[];
        error?: string;
        source?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Map search failed.");
        setPlaces([]);
        return;
      }
      setPlaces(data.places ?? []);
      setSource(data.source ?? null);
    } catch {
      setError("Map search failed. Try a city name.");
      setPlaces([]);
    } finally {
      setBusy(false);
    }
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setError("This browser cannot share a location. Type a city instead. We will not fake GPS.");
      return;
    }
    setBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void load(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      },
      () => {
        setBusy(false);
        setError(
          "Location was denied or failed. Type a city. We will not invent a pin.",
        );
      },
      { enableHighAccuracy: false, timeout: 12_000 },
    );
  }

  return (
    <div className="space-y-4">
      <WeightCard className="space-y-3">
        <h2 className="text-xl font-semibold">
          {few ? "Hospitals and pharmacies" : "Nearby hospitals and pharmacies"}
        </h2>
        <p className="text-muted-foreground">
          Map data from OpenStreetMap. Links open routing. This is not an
          emergency dispatcher.
        </p>
        <Button
          className="h-14 w-full rounded-2xl text-lg"
          disabled={busy}
          onClick={useLocation}
        >
          Use my location
        </Button>
        <div className="space-y-2">
          <Label htmlFor="city">Or search by city</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-14 text-lg"
            placeholder="City or town"
          />
        </div>
        <Button
          variant="outline"
          className="h-14 w-full rounded-2xl text-lg"
          disabled={busy || !city.trim()}
          onClick={() => void load(`city=${encodeURIComponent(city.trim())}`)}
        >
          Search this city
        </Button>
        {source ? (
          <p className="text-sm text-muted-foreground">Source: {source}</p>
        ) : null}
        {error ? <p className="text-destructive">{error}</p> : null}
      </WeightCard>

      <PlaceList title="Hospitals" rows={hospitals} />
      <PlaceList title="Pharmacies" rows={pharmacies} />
    </div>
  );
}

function PlaceList({ title, rows }: { title: string; rows: Place[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="space-y-3">
        {rows.map((row) => (
          <WeightCard key={row.id} as="li" className="space-y-2">
            <p className="text-lg font-semibold">{row.name}</p>
            {row.address ? (
              <p className="text-sm text-muted-foreground">{row.address}</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                nativeButton={false}
                render={
                  <a href={row.mapsUrl} target="_blank" rel="noreferrer" />
                }
                className="h-12 rounded-2xl"
              >
                Directions
              </Button>
              <Button
                nativeButton={false}
                render={<a href={row.osmUrl} target="_blank" rel="noreferrer" />}
                variant="outline"
                className="h-12 rounded-2xl"
              >
                Open map
              </Button>
            </div>
          </WeightCard>
        ))}
      </ul>
    </div>
  );
}
