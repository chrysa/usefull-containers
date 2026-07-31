// Parse a Satisfactory .sav entirely in the browser, then reduce it.
// The parser is a real dependency loaded through a dynamic import, so Vite
// emits it as its own lazy chunk: the initial payload is unaffected, and
// parsing works with no outbound network access (see DECISIONS.md D-0013).

import { reduce, type RawSave } from "./reduce";
import type { CompactSnapshot } from "./types";

/** Strip a trailing ".sav" from a file name to get the save name. */
function saveNameFromFile(fileName: string): string {
  return fileName.replace(/\.sav$/i, "");
}

/** Maximum accepted save-file size (200 MiB). Larger files are rejected before
 *  the ArrayBuffer is allocated to prevent browser OOM on malformed/gigantic files. */
const MAX_FILE_SIZE = 200 * 1024 * 1024;

/** Thrown when the file exceeds the size limit, so callers can show a specific message. */
export class FileTooLargeError extends Error {
  readonly sizeMB: number;
  constructor(sizeMB: number) {
    super(`Save file is too large (${sizeMB.toFixed(1)} MiB > 200 MiB limit)`);
    this.name = "FileTooLargeError";
    this.sizeMB = sizeMB;
  }
}

/**
 * Parse a dropped .sav File and return a reduced snapshot.
 * Throws {@link FileTooLargeError} if the file exceeds 200 MiB.
 * Throws if the binary cannot be parsed.
 */
export async function parseSaveFile(file: File): Promise<CompactSnapshot> {
  if (file.size > MAX_FILE_SIZE) {
    throw new FileTooLargeError(file.size / (1024 * 1024));
  }
  const [mod, buffer] = await Promise.all([
    import("@etothepii/satisfactory-file-parser"),
    file.arrayBuffer(),
  ]);
  const saveName = saveNameFromFile(file.name);
  // The parser returns `unknown`; reduce() reads only the RawSave fields it knows.
  const raw = mod.Parser.ParseSave(saveName, buffer) as RawSave;
  return reduce(raw, saveName);
}
