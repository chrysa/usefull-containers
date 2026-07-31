from __future__ import annotations

from typing import Any

import httpx
import pytest

from app.config import settings
from app.services import ai_client


class _FakeResponse:
    def __init__(self, json_data: object, *, status: int = 200) -> None:
        self._json = json_data
        self.status_code = status

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                "error",
                request=httpx.Request("POST", "http://x"),
                response=httpx.Response(self.status_code),
            )

    def json(self) -> object:
        if isinstance(self._json, Exception):
            raise self._json
        return self._json


class _FakeClient:
    def __init__(self, *, response: _FakeResponse | None = None, exc: Exception | None = None):
        self._response = response
        self._exc = exc
        self.calls: list[dict[str, Any]] = []

    async def __aenter__(self) -> _FakeClient:
        return self

    async def __aexit__(self, *_: object) -> bool:
        return False

    async def post(
        self, url: str, *, json: dict[str, Any], headers: dict[str, str]
    ) -> _FakeResponse:
        self.calls.append({"url": url, "json": json, "headers": headers})
        if self._exc is not None:
            raise self._exc
        assert self._response is not None
        return self._response


def _patch_client(monkeypatch: pytest.MonkeyPatch, client: _FakeClient) -> None:
    monkeypatch.setattr("app.services.ai_client.httpx.AsyncClient", lambda *a, **k: client)


@pytest.fixture
def enabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "ai_aggregator_url", "http://gateway:8000")
    monkeypatch.setattr(settings, "ai_aggregator_api_key", "secret")
    monkeypatch.setattr(settings, "assistant_model", "")


async def test_returns_none_when_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "ai_aggregator_url", "")
    assert await ai_client.complete("hello") is None


async def test_success_returns_text(monkeypatch: pytest.MonkeyPatch, enabled: None) -> None:
    fake = _FakeClient(response=_FakeResponse({"text": "  42  ", "provider": "anthropic"}))
    _patch_client(monkeypatch, fake)

    result = await ai_client.complete("the question")

    assert result == "42"
    assert fake.calls[0]["url"] == "http://gateway:8000/api/v1/completions"
    assert fake.calls[0]["headers"]["X-API-Key"] == "secret"
    assert fake.calls[0]["json"]["prompt"] == "the question"
    assert "model" not in fake.calls[0]["json"]


async def test_model_forwarded_when_set(monkeypatch: pytest.MonkeyPatch, enabled: None) -> None:
    monkeypatch.setattr(settings, "assistant_model", "claude-haiku-4-5")
    fake = _FakeClient(response=_FakeResponse({"text": "ok"}))
    _patch_client(monkeypatch, fake)

    await ai_client.complete("q")

    assert fake.calls[0]["json"]["model"] == "claude-haiku-4-5"


async def test_network_error_returns_none(monkeypatch: pytest.MonkeyPatch, enabled: None) -> None:
    _patch_client(monkeypatch, _FakeClient(exc=httpx.ConnectError("boom")))
    assert await ai_client.complete("q") is None


async def test_http_status_error_returns_none(
    monkeypatch: pytest.MonkeyPatch, enabled: None
) -> None:
    _patch_client(monkeypatch, _FakeClient(response=_FakeResponse({}, status=503)))
    assert await ai_client.complete("q") is None


async def test_bad_json_returns_none(monkeypatch: pytest.MonkeyPatch, enabled: None) -> None:
    _patch_client(monkeypatch, _FakeClient(response=_FakeResponse(ValueError("bad json"))))
    assert await ai_client.complete("q") is None


async def test_empty_text_returns_none(monkeypatch: pytest.MonkeyPatch, enabled: None) -> None:
    _patch_client(monkeypatch, _FakeClient(response=_FakeResponse({"text": "   "})))
    assert await ai_client.complete("q") is None
