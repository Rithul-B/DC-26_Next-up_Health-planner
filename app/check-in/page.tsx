"use client";

import { FeelingMark } from "@/components/marks";
import { PageIntro } from "@/components/page-intro";
import { Button } from "@/components/ui/button";
import { checkInLabels, checkInPrompt } from "@/lib/copy";
import { useStore } from "@/lib/store";
import type { CheckInFeeling } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const options: CheckInFeeling[] = ["good", "ok", "hard"];

export default function CheckInPage() {
  const { person, setCheckIn, checkIn, screenWeight } = useStore();
  const router = useRouter();

  function pick(feeling: CheckInFeeling) {
    setCheckIn(feeling);
    router.push("/today");
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <PageIntro
        kicker={person.name}
        title="Check-in"
        mark={<FeelingMark feeling={checkIn ?? "ok"} />}
        quiet={screenWeight === "critical"}
      >
        <p className="text-xl text-foreground/80">
          {checkInPrompt(person.talkStyle)}
        </p>
      </PageIntro>

      <div className="flex flex-col gap-3">
        {options.map((feeling) => (
          <Button
            key={feeling}
            variant={checkIn === feeling ? "default" : "outline"}
            className={cn(
              "feeling-btn h-20 rounded-3xl px-5 text-2xl font-semibold",
              `feeling-${feeling}`,
            )}
            onClick={() => pick(feeling)}
          >
            <FeelingMark feeling={feeling} className="h-12 w-12" />
            {checkInLabels[feeling]}
          </Button>
        ))}
      </div>
    </div>
  );
}
