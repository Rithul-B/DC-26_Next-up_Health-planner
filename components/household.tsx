"use client";

import { householdLine } from "@/lib/copy";
import { householdRows, personTint } from "@/lib/period";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function HouseholdPresence({
  layout = "row",
}: {
  layout?: "row" | "stack";
}) {
  const { state, screenWeight } = useStore();
  const rows = householdRows(state);
  const quiet = screenWeight === "critical";

  return (
    <aside
      className={cn(
        "household",
        layout === "stack" ? "household-stack" : "household-row",
      )}
      aria-label="Household"
    >
      <p className="household-kicker">
        {quiet
          ? "Household"
          : state.household?.name
            ? state.household.name
            : "In this house"}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No people yet.</p>
      ) : null}
      <ul className={cn("household-list", layout === "stack" && "household-list-stack")}>
        {rows.map((row) => (
          <li
            key={row.id}
            data-tint={personTint(row.id)}
            className={cn(
              "household-chip",
              row.hasCritical && "household-chip-critical",
              row.waiting === 0 && "household-chip-clear",
            )}
          >
            <span className="household-dot" aria-hidden />
            <span>{householdLine(row.name, row.waiting, screenWeight)}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
