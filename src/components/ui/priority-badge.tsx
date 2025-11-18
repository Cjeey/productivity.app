import { Priority } from "@/lib/types";
import clsx from "clsx";

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={clsx(
        "badge",
        priority === "High" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
        priority === "Medium" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
        priority === "Low" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
      )}
    >
      {priority}
    </span>
  );
}
