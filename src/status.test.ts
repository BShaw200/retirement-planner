import { describe, expect, it } from "vitest";
import { savingsStatus, successTone } from "./status";

describe("savings status", () => {
  it("is green only when steady growth lasts and real markets usually work out", () => {
    expect(savingsStatus(null, 95, 0.9).tone).toBe("good");
  });

  it("warns when steady growth lasts but the chance is low", () => {
    expect(savingsStatus(null, 81, 0.39)).toEqual({ tone: "warning", label: "Little room to spare" });
  });

  it("is red when steady growth already runs out", () => {
    expect(savingsStatus(65, 95, 0)).toEqual({ tone: "critical", label: "Runs out 31 years early" });
  });
});

describe("success tone", () => {
  it("uses the same 85% bar as the savings status", () => {
    expect(successTone(0.85).tone).toBe("good");
    expect(successTone(0.84).tone).toBe("warning");
    expect(successTone(0.5).tone).toBe("critical");
  });
});
