"use client";

import { PersonSwitch } from "@/components/person-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { familyKindLabels } from "@/lib/copy";
import { dueLabel, formatShort, isDueSoon, todayKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import type { FamilyKind, Weight } from "@/lib/types";
import { WHOLE_FAMILY } from "@/lib/types";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Filter = "soon" | "done" | "all";

export default function FamilyPage() {
  const { state, addFamily, markFamilyDone, promoteFamily } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const helper = state.role === "helper";

  const rows = useMemo(() => {
    return state.family
      .slice()
      .sort((a, b) => a.due.localeCompare(b.due))
      .filter((row) => {
        const soon = isDueSoon(row.due);
        if (filter === "soon") return soon;
        if (filter === "done") return !soon;
        return true;
      });
  }, [state.family, filter]);

  function whoName(who: string) {
    if (who === WHOLE_FAMILY) return "Everyone";
    return state.people.find((p) => p.id === who)?.name ?? "Someone";
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Family Center</h1>
        <p className="text-lg text-muted-foreground">
          Checkups for the whole household. No extra accounts. Everyday stuff
          stays here.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter">
        {(
          [
            ["all", "Everyone"],
            ["soon", "Due soon"],
            ["done", "On track"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            variant={filter === id ? "default" : "outline"}
            className="h-12 rounded-full px-4 text-base"
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-3xl border bg-card px-6 py-8 text-lg">
          Nothing in this view.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-3xl border bg-card px-5 py-5">
              <p className="text-sm font-medium text-muted-foreground">
                {familyKindLabels[row.kind]} · {whoName(row.who)}
              </p>
              <p className="mt-1 text-xl font-semibold">{dueLabel(row.due)}</p>
              <p className="mt-1 text-muted-foreground">
                Last {formatShort(row.lastDone)}
                {row.note ? ` · ${row.note}` : ""}
              </p>
              {helper ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <MarkDoneButton
                    onSave={(nextDue, note) =>
                      markFamilyDone(row.id, nextDue, note)
                    }
                  />
                  <PromoteButton
                    onPromote={(weight) => promoteFamily(row.id, weight)}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {helper ? <AddFamilyForm onAdd={addFamily} /> : (
        <p className="text-sm text-muted-foreground">
          Switch to “I’m helping” in Easier to add a checkup.
        </p>
      )}
    </div>
  );
}

function MarkDoneButton({
  onSave,
}: {
  onSave: (nextDue: string, note?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={
          <Button variant="outline" className="h-12 rounded-2xl text-base">
            Mark visit done
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Visit is done</DialogTitle>
          <DialogDescription>
            When should this come back? Use a date. Today is {todayKey()}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="next-due">Next due</Label>
            <Input
              id="next-due"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="visit-note">Note (optional)</Label>
            <Input
              id="visit-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="h-12"
            disabled={!due}
            onClick={() => {
              onSave(due, note || undefined);
              setOpen(false);
              setDue("");
              setNote("");
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PromoteButton({
  onPromote,
}: {
  onPromote: (weight: Weight) => string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={
          <Button variant="ghost" className="h-12 rounded-2xl text-base">
            Move to their Today
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>This follow-up matters more</DialogTitle>
          <DialogDescription>
            Puts a step on their personal Today. Family Center keeps the history.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            className="h-12"
            onClick={() => {
              onPromote("important");
              setOpen(false);
              router.push("/today");
            }}
          >
            Important
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => {
              onPromote("critical");
              setOpen(false);
              router.push("/");
            }}
          >
            Critical
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddFamilyForm({
  onAdd,
}: {
  onAdd: (row: {
    kind: FamilyKind;
    who: string;
    lastDone: string;
    due: string;
    note?: string;
  }) => void;
}) {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FamilyKind>("checkup");
  const [who, setWho] = useState(WHOLE_FAMILY);
  const [lastDone, setLastDone] = useState(todayKey());
  const [due, setDue] = useState("");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        nativeButton={false}
        render={
          <Button className="h-14 rounded-2xl text-lg font-semibold">
            Add a checkup
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Family Center</DialogTitle>
          <DialogDescription>
            Tag a name or everyone. This does not create an account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Kind</Label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as FamilyKind)}
            >
              <SelectTrigger className="h-12 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(familyKindLabels).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Who</Label>
            <PersonSwitch
              includeFamily
              onPick={(id) => setWho(id)}
            />
            <p className="text-sm text-muted-foreground">
              Selected:{" "}
              {who === WHOLE_FAMILY
                ? "Everyone"
                : state.people.find((p) => p.id === who)?.name}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="last">Last visit</Label>
            <Input
              id="last"
              type="date"
              value={lastDone}
              onChange={(e) => setLastDone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due">Due</Label>
            <Input
              id="due"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
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
            disabled={!due}
            onClick={() => {
              onAdd({
                kind,
                who,
                lastDone,
                due,
                note: note || undefined,
              });
              setOpen(false);
              setDue("");
              setNote("");
            }}
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
