"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { helperWhisper } from "@/lib/copy";
import { useStore } from "@/lib/store";
import type { PersonalItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function WhisperLine({
  item,
  className,
}: {
  item: PersonalItem;
  className?: string;
}) {
  const text = helperWhisper(item);
  if (!text) return null;
  return (
    <p className={cn("text-base leading-relaxed italic text-muted-foreground", className)}>
      {text}
    </p>
  );
}

export function WhisperEditor({
  item,
  compact,
}: {
  item: PersonalItem;
  compact?: boolean;
}) {
  const { updateItem, state } = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(item.note ?? "");
  const hasNote = Boolean(helperWhisper(item));

  if (state.role !== "helper") return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setText(item.note ?? "");
      }}
    >
      <DialogTrigger
        nativeButton={false}
        render={
          <Button
            variant={compact ? "ghost" : "outline"}
            className={cn(
              "rounded-2xl text-base",
              compact ? "h-11 px-2" : "h-11",
            )}
          >
            {hasNote ? "Change note" : "Leave a note"}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Short note</DialogTitle>
          <DialogDescription>
            One line they can see on this step. Not a conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor={`whisper-${item.id}`}>Note</Label>
          <Input
            id={`whisper-${item.id}`}
            value={text}
            maxLength={80}
            placeholder="Already by the kettle"
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-2">
          {hasNote ? (
            <Button
              variant="ghost"
              className="h-12"
              onClick={() => {
                updateItem(item.id, { note: undefined });
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
          <Button
            className="h-12"
            onClick={() => {
              const next = text.trim();
              updateItem(item.id, { note: next || undefined });
              setOpen(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
