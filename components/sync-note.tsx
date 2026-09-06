"use client";

import { looksLikeSamplePeople } from "@/lib/demo-family";
import { useStore } from "@/lib/store";
import { DEMO_JOIN_CODE } from "@/lib/types";

export function SyncNote({ className }: { className?: string }) {
  const { state, saveError } = useStore();
  if (saveError) {
    return <p className={className}>{saveError}</p>;
  }
  if (state.sync === "household" && state.household) {
    const sample =
      state.household.joinCode === DEMO_JOIN_CODE ||
      state.household.name === "Sample house";
    return (
      <p className={className}>
        {sample
          ? `Sample house (${state.household.name}). Code ${state.household.joinCode}. You, Dad, and Sam are examples.`
          : `Shared with ${state.household.name}. Code ${state.household.joinCode}.`}
      </p>
    );
  }
  if (looksLikeSamplePeople(state.people)) {
    return (
      <p className={className}>
        Sample on this device — You, Dad, and Sam. Not a shared house.
      </p>
    );
  }
  return <p className={className}>On this device only. Just you, for now.</p>;
}
