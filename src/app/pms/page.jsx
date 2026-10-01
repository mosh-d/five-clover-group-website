"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import GroupLogo from "@/assets/five-clover-logo.webp";
import PasswordField from "@/components/pms/PasswordField";
import BranchPicker from "@/components/pms/BranchPicker";
import { BRANDS } from "@/components/pms/theme/brands";
import { pathAfterSignIn } from "@/components/pms/pmsNavItems";
import { btn, field } from "@/components/pms/ui";
import { pmsSignIn, PmsApiError } from "@/lib/pms/client";
import { readPmsSession, markJustSignedIn, hasBeenIdleTooLong, clearPmsSession } from "@/lib/pms/session";

// fivecloverhotels.com/pms - one sign-in for every branch, and for Head
// Office (owner, 2026-10-01; it had its own at /hq). The account says where:
// a Head Office account opens Head Office, someone who may open several
// places (a developer, or a manager with accounts at more than one) is asked
// which, then lands there in its brand.
//
// ?next= is the page that sent them here (a bookmark, a branch PMS's
// "moved" card); signing in carries on to it (pathAfterSignIn).
const nextParam = () => new URLSearchParams(window.location.search).get("next");

export default function PmsSignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [choices, setChoices] = useState(null);

  // Already signed in - straight on. A session left untouched past the idle
  // limit is over, so it is cleared and the form stays (2026-10-01).
  useEffect(() => {
    const session = readPmsSession();
    if (!session) return;
    if (hasBeenIdleTooLong()) clearPmsSession();
    else router.replace(pathAfterSignIn(session.role, nextParam(), session.scope));
  }, [router]);

  const enter = (data) => {
    markJustSignedIn();
    router.push(pathAfterSignIn(data.staff_role, nextParam(), data.branch ? "branch" : "hq"));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    try {
      setSubmitting(true);
      setError(null);
      const data = await pmsSignIn(username.trim(), password);
      if (data.choose_branch) setChoices({ branches: data.branches, headOffice: Boolean(data.head_office) });
      else enter(data);
    } catch (err) {
      setError(
        err instanceof PmsApiError
          ? err.status === 401
            ? "That username and password don't match an account."
            : err.message
          : "Couldn't reach the server. Check the connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // One cream page, no top bar (owner, 2026-09-28): the welcome and the
  // group's brands beside the form on a wide screen, above it on a narrow
  // one. The brand marks are their light-background versions.
  return (
    <div className="min-h-screen w-full max-w-[140rem] mx-auto flex items-center gap-16 px-6 py-16 lg:px-20 max-lg:flex-col max-lg:justify-center">
      <section className="flex-1 flex flex-col gap-10 max-lg:items-center max-lg:text-center">
        <div className="relative size-40 lg:size-48">
          <Image src={GroupLogo} alt="Five Clover Hotels" fill sizes="12rem" className="object-contain lg:object-left" priority />
        </div>
        <div className="flex flex-col gap-5 max-w-3xl">
          <p className="text-xl font-semibold uppercase tracking-[0.3em] text-(--emphasis)">Welcome to</p>
          {/* The group's name at exactly half the size of what it runs
              (owner, 2026-09-28). */}
          <h1 className="font-accent text-6xl lg:text-7xl font-bold leading-tight text-(--text-color) flex flex-col gap-2">
            <span className="text-[0.5em]">Five Clover Hotels Group</span>
            <span>Property Management System</span>
          </h1>
          <p className="text-2xl text-(--text-color)/68">One sign-in for every branch. Your account takes you to your own.</p>
        </div>
        <div className="flex items-center gap-10 flex-wrap max-lg:justify-center">
          {Object.values(BRANDS).map((brand) => (
            <div key={brand.key} className="relative h-20 w-36">
              <Image src={brand.logoOnLight} alt={brand.name} fill sizes="9rem" className="object-contain" />
            </div>
          ))}
        </div>
      </section>

      <section className="w-full max-w-lg shrink-0">
        <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col gap-7 rounded-2xl p-12 shadow-sm bg-(--card) border border-(--accent-2)">
          <div className="flex flex-col gap-2">
            <h2 className="font-accent text-5xl font-bold">Sign in</h2>
            <p className="text-2xl text-(--text-color)/68">Use your PMS username and password.</p>
          </div>

          {error && <p className={field.error}>{error}</p>}

          <div className="flex flex-col gap-2">
            <label htmlFor="username" className={field.label}>Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={field.input}
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" disabled={submitting || !username.trim() || !password} className={btn.primary}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>

      {choices && (
        <BranchPicker
          branches={choices.branches}
          headOffice={choices.headOffice}
          intro={
            choices.headOffice
              ? "Your account can open Head Office and branches. Where are you working?"
              : "Your account can open more than one branch. Which one are you working in?"
          }
          onChoose={async (place) => {
            const data = await pmsSignIn(username.trim(), password, place);
            enter(data);
          }}
          onClose={() => setChoices(null)}
        />
      )}
    </div>
  );
}
