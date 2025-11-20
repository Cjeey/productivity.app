"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeftRight, Sparkle, LogIn, UserPlus, ShieldCheck, Flame, Brain, Clock, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [authMethod, setAuthMethod] = useState<"magic" | "password">("magic");
  const [password, setPassword] = useState("");
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
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

    if (authMethod === "magic") {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        toast.error(mode === "login" ? "Log in failed" : "Create account failed", { description: error.message });
      } else {
        setMessage(
          mode === "login"
            ? "Check your inbox for a magic link to log in."
            : "Account created. Confirm via the email we just sent you."
        );
      }
    } else {
      if (password.trim().length < 6) {
        toast.error("Use a password with at least 6 characters");
        setLoading(false);
        return;
      }
      const action =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      if (action.error) {
        toast.error(mode === "login" ? "Log in failed" : "Create account failed", { description: action.error.message });
      } else {
        setMessage(
          mode === "login"
            ? "Signed in. Redirecting..."
            : "Account created. Check your inbox to confirm your email."
        );
      }
    }

    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      const friendly =
        error.message?.toLowerCase().includes("provider is not enabled") ||
        error.message?.toLowerCase().includes("unsupported provider")
          ? "Enable Google provider in Supabase auth settings to use this option."
          : error.message;
      toast.error("Google sign-in failed", { description: friendly });
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute right-10 top-20 h-40 w-40 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-10 h-52 w-52 rounded-full bg-purple-400/15 blur-3xl" />
        <div className="absolute right-1/4 bottom-16 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <div className="relative max-w-5xl w-full">
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[1.2fr_1fr] items-center">
          <div className="hidden lg:block text-white space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">
              <Flame className="h-4 w-4" />
              FocusFlow
            </div>
            <h1 className="text-3xl font-semibold leading-tight">
              Your workspace for efficient study and smart time management.
            </h1>
            <p className="text-white/80 text-lg">
              Keep distractions low, enter deep work fast, and track progress effortlessly.
            </p>
            <div className="grid grid-cols-3 gap-3 text-sm text-white/85">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                <Brain className="h-5 w-5 mb-2" />
                Focus-ready layout
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                <Clock className="h-5 w-5 mb-2" />
                Timed sessions
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
                <ShieldCheck className="h-5 w-5 mb-2" />
                Secure sign-in
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-8 md:p-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-400 to-blue-600 text-white grid place-items-center shadow-lg">
                  <Sparkle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/80">FocusFlow</p>
                  <h2 className="text-2xl font-semibold text-white">Your workspace</h2>
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
                Create account
              </button>
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-2 bg-white/5 text-[11px]">
                <ArrowLeftRight className="h-4 w-4" />
                Magic link
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-between text-white/80 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                  <KeyRound className="h-4 w-4" />
                  Choose method
                </span>
                <span className="text-white/70">Magic link or password</span>
              </div>

              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-2 text-xs font-semibold text-white/80">
                <button
                  type="button"
                  onClick={() => setAuthMethod("magic")}
                  className={`flex-1 rounded-xl px-3 py-2 ${authMethod === "magic" ? "bg-white text-blue-700 shadow" : ""}`}
                >
                  Magic link
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("password")}
                  className={`flex-1 rounded-xl px-3 py-2 ${authMethod === "password" ? "bg-white text-blue-700 shadow" : ""}`}
                >
                  Password
                </button>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="w-full rounded-xl bg-white text-blue-700 font-semibold py-3 shadow-lg shadow-blue-500/20 hover:bg-white/90 flex items-center justify-center gap-2"
                disabled={loading}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
                Continue with Google
              </button>

              <div className="flex items-center gap-2 text-white/70 text-xs">
                <span className="flex-1 h-px bg-white/20" />
                <span>or continue with email</span>
                <span className="flex-1 h-px bg-white/20" />
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
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

                {authMethod === "password" && (
                  <label className="space-y-1 block text-white">
                    <span className="text-sm font-medium">Password (min 6 chars)</span>
                    <input
                      type="password"
                      className="input border-white/10 bg-white/20 text-white placeholder:text-white/60"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </label>
                )}

                <p className="text-xs text-white/80">
                  {authMethod === "magic"
                    ? `We’ll email you a magic link to ${mode === "login" ? "sign in" : "finish creating your account"}.`
                    : `Enter your password to ${mode === "login" ? "sign in" : "create your account"}.`}
                </p>
                <button
                  type="submit"
                  className="btn-primary w-full bg-white text-blue-700 hover:bg-white/90 shadow-lg shadow-blue-500/25"
                  disabled={loading}
                >
                  {loading ? "Sending..." : mode === "login" ? "Log in" : "Create account"}
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
      </div>
    </div>
  );
}
