import { describe, expect, it } from "vitest";
import { getLocalDateKey } from "./utils";

describe("getLocalDateKey", () => {
  it("returns yyyy-mm-dd format", () => {
    const value = getLocalDateKey(new Date("2026-04-21T10:20:30"));
    expect(value).toBe("2026-04-21");
  });
});
