// Parse a Satisfactory .sav entirely in the browser, then reduce it.
// The parser is loaded on demand from esm.sh so it is never bundled and never
// runs in the backend (decision #2 in the spec). Offline/self-host without CDN
// access loses parsing — a documented V1 limitation.

import { reduce, type RawSave } from "./reduce";
import type { CompactSnapshot } from "./types";

const PARSER_URL = "https://esm.sh/@etothepii/satisfactory-file-parser@4.1.1";

interface ParserModule {
  Parser: { ParseSave(name: string, buffer: ArrayBuffer): unknown };
}

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
 * Throws if the CDN import fails or the binary cannot be parsed.
 */
export async function parseSaveFile(file: File): Promise<CompactSnapshot> {
  if (file.size > MAX_FILE_SIZE) {
    throw new FileTooLargeError(file.size / (1024 * 1024));
  }
  const [mod, buffer] = await Promise.all([
    import(/* @vite-ignore */ PARSER_URL) as Promise<ParserModule>,
    file.arrayBuffer(),
  ]);
  const saveName = saveNameFromFile(file.name);
  // The parser returns `unknown`; reduce() reads only the RawSave fields it knows.
  const raw = mod.Parser.ParseSave(saveName, buffer) as RawSave;
  return reduce(raw, saveName);
}
