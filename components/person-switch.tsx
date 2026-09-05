"use client";

import { Button } from "@/components/ui/button";
import { personTint } from "@/lib/period";
import { useStore } from "@/lib/store";
import { WHOLE_FAMILY } from "@/lib/types";

export function PersonSwitch({
  includeFamily,
  onPick,
  value,
}: {
  includeFamily?: boolean;
  onPick?: (id: string) => void;
  value?: string;
}) {
  const { state, setActivePerson } = useStore();
  const selected = value ?? state.activePersonId;

  return (
    <div
      role="group"
      aria-label="Who this is for"
      className="flex flex-wrap gap-2"
    >
      {includeFamily ? (
        <Chip
          active={selected === WHOLE_FAMILY}
          label="Everyone"
          onClick={() => onPick?.(WHOLE_FAMILY)}
        />
      ) : null}
      {state.people.map((person) => (
        <Chip
          key={person.id}
          active={selected === person.id}
          label={person.name}
          tint={personTint(person.id)}
          onClick={() => {
            if (onPick) onPick(person.id);
            else setActivePerson(person.id);
          }}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  label,
  onClick,
  tint,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tint?: ReturnType<typeof personTint>;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      data-tint={tint}
      className="person-chip h-12 rounded-full px-4 text-base"
    >
      {label}
    </Button>
  );
}
