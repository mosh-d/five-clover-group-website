import { render } from "@testing-library/react";
import { useRef } from "react";
import PullToRefresh from "./PullToRefresh";

// Pull-to-refresh reloads the PMS only for a pull on the page itself (owner,
// 2026-11-26: a folio pop-up closed, and the screen "switched", when a swipe
// inside the pop-up reloaded the whole PMS).

function Page() {
  const ref = useRef(null);
  return (
    <>
      <PullToRefresh scrollerRef={ref} />
      <main ref={ref} data-testid="main">
        <p data-testid="page">A list</p>
        <div className="pms-overlay" aria-modal="true" role="dialog">
          <p data-testid="dialog">A folio</p>
        </div>
      </main>
    </>
  );
}

function pull(target, distance) {
  const touch = (y) => ({ touches: [{ clientY: y }] });
  target.dispatchEvent(Object.assign(new Event("touchstart", { bubbles: true }), touch(100)));
  target.dispatchEvent(Object.assign(new Event("touchmove", { bubbles: true }), touch(100 + distance)));
  target.dispatchEvent(Object.assign(new Event("touchend", { bubbles: true }), { touches: [] }));
}

let reload;
beforeEach(() => {
  reload = vi.fn();
  Object.defineProperty(window, "location", { configurable: true, value: { ...window.location, reload } });
});

it("a swipe down inside a pop-up never reloads the PMS", async () => {
  const { getByTestId } = render(<Page />);
  pull(getByTestId("dialog"), 300);
  expect(reload).not.toHaveBeenCalled();
});

it("a pull down on the page itself, at its top, still refreshes", async () => {
  const { getByTestId } = render(<Page />);
  pull(getByTestId("page"), 300);
  expect(reload).toHaveBeenCalledTimes(1);
});
