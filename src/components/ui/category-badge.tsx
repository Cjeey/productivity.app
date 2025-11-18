import { Category } from "@/lib/types";
import clsx from "clsx";

export default function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={clsx(
        "badge",
        category === "Uni" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200",
        category === "Work" && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
        category === "Personal" && "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200"
      )}
    >
      {category}
    </span>
  );
}
