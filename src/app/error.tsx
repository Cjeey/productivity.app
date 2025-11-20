"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    toast.error("Something went wrong", { description: error.message });
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">We hit a snag</h1>
        <p className="text-slate-600 dark:text-slate-300">
          The page failed to load. Check your connection (or Supabase status) and try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="btn-primary inline-flex items-center justify-center"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
