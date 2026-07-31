import { authHeaders } from "@/domain/auth/store";

/**
 * Download a protected file endpoint and save it via a synthetic anchor click.
 *
 * Browser-native `<a href download>` navigation cannot attach the
 * `Authorization` header, so any file endpoint behind auth (A-04) must be
 * fetched as a blob with the bearer token before triggering the download.
 */
export async function downloadAuthedFile(
  url: string,
  filename: string,
): Promise<void> {
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
