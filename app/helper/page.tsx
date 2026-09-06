"use client";

import { EmptyMark, HelperMark, WeightPip } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { PersonSwitch } from "@/components/person-switch";
import { WeightCard } from "@/components/weight-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { timeLabels, weightLabels } from "@/lib/copy";
import { useStore } from "@/lib/store";
import type { ItemKind, PersonalItem, TimeOfDay, Weight } from "@/lib/types";
import { TIME_ORDER } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

export default function HelperPage() {
  const {
    state,
    person,
    todayItems,
    addItem,
    updateItem,
    removeItem,
    checkIn,
  } = useStore();

  if (state.role !== "helper") {
    return (
      <div className="space-y-4">
        <PageIntro title="Helper" mark={<HelperMark />}>
          <p>
            Turn on “I’m helping” in Easier to add or change personal steps.
          </p>
        </PageIntro>
        <Button
          nativeButton={false}
          render={<Link href="/settings" />}
          className="h-12 rounded-2xl text-base"
        >
          Go to Easier
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro
        kicker="Looking after"
        title="Helper"
        mark={<HelperMark />}
      >
        <p>
          Personal steps for {person.name}. Checkups stay in Family Center.
        </p>
      </PageIntro>

      <PersonSwitch />

      <WeightCard>
        <p className="text-sm font-medium text-muted-foreground">
          Today’s check-in
        </p>
        <p className="mt-1 text-xl font-semibold">
          {checkIn
            ? checkIn === "good"
              ? "Today feels good."
              : checkIn === "ok"
                ? "Today feels okay."
                : "Today feels hard."
            : "Not filled in yet."}
        </p>
      </WeightCard>

      <AddItemForm
        personId={person.id}
        onAdd={addItem}
      />

      <ul className="space-y-3">
        {todayItems.length === 0 ? (
          <WeightCard as="li">
            <EmptyMark className="mb-3 h-14 w-14" />
            <p className="text-lg">No personal steps yet.</p>
          </WeightCard>
        ) : (
          todayItems.map((item) => (
            <WeightCard
              key={item.id}
              as="li"
              weight={item.weight}
              period={item.timeOfDay}
            >
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <WeightPip weight={item.weight} />
                {timeLabels[item.timeOfDay]} · {weightLabels[item.weight]}
              </p>
              <p className="mt-1 text-xl font-semibold">{item.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <EditItemForm item={item} onSave={updateItem} />
                <Button
                  variant="ghost"
                  className="h-11 px-2 text-base"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove “${item.title}” from ${person.name}’s list?`,
                      )
                    ) {
                      removeItem(item.id);
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </WeightCard>
          ))
        )}
      </ul>

      <Button
        nativeButton={false}
        render={<Link href="/people" />}
        variant="outline"
        className="h-12 rounded-2xl text-base"
      >
        Add a person
      </Button>
    </div>
  );
}

function AddItemForm({
  personId,
  onAdd,
}: {
  personId: string;
  onAdd: (item: {
    personId: string;
    kind: ItemKind;
    title: string;
    timeOfDay: TimeOfDay;
    weight: Weight;
    note?: string;
    place?: string;
    due?: string;
  }) => string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ItemKind>("med");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [weight, setWeight] = useState<Weight>("everyday");
  const [note, setNote] = useState("");
  const [place, setPlace] = useState("");
  const [due, setDue] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={
          <Button className="h-14 rounded-2xl text-lg font-semibold">
            Add a personal step
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a step</DialogTitle>
          <DialogDescription>
            Weight changes how still the app feels. It does not diagnose anyone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">What</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Evening heart tablet"
            />
          </div>
          <div className="space-y-2">
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ItemKind)}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="med">Medicine</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>When</Label>
            <Select
              value={timeOfDay}
              onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}
            >
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>
                    {timeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Weight</Label>
            <Select
              value={weight}
              onValueChange={(v) => setWeight(v as Weight)}
            >
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["everyday", "important", "critical"] as const).map((w) => (
                  <SelectItem key={w} value={w}>
                    {weightLabels[w]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="place">Place (optional)</Label>
            <Input
              id="place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Plain note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Remind on this day (optional)</Label>
            <Input
              id="due"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="h-12"
            disabled={!title.trim()}
            onClick={() => {
              onAdd({
                personId,
                kind,
                title: title.trim(),
                timeOfDay,
                weight,
                note: note || undefined,
                place: place || undefined,
                due: due || undefined,
              });
              setTitle("");
              setNote("");
              setPlace("");
              setDue("");
              setOpen(false);
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditItemForm({
  item,
  onSave,
}: {
  item: PersonalItem;
  onSave: (id: string, patch: Partial<Omit<PersonalItem, "id">>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [kind, setKind] = useState<ItemKind>(item.kind);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(item.timeOfDay);
  const [weight, setWeight] = useState<Weight>(item.weight);
  const [note, setNote] = useState(item.note ?? "");
  const [place, setPlace] = useState(item.place ?? "");
  const [due, setDue] = useState(item.due ?? "");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTitle(item.title);
          setKind(item.kind);
          setTimeOfDay(item.timeOfDay);
          setWeight(item.weight);
          setNote(item.note ?? "");
          setPlace(item.place ?? "");
          setDue(item.due ?? "");
        }
      }}
    >
      <DialogTrigger
        nativeButton={false}
        render={
          <Button variant="outline" className="h-11 rounded-2xl text-base">
            Edit
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change this step</DialogTitle>
          <DialogDescription>
            Keep the words short. Weight is how still this should feel — not a
            diagnosis.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`edit-title-${item.id}`}>What</Label>
            <Input
              id={`edit-title-${item.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Kind</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as ItemKind)}>
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="med">Medicine</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>When</Label>
            <Select
              value={timeOfDay}
              onValueChange={(v) => setTimeOfDay(v as TimeOfDay)}
            >
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_ORDER.map((t) => (
                  <SelectItem key={t} value={t}>
                    {timeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Weight</Label>
            <Select
              value={weight}
              onValueChange={(v) => setWeight(v as Weight)}
            >
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["everyday", "important", "critical"] as const).map((w) => (
                  <SelectItem key={w} value={w}>
                    {weightLabels[w]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-place-${item.id}`}>Place (optional)</Label>
            <Input
              id={`edit-place-${item.id}`}
              value={place}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-note-${item.id}`}>Plain note</Label>
            <Input
              id={`edit-note-${item.id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-due-${item.id}`}>Remind on this day</Label>
            <Input
              id={`edit-due-${item.id}`}
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="h-12"
            disabled={!title.trim()}
            onClick={() => {
              onSave(item.id, {
                kind,
                title: title.trim(),
                timeOfDay,
                weight,
                note: note || undefined,
                place: place || undefined,
                due: due || undefined,
              });
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
