import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadAuthedFile } from "./download";

// NOTE: The success path of downloadAuthedFile (URL.createObjectURL, DOM
// anchor creation/click/removal) requires `document`, which the "node" test
// environment intentionally does not provide (see vitest.config.ts — jsdom
// is excluded by design for this repo). That DOM-bound branch is not
// node-testable without jsdom/Testing Library, so only the pure/fetch-bound
// behavior below (request construction and the error branch, which returns
// before touching `document`) is covered here.

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("downloadAuthedFile", () => {
  it("fetches the given URL with auth headers", async () => {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === "sfm.auth.token" ? "secret-token" : null),
      setItem: () => {},
      removeItem: () => {},
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      downloadAuthedFile("http://api/files/x", "x.zip"),
    ).rejects.toThrow("Download failed: HTTP 401");

    expect(fetchMock).toHaveBeenCalledWith("http://api/files/x", {
      headers: { Authorization: "Bearer secret-token" },
    });
  });

  it("omits the Authorization header when no token is stored", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      downloadAuthedFile("http://api/files/y", "y.zip"),
    ).rejects.toThrow("Download failed: HTTP 403");

    expect(fetchMock).toHaveBeenCalledWith("http://api/files/y", {
      headers: {},
    });
  });

  it("throws an error including the HTTP status on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(
      downloadAuthedFile("http://api/files/z", "z.zip"),
    ).rejects.toThrow("Download failed: HTTP 500");
  });
});
