import type { ReactNode } from "react";
import type { CheckInFeeling, FamilyKind, TimeOfDay, Weight } from "@/lib/types";
import { cn } from "@/lib/utils";

type MarkProps = {
  className?: string;
  title?: string;
};

function Frame({
  className,
  title,
  children,
}: MarkProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={cn("mark", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function TimeMark({
  period,
  className,
}: {
  period: TimeOfDay;
  className?: string;
}) {
  if (period === "morning") {
    return (
      <Frame className={className} title="Morning">
        <circle className="mark-fill-soft" cx="48" cy="52" r="22" />
        <circle className="mark-fill" cx="48" cy="40" r="14" />
        <path
          className="mark-stroke"
          d="M48 14v8M48 74v8M14 48h8M74 48h8M24 24l6 6M66 66l6 6M24 72l6-6M66 30l6-6"
        />
      </Frame>
    );
  }
  if (period === "afternoon") {
    return (
      <Frame className={className} title="Afternoon">
        <path className="mark-fill-soft" d="M8 70h80v10H8z" />
        <circle className="mark-fill" cx="62" cy="38" r="16" />
        <path className="mark-stroke" d="M12 70c10-18 22-28 36-28" />
      </Frame>
    );
  }
  if (period === "evening") {
    return (
      <Frame className={className} title="Evening">
        <path className="mark-fill-soft" d="M18 78h60v6H18z" />
        <path className="mark-fill" d="M38 78V44h20v34" />
        <circle className="mark-fill" cx="48" cy="34" r="10" />
        <circle className="mark-stroke" cx="72" cy="22" r="7" />
      </Frame>
    );
  }
  return (
    <Frame className={className} title="Night">
      <path
        className="mark-fill"
        d="M58 20a22 22 0 1 0 16 38 26 26 0 1 1-16-38z"
      />
      <circle className="mark-stroke" cx="24" cy="28" r="1.5" />
      <circle className="mark-stroke" cx="34" cy="18" r="1.2" />
      <circle className="mark-stroke" cx="22" cy="42" r="1" />
    </Frame>
  );
}

export function DoneMark({ className }: MarkProps) {
  return (
    <Frame className={className} title="Done">
      <circle className="mark-fill-soft" cx="48" cy="48" r="28" />
      <path className="mark-stroke-thick" d="M30 50l12 12 24-28" />
    </Frame>
  );
}

export function EmptyMark({ className }: MarkProps) {
  return (
    <Frame className={className} title="Nothing waiting">
      <ellipse className="mark-fill-soft" cx="48" cy="70" rx="28" ry="8" />
      <path
        className="mark-stroke"
        d="M22 58c0-18 12-30 26-30s26 12 26 30"
      />
      <path className="mark-fill" d="M28 56h40v6H28z" />
    </Frame>
  );
}

export function HouseMark({ className }: MarkProps) {
  return (
    <Frame className={className} title="Family">
      <path className="mark-fill-soft" d="M16 46l32-24 32 24v30H16z" />
      <path className="mark-stroke" d="M18 46L48 22l30 24v30H18z" />
      <path className="mark-fill" d="M42 56h12v20H42z" />
    </Frame>
  );
}

export function HelperMark({ className }: MarkProps) {
  return (
    <Frame className={className} title="Helper">
      <circle className="mark-fill-soft" cx="36" cy="36" r="12" />
      <circle className="mark-fill" cx="62" cy="40" r="10" />
      <path className="mark-stroke" d="M16 72c4-16 16-24 28-24s22 8 26 20" />
    </Frame>
  );
}

export function EaseMark({ className }: MarkProps) {
  return (
    <Frame className={className} title="Easier">
      <path className="mark-fill-soft" d="M20 58c8-22 20-34 28-34s20 12 28 34" />
      <path className="mark-stroke" d="M22 58c8-20 18-30 26-30s18 10 26 30" />
      <circle className="mark-fill" cx="48" cy="40" r="5" />
    </Frame>
  );
}

export function FeelingMark({
  feeling,
  className,
}: {
  feeling: CheckInFeeling;
  className?: string;
}) {
  if (feeling === "good") {
    return (
      <Frame className={className} title="Good">
        <circle className="mark-fill-soft" cx="48" cy="48" r="26" />
        <path className="mark-stroke-thick" d="M32 50c6 12 26 12 32 0" />
      </Frame>
    );
  }
  if (feeling === "ok") {
    return (
      <Frame className={className} title="Okay">
        <circle className="mark-fill-soft" cx="48" cy="48" r="26" />
        <path className="mark-stroke-thick" d="M32 52h32" />
      </Frame>
    );
  }
  return (
    <Frame className={className} title="Hard">
      <circle className="mark-fill-soft" cx="48" cy="48" r="26" />
      <path className="mark-stroke-thick" d="M32 58c8-12 24-12 32 0" />
    </Frame>
  );
}

export function FamilyKindMark({
  kind,
  className,
}: {
  kind: FamilyKind;
  className?: string;
}) {
  if (kind === "dentist") {
    return (
      <Frame className={className}>
        <path className="mark-fill-soft" d="M30 22h36v28c0 18-8 28-18 32-10-4-18-14-18-32z" />
        <path className="mark-stroke" d="M48 22v38" />
      </Frame>
    );
  }
  if (kind === "eyes") {
    return (
      <Frame className={className}>
        <path className="mark-fill-soft" d="M16 48c12-16 24-22 32-22s20 6 32 22c-12 16-24 22-32 22s-20-6-32-22z" />
        <circle className="mark-fill" cx="48" cy="48" r="8" />
      </Frame>
    );
  }
  if (kind === "vaccine") {
    return (
      <Frame className={className}>
        <rect className="mark-fill-soft" x="42" y="18" width="12" height="40" rx="4" />
        <path className="mark-stroke" d="M36 28h24M48 58v16M40 74h16" />
      </Frame>
    );
  }
  if (kind === "checkup") {
    return (
      <Frame className={className}>
        <circle className="mark-fill-soft" cx="48" cy="48" r="26" />
        <path className="mark-stroke-thick" d="M48 30v36M30 48h36" />
      </Frame>
    );
  }
  return (
    <Frame className={className}>
      <circle className="mark-fill-soft" cx="48" cy="48" r="22" />
    </Frame>
  );
}

export function WeightPip({
  weight,
  className,
}: {
  weight: Weight;
  className?: string;
}) {
  return (
    <span
      className={cn("weight-pip", `weight-pip-${weight}`, className)}
      aria-hidden
    />
  );
}
