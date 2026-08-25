"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isHqAuthenticated } from "@/utils/hq-auth";
import AdminTopBar from "./AdminTopBar";
import AdminSidebar from "./AdminSidebar";

// localStorage isn't readable during SSR, and reading it inside a plain
// useState/useEffect pair to avoid a hydration mismatch means flashing an
// unauthenticated view for a frame first. useSyncExternalStore is the
// hook React designed for exactly this: it renders getServerSnapshot's
// value (false — unknown/unauthenticated) through hydration, then
// resolves to the real client value with no separate effect-driven flash.
function subscribe() {
  return () => {};
}
function getServerSnapshot() {
  return false;
}

// /admin itself is the login page — no shell chrome, no auth requirement.
// Every other /admin/* route gets the topbar+sidebar shell and is gated
// here once, instead of each page repeating its own redirect-if-signed-out
// check as more pages ship under this shell.
export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin";
  const isAuthed = useSyncExternalStore(subscribe, isHqAuthenticated, getServerSnapshot);

  useEffect(() => {
    if (!isLoginPage && !isAuthed) {
      router.replace("/admin");
    }
  }, [isLoginPage, isAuthed, router]);

  if (isLoginPage) {
    return <div className="admin-root">{children}</div>;
  }

  if (!isAuthed) {
    return <div className="admin-root" style={{ minHeight: "100vh" }} />;
  }

  return (
    <div className="admin-root h-screen flex flex-col overflow-hidden" style={{ background: "var(--background-color)" }}>
      <AdminTopBar />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
