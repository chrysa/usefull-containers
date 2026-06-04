from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.config import settings

# In-memory sliding-window rate limiter for the auth endpoints (A-08), to slow
# down credential brute-forcing on /auth/login and /auth/register.
#
# Single-instance only — the deployment is a single Kimsufi node. If the backend
# is ever horizontally scaled, move this to a shared store (e.g. Redis-backed
# slowapi) so the window is enforced cluster-wide.
_hits: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    """Best-effort client IP, honouring the reverse proxy's X-Forwarded-For."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def reset_rate_limit() -> None:
    """Clear all counters. Intended for tests."""
    _hits.clear()


def rate_limit_auth(request: Request) -> None:
    """Throttle a client to `auth_rate_limit_max` requests per window, per route.

    No-op under `settings.test_mode` so the test suite isn't throttled. Raises
    HTTP 429 with a Retry-After header once the limit is exceeded.
    """
    if settings.test_mode:
        return

    window = settings.auth_rate_limit_window_seconds
    limit = settings.auth_rate_limit_max
    key = f"{request.url.path}:{_client_ip(request)}"
    now = time.monotonic()

    hits = _hits[key]
    while hits and now - hits[0] > window:
        hits.popleft()

    if len(hits) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please wait and try again.",
            headers={"Retry-After": str(window)},
        )
    hits.append(now)
