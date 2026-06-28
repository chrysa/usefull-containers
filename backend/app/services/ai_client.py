"""Thin async client for the chrysa ai-aggregator gateway (L10).

The assistant uses this to get genuine natural-language answers. The gateway
contract is a single endpoint:

    POST {ai_aggregator_url}/api/v1/completions
    headers: X-API-Key: <key>
    body:    {prompt, max_tokens, temperature, model?}
    -> 200:  {text, provider, model, input_tokens, output_tokens, total_tokens}

This module never raises to its callers: any network error, timeout, non-200
status, or malformed payload is logged and surfaced as ``None`` so the assistant
can fall back to its deterministic rule-based engine. Nothing in the app should
depend on a live gateway being reachable.
"""

from __future__ import annotations

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_COMPLETIONS_PATH = "/api/v1/completions"


async def complete(prompt: str) -> str | None:
    """Return the gateway's completion for ``prompt``, or ``None`` on any failure.

    Returns ``None`` immediately when the LLM path is disabled (no gateway URL
    configured), so callers can treat ``None`` uniformly as "fall back".
    """
    if not settings.assistant_llm_enabled:
        return None

    url = settings.ai_aggregator_url.rstrip("/") + _COMPLETIONS_PATH
    payload: dict[str, object] = {
        "prompt": prompt,
        "max_tokens": settings.assistant_max_tokens,
        "temperature": settings.assistant_temperature,
    }
    if settings.assistant_model:
        payload["model"] = settings.assistant_model

    headers = {}
    if settings.ai_aggregator_api_key:
        headers["X-API-Key"] = settings.ai_aggregator_api_key

    try:
        async with httpx.AsyncClient(timeout=settings.assistant_timeout_seconds) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError) as exc:  # ValueError covers bad JSON
        logger.warning("ai-aggregator completion failed: %s", exc)
        return None

    text = data.get("text") if isinstance(data, dict) else None
    if not isinstance(text, str) or not text.strip():
        logger.warning("ai-aggregator returned no usable text: %r", data)
        return None
    return text.strip()
