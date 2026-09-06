"use client";

import { useStore } from "@/lib/store";

export function SyncNote({ className }: { className?: string }) {
  const { state, saveError } = useStore();
  if (saveError) {
    return <p className={className}>{saveError}</p>;
  }
  if (state.sync === "household" && state.household) {
    return (
      <p className={className}>
        Shared with {state.household.name}. Code {state.household.joinCode}.
      </p>
    );
  }
  return <p className={className}>On this device only.</p>;
}
