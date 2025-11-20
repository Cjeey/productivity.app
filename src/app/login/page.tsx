"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeftRight, Sparkle, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    if (!emailRegex.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      toast.error(mode === "login" ? "Login failed" : "Sign up failed", { description: error.message });
    } else {
      setMessage(
        mode === "login"
          ? "Check your inbox for a magic link to log in."
          : "Account created. Confirm via the email we just sent you."
      );
    }

    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center px-4 py-10">
      {/* Ambient shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute right-10 top-20 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-10 h-52 w-52 rounded-full bg-purple-400/15 blur-3xl" />
        <div className="absolute right-1/4 bottom-16 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <div className="relative max-w-5xl w-full">
        <div className="mx-auto max-w-xl rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 md:p-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-600 text-white grid place-items-center shadow-lg">
                <Sparkle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/80">FocusFlow</p>
                <h1 className="text-2xl font-semibold text-white">Your workspace</h1>
              </div>
            </div>
            <Link href="/" className="text-sm text-white/80 hover:text-white underline underline-offset-4">
              Back home
            </Link>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white/15 p-1 text-sm font-semibold text-white/80">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-4 py-2 inline-flex items-center justify-center gap-2 ${
                mode === "login" ? "bg-white text-blue-700 shadow-md" : ""
              }`}
            >
              <LogIn className="h-4 w-4" />
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-4 py-2 inline-flex items-center justify-center gap-2 ${
                mode === "signup" ? "bg-white text-blue-700 shadow-md" : ""
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Sign up
            </button>
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-2 bg-white/5 text-[11px]">
              <ArrowLeftRight className="h-4 w-4" />
              Magic link
            </span>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-1 block text-white">
              <span className="text-sm font-medium">Email</span>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-3 text-white/60" />
                <input
                  type="email"
                  className="input border-white/10 bg-white/20 text-white placeholder:text-white/60 pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>
            <p className="text-xs text-white/80">
              We’ll email you a magic link to {mode === "login" ? "sign in" : "finish creating your account"}.
            </p>
            <button
              type="submit"
              className="btn-primary w-full bg-white text-blue-700 hover:bg-white/90 shadow-lg shadow-blue-500/25"
              disabled={loading}
            >
              {loading ? "Sending..." : mode === "login" ? "Send login link" : "Send sign-up link"}
            </button>
          </form>

          {message && <p className="text-sm text-emerald-100">{message}</p>}

          <div className="flex items-center justify-center gap-2 text-sm text-white/80">
            <span>Changed your mind?</span>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="underline underline-offset-4"
            >
              Switch to {mode === "login" ? "sign up" : "log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
