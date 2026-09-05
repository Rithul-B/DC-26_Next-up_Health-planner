import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TimeOfDay, Weight } from "@/lib/types";

export function WeightCard({
  weight = "everyday",
  period,
  className,
  children,
  as: Tag = "section",
}: {
  weight?: Weight;
  period?: TimeOfDay;
  className?: string;
  children: ReactNode;
  as?: "section" | "div" | "li" | "article";
}) {
  return (
    <Tag
      data-weight={weight}
      data-period={period}
      className={cn("weight-card", className)}
    >
      {children}
    </Tag>
  );
}
