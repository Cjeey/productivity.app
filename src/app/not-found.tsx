import Link from "next/link";
import { ArrowLeftCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f6fb] dark:bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-4">
        <p className="text-sm uppercase tracking-wide text-slate-400">404</p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
        <p className="text-slate-600 dark:text-slate-300">
          The view you&apos;re looking for doesn&apos;t exist. Use the sidebar to jump to another section or head back to the dashboard.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <ArrowLeftCircle className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
