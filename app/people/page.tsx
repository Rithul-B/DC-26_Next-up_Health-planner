"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { talkStyleLabels } from "@/lib/copy";
import { useStore } from "@/lib/store";
import type { TalkStyle } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const styles: TalkStyle[] = ["plain", "few-words", "encouraging"];

export default function PeoplePage() {
  const { state, addPerson } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [talkStyle, setTalkStyle] = useState<TalkStyle>("plain");

  if (state.role !== "helper") {
    return (
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold">People</h1>
        <p className="text-lg text-muted-foreground">
          Only a helper can add a person.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/settings" />}
          className="h-12 rounded-2xl"
        >
          Go to Easier
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">People</h1>
        <p className="text-lg text-muted-foreground">
          Who personal Today belongs to. First name and how to talk to them.
          Not a login.
        </p>
      </header>

      <ul className="space-y-2">
        {state.people.map((person) => (
          <li
            key={person.id}
            className="rounded-3xl border bg-card px-5 py-4 text-lg font-semibold"
          >
            {person.name}
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              {talkStyleLabels[person.talkStyle]}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold">Add a person</h2>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addPerson({ name: name.trim(), talkStyle });
          router.push("/helper");
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">First name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 text-lg"
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">How to talk</legend>
          <div className="flex flex-col gap-2">
            {styles.map((style) => (
              <Button
                key={style}
                type="button"
                variant={talkStyle === style ? "default" : "outline"}
                className="h-14 justify-start rounded-2xl text-base"
                onClick={() => setTalkStyle(style)}
              >
                {talkStyleLabels[style]}
              </Button>
            ))}
          </div>
        </fieldset>
        <Button type="submit" className="h-14 w-full rounded-2xl text-lg">
          Add person
        </Button>
      </form>
    </div>
  );
}
