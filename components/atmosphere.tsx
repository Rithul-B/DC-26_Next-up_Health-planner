"use client";

import { clockPeriod } from "@/lib/period";
import type { TimeOfDay, Weight } from "@/lib/types";

export function Atmosphere({
  weight,
  period = clockPeriod(),
}: {
  weight: Weight;
  period?: TimeOfDay;
}) {
  return (
    <div
      className="atmosphere"
      data-weight={weight}
      data-period={period}
      aria-hidden
    >
      <div className="atmosphere-wash" />
      <svg className="atmosphere-shapes" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <circle className="blob blob-a" cx="180" cy="120" r="220" />
        <circle className="blob blob-b" cx="1040" cy="80" r="260" />
        <ellipse className="blob blob-c" cx="900" cy="720" rx="340" ry="180" />
        <circle className="blob blob-d" cx="80" cy="640" r="160" />
      </svg>
    </div>
  );
}
