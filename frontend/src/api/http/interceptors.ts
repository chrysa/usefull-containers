// Add cross-cutting concerns here: auth token injection, error logging, etc.
// This module is imported by client.ts if you need to centralise side-effects
// outside of the http wrapper (e.g. refreshing tokens, analytics).

export function onRequest(_path: string, init: RequestInit): RequestInit {
  // Example: attach auth header
  // const token = localStorage.getItem("token");
  // if (token) init.headers = { ...init.headers, Authorization: `Bearer ${token}` };
  return init;
}

export function onError(error: unknown): never {
  console.error("API error:", error);
  throw error;
}
