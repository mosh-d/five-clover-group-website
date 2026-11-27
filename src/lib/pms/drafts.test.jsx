import { act, renderHook } from "@testing-library/react";
import { clearPmsSession, storePmsSession } from "./session";
import { DRAFT_TTL_MS, discardDraft, useDraft } from "./drafts";

// Work that outlives the page (owner, 2026-11-27): a half-typed form comes
// back when the page does, for the same person in the same branch, until it
// is saved, signed out of, or a day old.
const signIn = (id, branchId = 4) =>
  storePmsSession({ token: "t", user: { staff_account_id: id, staff_role: "receptionist" }, branch: { id: branchId } });

beforeEach(() => {
  localStorage.clear();
  signIn(7);
});

describe("useDraft", () => {
  it("brings a form back as it was left", () => {
    const first = renderHook(() => useDraft("walk-in", { name: "" }));
    act(() => first.result.current[1]({ name: "Ada" }));
    first.unmount();

    const again = renderHook(() => useDraft("walk-in", { name: "" }));
    expect(again.result.current[0]).toEqual({ name: "Ada" });
  });

  it("forgets a form once it is back to empty, as a saved form is", () => {
    const first = renderHook(() => useDraft("walk-in", { name: "" }));
    act(() => first.result.current[1]({ name: "Ada" }));
    act(() => first.result.current[1]({ name: "" }));
    first.unmount();
    expect(Object.keys(localStorage).some((k) => k.startsWith("pms_draft:"))).toBe(false);
  });

  it("keeps one person's draft from the next person at the desk, and from another branch", () => {
    const mine = renderHook(() => useDraft("log-book-note", ""));
    act(() => mine.result.current[1]("Room 12 wants a late check-out"));
    mine.unmount();

    signIn(8);
    expect(renderHook(() => useDraft("log-book-note", "")).result.current[0]).toBe("");
    signIn(7, 5);
    expect(renderHook(() => useDraft("log-book-note", "")).result.current[0]).toBe("");
    signIn(7, 4);
    expect(renderHook(() => useDraft("log-book-note", "")).result.current[0]).toBe("Room 12 wants a late check-out");
  });

  it("is cleared by signing out", () => {
    const mine = renderHook(() => useDraft("walk-in", { name: "" }));
    act(() => mine.result.current[1]({ name: "Ada" }));
    mine.unmount();
    clearPmsSession();
    signIn(7);
    expect(renderHook(() => useDraft("walk-in", { name: "" })).result.current[0]).toEqual({ name: "" });
  });

  it("drops a draft a day old, and one discarded on purpose", () => {
    const now = Date.now();
    const spy = vi.spyOn(Date, "now").mockReturnValue(now);
    const mine = renderHook(() => useDraft("paid-out", { amount: "" }));
    act(() => mine.result.current[1]({ amount: "5000" }));
    mine.unmount();
    spy.mockReturnValue(now + DRAFT_TTL_MS + 1);
    expect(renderHook(() => useDraft("paid-out", { amount: "" })).result.current[0]).toEqual({ amount: "" });
    spy.mockRestore();

    const note = renderHook(() => useDraft("log-book-note", ""));
    act(() => note.result.current[1]("hello"));
    note.unmount();
    discardDraft("log-book-note");
    expect(renderHook(() => useDraft("log-book-note", "")).result.current[0]).toBe("");
  });

  it("is plain state with no key", () => {
    const { result } = renderHook(() => useDraft(null, 1));
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(2);
    expect(Object.keys(localStorage).some((k) => k.startsWith("pms_draft:"))).toBe(false);
  });
});
