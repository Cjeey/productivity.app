"use client";

import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800", className)} />;
}
