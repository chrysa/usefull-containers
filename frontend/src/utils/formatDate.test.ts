import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./formatDate";

const ISO = "2024-03-15T12:00:00.000Z";
const UTC_OPTIONS: Intl.DateTimeFormatOptions = { timeZone: "UTC" };

describe("formatDate", () => {
  it("returns the em-dash placeholder for a null input", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("formats a date using the en-US locale, pinned to UTC", () => {
    expect(formatDate(ISO, "en-US", UTC_OPTIONS)).toBe("3/15/2024");
  });

  it("formats a date using the fr-FR locale, pinned to UTC", () => {
    expect(formatDate(ISO, "fr-FR", UTC_OPTIONS)).toBe("15/03/2024");
  });

  it("respects explicit formatting options", () => {
    expect(
      formatDate(ISO, "en-US", { ...UTC_OPTIONS, dateStyle: "long" }),
    ).toBe("March 15, 2024");
  });
});

describe("formatDateTime", () => {
  it("returns the em-dash placeholder for a null input", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("returns a non-empty, non-placeholder string for a valid ISO input", () => {
    const result = formatDateTime(ISO, "en-US");
    expect(result).not.toBe("—");
    expect(result.length).toBeGreaterThan(0);
  });

  it("is locale-sensitive: en-US and fr-FR outputs differ in separator style", () => {
    const en = formatDateTime(ISO, "en-US");
    const fr = formatDateTime(ISO, "fr-FR");
    expect(en).not.toBe(fr);
  });
});
