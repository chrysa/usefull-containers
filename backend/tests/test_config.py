"""Settings behaviour: CORS origins are env-driven so the frontend on any dev
port is reachable without editing code (comma-separated string or JSON list)."""

from __future__ import annotations

from app.config import Settings


class TestCorsOrigins:
    def test_default_covers_common_dev_ports(self) -> None:
        settings = Settings()
        assert "http://localhost:5173" in settings.cors_origins
        assert "http://localhost:3000" in settings.cors_origins

    def test_comma_separated_env_string_is_split(self) -> None:
        settings = Settings(cors_origins="http://localhost:4000, http://localhost:5000")
        assert settings.cors_origins == [
            "http://localhost:4000",
            "http://localhost:5000",
        ]

    def test_blank_entries_are_dropped(self) -> None:
        settings = Settings(cors_origins="http://localhost:4000,,  ")
        assert settings.cors_origins == ["http://localhost:4000"]

    def test_plain_list_is_preserved(self) -> None:
        origins = ["http://localhost:8080"]
        assert Settings(cors_origins=origins).cors_origins == origins
