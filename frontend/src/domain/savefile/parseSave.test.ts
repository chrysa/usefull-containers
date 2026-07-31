import { describe, expect, it, vi } from "vitest";
import { FileTooLargeError, parseSaveFile } from "./parseSave";

/** A File stand-in whose size can exceed anything we want to allocate for real. */
function fakeFile(name: string, sizeBytes: number): File {
  const arrayBuffer = vi.fn(() => Promise.resolve(new ArrayBuffer(0)));
  return { name, size: sizeBytes, arrayBuffer } as unknown as File;
}

describe("parseSaveFile", () => {
  it("rejects a file over the 200 MiB limit before reading it", async () => {
    const oversized = fakeFile("huge.sav", 201 * 1024 * 1024);

    await expect(parseSaveFile(oversized)).rejects.toBeInstanceOf(FileTooLargeError);
    // The guard must fire before the buffer is allocated, or the browser OOMs
    // on exactly the payloads the limit exists to reject.
    expect(oversized.arrayBuffer).not.toHaveBeenCalled();
  });

  it("reports the offending size in MiB", async () => {
    await expect(parseSaveFile(fakeFile("huge.sav", 250 * 1024 * 1024))).rejects.toThrow(
      /250\.0 MiB > 200 MiB/,
    );
  });

  it("loads the parser from the bundle, not from a CDN", async () => {
    // A local import keeps .sav parsing working with no outbound network
    // access (D-0013). Resolving the module here is the assertion.
    const mod = await import("@etothepii/satisfactory-file-parser");
    expect(typeof mod.Parser.ParseSave).toBe("function");
  });
});
