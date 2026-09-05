"use client";

import { PersonSwitch } from "@/components/person-switch";
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
import type { ItemKind, TimeOfDay, Weight } from "@/lib/types";
import { TIME_ORDER } from "@/lib/types";
import Link from "next/link";
import { useState } from "react";

export default function HelperPage() {
  const { state, person, todayItems, addItem, removeItem } = useStore();

  if (state.role !== "helper") {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">Helper</h1>
        <p className="text-lg text-muted-foreground">
          Turn on “I’m helping” in Easier to add or change personal steps.
        </p>
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
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Helper</h1>
        <p className="text-lg text-muted-foreground">
          Personal steps for {person.name}. Checkups stay in Family Center.
        </p>
      </header>

      <PersonSwitch />
      <AddItemForm
        personId={person.id}
        onAdd={addItem}
      />

      <ul className="space-y-3">
        {todayItems.map((item) => (
          <li key={item.id} className="rounded-3xl border bg-card px-5 py-5">
            <p className="text-sm text-muted-foreground">
              {timeLabels[item.timeOfDay]} · {weightLabels[item.weight]}
            </p>
            <p className="mt-1 text-xl font-semibold">{item.title}</p>
            <Button
              variant="ghost"
              className="mt-2 h-11 px-0 text-base"
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
          </li>
        ))}
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
  }) => string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ItemKind>("med");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [weight, setWeight] = useState<Weight>("everyday");
  const [note, setNote] = useState("");
  const [place, setPlace] = useState("");

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
              });
              setTitle("");
              setNote("");
              setPlace("");
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
