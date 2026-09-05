"use client";

import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { WHOLE_FAMILY } from "@/lib/types";

export function PersonSwitch({
  includeFamily,
  onPick,
}: {
  includeFamily?: boolean;
  onPick?: (id: string) => void;
}) {
  const { state, setActivePerson } = useStore();

  return (
    <div
      role="group"
      aria-label="Who this is for"
      className="flex flex-wrap gap-2"
    >
      {includeFamily ? (
        <Chip
          active={false}
          label="Everyone"
          onClick={() => onPick?.(WHOLE_FAMILY)}
        />
      ) : null}
      {state.people.map((person) => (
        <Chip
          key={person.id}
          active={!onPick && state.activePersonId === person.id}
          label={person.name}
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
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      className="h-12 rounded-full px-4 text-base"
    >
      {label}
    </Button>
  );
}
