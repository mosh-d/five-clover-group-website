import { describe, it, expect } from "vitest";
import { adjustmentProblem, adjustmentMax } from "../validation";

describe("adjustmentProblem (tax, discount, rate)", () => {
  it("accepts blank - these are optional, and blank means none", () => {
    expect(adjustmentProblem("Tax", "")).toBe("");
    expect(adjustmentProblem("Tax", undefined)).toBe("");
  });

  it("accepts zero and positive figures", () => {
    expect(adjustmentProblem("Tax", "0")).toBe("");
    expect(adjustmentProblem("Discount", "2500")).toBe("");
    expect(adjustmentProblem("Discount", "100", "percentage")).toBe("");
  });

  it("refuses a negative figure", () => {
    expect(adjustmentProblem("The room rate", "-1")).toBe("The room rate can't be negative.");
  });

  it("refuses a percentage over 100, but not a fixed amount over 100", () => {
    expect(adjustmentProblem("Discount", "150", "percentage")).toBe("Discount can't be more than 100%.");
    expect(adjustmentProblem("Discount", "150", "fixed")).toBe("");
  });

  it("refuses something that isn't a number", () => {
    expect(adjustmentProblem("Tax", "abc")).toBe("Tax has to be a number.");
  });

  it("caps a percentage field at 100 and leaves a fixed one open", () => {
    expect(adjustmentMax("percentage")).toBe(100);
    expect(adjustmentMax("fixed")).toBeUndefined();
  });
});
