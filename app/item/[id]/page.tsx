"use client";

import { NextCard } from "@/components/next-card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ItemPage() {
  const params = useParams<{ id: string }>();
  const { state, isDone } = useStore();
  const item = state.items.find((row) => row.id === params.id);

  if (!item) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">That step is gone</h1>
        <Button render={<Link href="/today" />} className="h-12 rounded-2xl">
          Back to today
        </Button>
      </div>
    );
  }

  if (isDone(item.id)) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold">Already done</h1>
        <Button
          render={<Link href="/today" />}
          variant="outline"
          className="h-12 rounded-2xl"
        >
          Back to today
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NextCard item={item} />
      <Button
        render={<Link href="/today" />}
        variant="ghost"
        className="h-12 px-1 text-base"
      >
        Back to today
      </Button>
    </div>
  );
}
