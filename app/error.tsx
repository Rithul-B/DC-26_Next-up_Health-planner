"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <h1 className="page-title">Something broke</h1>
      <p className="text-lg text-muted-foreground">
        Try again. Your steps are still saved.
      </p>
      <Button className="h-12 rounded-2xl text-base" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
