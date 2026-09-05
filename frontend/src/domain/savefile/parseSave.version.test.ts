import { describe, expect, it, vi } from "vitest";
import {
  parseSaveFile,
  readSaveHeaderVersions,
  UnsupportedSaveVersionError,
} from "./parseSave";

// Force the bundled parser to fail the way a too-new save makes it fail,
// so we can assert how parseSaveFile classifies the failure by header version.
vi.mock("@etothepii/satisfactory-file-parser", () => ({
  Parser: {
    ParseSave: () => {
      throw new RangeError("Offset is outside the bounds of the DataView");
    },
  },
}));

function header(saveVersion: number, buildVersion = 491125): ArrayBuffer {
  const buf = new ArrayBuffer(12);
  const dv = new DataView(buf);
  dv.setInt32(0, 14, true); // headerVersion
  dv.setInt32(4, saveVersion, true);
  dv.setInt32(8, buildVersion, true);
  return buf;
}

function fileWith(buffer: ArrayBuffer): File {
  return {
    name: "save.sav",
    size: buffer.byteLength,
    arrayBuffer: () => Promise.resolve(buffer),
  } as unknown as File;
}

describe("readSaveHeaderVersions", () => {
  it("reads the three leading little-endian int32s", () => {
    expect(readSaveHeaderVersions(header(60, 491125))).toEqual({
      headerVersion: 14,
      saveVersion: 60,
      buildVersion: 491125,
    });
  });

  it("returns null for a buffer too short to hold a header", () => {
    expect(readSaveHeaderVersions(new ArrayBuffer(8))).toBeNull();
  });
});

describe("parseSaveFile version classification", () => {
  it("wraps a parse failure on a too-new save as UnsupportedSaveVersionError", async () => {
    await expect(parseSaveFile(fileWith(header(60)))).rejects.toBeInstanceOf(
      UnsupportedSaveVersionError,
    );
  });

  it("carries the detected save version on the error", async () => {
    const err = await parseSaveFile(fileWith(header(60))).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(UnsupportedSaveVersionError);
    expect((err as UnsupportedSaveVersionError).saveVersion).toBe(60);
  });

  it("rethrows the raw parser error for a supported-version save (not a version issue)", async () => {
    const err = await parseSaveFile(fileWith(header(52))).catch((e: unknown) => e);
    expect(err).not.toBeInstanceOf(UnsupportedSaveVersionError);
    expect(err).toBeInstanceOf(RangeError);
  });
});
