"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface Props {
  eventSlug: string;
  eventTitle: string;
}

/**
 * The legacy reference (findusonweb/event_login.php + template/findusonweb/event_login.tpl)
 * shows a password-only field, because by the time a visitor reaches that page their email is
 * already known (carried on the link they clicked). This app doesn't have that "already
 * identified" step yet, so this form asks for email + password together — same "Visitor
 * Login" flow and same secondary links (register / exhibitor-speaker login / home), just
 * self-contained on one screen instead of relying on a prior step.
 *
 * Auth reuses the site's existing NextAuth Credentials provider (lib/auth/options.ts →
 * verifyMemberCredentials(), which already checks find_users and includes a working
 * visitor@demo.com / password123 demo account) rather than a new auth system — a visitor is
 * simply a find_users login with no exhibitor/speaker/organiser row for the event, per
 * eventAccess.ts's getEventMemberContext() fallback.
 */
export function VisitorLoginForm({ eventSlug, eventTitle }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      identifier: email.trim(),
      password,
      redirect: false,
    });

    if (!result || result.error || !result.ok) {
      setError("We couldn't verify that email and password. Please double-check them and try again.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/virtual-event/${eventSlug}`);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-6 py-16">
      <div className="main-glow-bg pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-purple/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-80 w-80 rounded-full bg-brand-pink/20 blur-3xl" />

      <div className="glass-panel relative z-10 w-full max-w-md rounded-3xl p-8 sm:p-10">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-pink">{eventTitle}</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Visitor Login
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in with your registered visitor details to enter the show.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-400">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-400">
              Password *
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-sm text-white placeholder:text-zinc-600 focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-brand-gradient w-full rounded-full py-3.5 font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {isSubmitting ? "Logging In..." : "Log In"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-zinc-400">
          Not registered yet?{" "}
          <Link href="/free-ticket" className="font-semibold text-brand-pink hover:underline">
            Click here to Register as Visitor
          </Link>
        </p>

        <div className="mt-6 border-t border-white/10 pt-6 text-center">
          <p className="mb-3 text-xs font-medium text-zinc-500">Are you an Exhibitor or Speaker?</p>
          <Link
            href="/login"
            className="btn-outline-animated inline-block rounded-full bg-white/10 px-6 py-2.5 text-sm font-bold text-white ring-1 ring-white/40 backdrop-blur-md transition-all duration-300 hover:bg-white/20"
          >
            Click here to Login
          </Link>
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="text-xs font-medium text-zinc-500 hover:text-brand-pink hover:underline">
            Visit Home Page
          </Link>
        </p>
      </div>
    </div>
  );
}
