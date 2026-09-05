import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageIntro({
  kicker,
  title,
  children,
  mark,
  quiet,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
  mark?: ReactNode;
  quiet?: boolean;
}) {
  return (
    <header className={cn("page-intro", quiet && "page-intro-quiet")}>
      {mark ? (
        <div className="page-intro-mark" aria-hidden>
          {mark}
        </div>
      ) : null}
      <div className="page-intro-copy">
        {kicker ? <p className="page-kicker">{kicker}</p> : null}
        <h1 className="page-title">{title}</h1>
        {children ? <div className="page-lede">{children}</div> : null}
      </div>
    </header>
  );
}
