import { fireEvent, render, screen } from "@testing-library/react";

// Back and forward through the PMS pages visited (owner, 2026-11-26). They
// step through the browser's real history, and stop at the edge of the PMS.

const router = { back: vi.fn(), forward: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import HistorySteps from "./HistorySteps";

function history(urls, index) {
  window.navigation = {
    currentEntry: { url: urls[index], index },
    entries: () => urls.map((url, i) => ({ url, index: i })),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

afterEach(() => {
  delete window.navigation;
  router.back.mockClear();
  router.forward.mockClear();
});

const back = () => screen.getByRole("button", { name: "Go back" });
const forward = () => screen.getByRole("button", { name: "Go forward" });

it("steps back and forward between PMS pages", () => {
  history(["https://x/pms/folios", "https://x/pms/reservations", "https://x/pms/alerts"], 1);
  render(<HistorySteps />);
  expect(back().disabled).toBe(false);
  expect(forward().disabled).toBe(false);
  fireEvent.click(back());
  expect(router.back).toHaveBeenCalledTimes(1);
  fireEvent.click(forward());
  expect(router.forward).toHaveBeenCalledTimes(1);
});

it("doesn't step back out to the sign-in page or another site", () => {
  history(["https://x/pms", "https://x/pms/overview"], 1);
  const { unmount } = render(<HistorySteps />);
  expect(back().disabled).toBe(true);
  expect(forward().disabled).toBe(true);
  unmount();
  history(["https://www.google.com/", "https://x/pms/overview"], 1);
  render(<HistorySteps />);
  expect(back().disabled).toBe(true);
});

it("leaves both on where the browser can't say (no Navigation API)", () => {
  render(<HistorySteps />);
  expect(back().disabled).toBe(false);
  expect(forward().disabled).toBe(false);
});
