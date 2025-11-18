import { TaskStatus } from "@/lib/types";
import clsx from "clsx";

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={clsx(
        "badge",
        status === "Done" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
        status === "In Progress" &&
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
        status === "To Do" && "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
      )}
    >
      {status}
    </span>
  );
}
