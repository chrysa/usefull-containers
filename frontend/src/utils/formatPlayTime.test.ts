import { describe, expect, it } from "vitest";
import { formatPlayTime } from "./formatPlayTime";

describe("formatPlayTime", () => {
  it("formats zero seconds", () => {
    expect(formatPlayTime(0)).toBe("0h00");
  });

  it("formats sub-minute durations as 0h00", () => {
    expect(formatPlayTime(59)).toBe("0h00");
  });

  it("formats a duration under one hour", () => {
    expect(formatPlayTime(25 * 60)).toBe("0h25");
  });

  it("formats exactly one hour", () => {
    expect(formatPlayTime(60 * 60)).toBe("1h00");
  });

  it("pads single-digit minutes", () => {
    expect(formatPlayTime(60 * 60 + 5 * 60)).toBe("1h05");
  });

  it("formats large durations spanning many hours", () => {
    expect(formatPlayTime(123 * 3600 + 45 * 60)).toBe("123h45");
  });

  it("truncates partial minutes rather than rounding", () => {
    expect(formatPlayTime(3661)).toBe("1h01");
  });
});
