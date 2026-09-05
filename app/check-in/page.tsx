"use client";

import { Button } from "@/components/ui/button";
import { checkInLabels, checkInPrompt } from "@/lib/copy";
import { useStore } from "@/lib/store";
import type { CheckInFeeling } from "@/lib/types";
import { useRouter } from "next/navigation";

const options: CheckInFeeling[] = ["good", "ok", "hard"];

export default function CheckInPage() {
  const { person, setCheckIn, checkIn } = useStore();
  const router = useRouter();

  function pick(feeling: CheckInFeeling) {
    setCheckIn(feeling);
    router.push("/today");
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Check-in</h1>
        <p className="text-xl text-muted-foreground">
          {checkInPrompt(person.talkStyle)}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {options.map((feeling) => (
          <Button
            key={feeling}
            variant={checkIn === feeling ? "default" : "outline"}
            className="h-20 rounded-3xl text-2xl font-semibold"
            onClick={() => pick(feeling)}
          >
            {checkInLabels[feeling]}
          </Button>
        ))}
      </div>
    </div>
  );
}
