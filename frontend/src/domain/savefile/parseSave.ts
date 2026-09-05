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

/**
 * Highest `saveVersion` the bundled parser is known to read. Newer Satisfactory
 * builds bump this and change the binary layout; the pinned
 * `@etothepii/satisfactory-file-parser` then throws deep in the reader
 * ("Offset is outside the bounds of the DataView") rather than reporting the
 * mismatch. We use it only to *classify a parse failure* (issue #366), never to
 * pre-reject a file: a save that parses is always accepted whatever its version.
 * Bump this when the parser dependency gains support for a newer build.
 */
const MAX_SUPPORTED_SAVE_VERSION = 52;

/** The .sav header opens with three little-endian int32: header, save, build. */
const SAVE_HEADER_BYTES = 12;

export interface SaveHeaderVersions {
  headerVersion: number;
  saveVersion: number;
  buildVersion: number;
}

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
 * Thrown when parsing fails and the save's declared version is newer than the
 * bundled parser supports — so the UI can tell the user their save is from a
 * too-recent game build instead of showing a generic "failed to parse".
 */
export class UnsupportedSaveVersionError extends Error {
  readonly saveVersion: number;
  readonly buildVersion: number;
  constructor(saveVersion: number, buildVersion: number, options?: ErrorOptions) {
    super(
      `Save version ${saveVersion} (build ${buildVersion}) is newer than the parser supports`,
      options,
    );
    this.name = "UnsupportedSaveVersionError";
    this.saveVersion = saveVersion;
    this.buildVersion = buildVersion;
  }
}

/**
 * Read the three leading version int32s from a .sav ArrayBuffer. Returns null
 * when the buffer is too short to hold a header. Pure and unit-testable.
 */
export function readSaveHeaderVersions(buffer: ArrayBuffer): SaveHeaderVersions | null {
  if (buffer.byteLength < SAVE_HEADER_BYTES) {
    return null;
  }
  const view = new DataView(buffer);
  return {
    headerVersion: view.getInt32(0, true),
    saveVersion: view.getInt32(4, true),
    buildVersion: view.getInt32(8, true),
  };
}

/**
 * Parse a dropped .sav File and return a reduced snapshot.
 * Throws {@link FileTooLargeError} if the file exceeds 200 MiB.
 * Throws {@link UnsupportedSaveVersionError} when parsing fails on a save whose
 * declared version is newer than the bundled parser supports.
 * Throws otherwise if the binary cannot be parsed.
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
  const versions = readSaveHeaderVersions(buffer);
  try {
    // The parser returns `unknown`; reduce() reads only the RawSave fields it knows.
    const raw = mod.Parser.ParseSave(saveName, buffer) as RawSave;
    return reduce(raw, saveName);
  } catch (cause) {
    // A failure on a save newer than we support is almost certainly the format
    // gap (#366), not a corrupt file — surface the version so the UI can say so.
    if (versions !== null && versions.saveVersion > MAX_SUPPORTED_SAVE_VERSION) {
      throw new UnsupportedSaveVersionError(versions.saveVersion, versions.buildVersion, {
        cause,
      });
    }
    throw cause;
  }
}
