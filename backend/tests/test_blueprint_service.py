from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.models.blueprint import BlueprintRead
from app.services.blueprint_service import (
    BlueprintDirectoryError,
    BlueprintNotFoundError,
    delete_blueprint,
    get_blueprint,
    get_sbp_path,
    list_blueprints,
    save_blueprint,
)


def _write_blueprint(directory: Path, name: str, *, with_cfg: bool = True) -> None:
    (directory / f"{name}.sbp").write_bytes(b"SBP_FAKE_DATA")
    if with_cfg:
        cfg = {
            "description": f"Desc {name}",
            "iconID": 2,
            "color": {"R": 0.1, "G": 0.2, "B": 0.3, "A": 1.0},
        }
        (directory / f"{name}.sbpcfg").write_text(json.dumps(cfg), encoding="utf-8")


class TestListBlueprints:
    def test_list_blueprints_when_empty_dir_should_return_empty_list(self, tmp_path: Path) -> None:
        result = list_blueprints(str(tmp_path))
        assert result == []

    def test_list_blueprints_when_dir_missing_should_return_empty_list(self, tmp_path: Path) -> None:
        result = list_blueprints(str(tmp_path / "nonexistent"))
        assert result == []

    def test_list_blueprints_when_blueprints_present_should_return_all(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "alpha")
        _write_blueprint(tmp_path, "beta")
        result = list_blueprints(str(tmp_path))
        assert len(result) == 2
        names = [bp.name for bp in result]
        assert "alpha" in names
        assert "beta" in names

    def test_list_blueprints_when_cfg_present_should_parse_description(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "myblueprint")
        result = list_blueprints(str(tmp_path))
        assert result[0].description == "Desc myblueprint"
        assert result[0].icon_id == 2

    def test_list_blueprints_when_cfg_present_should_parse_color(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "colored")
        result = list_blueprints(str(tmp_path))
        assert result[0].color is not None
        assert result[0].color.r == pytest.approx(0.1)

    def test_list_blueprints_when_only_sbp_no_cfg_should_return_blueprint(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "nocfg", with_cfg=False)
        result = list_blueprints(str(tmp_path))
        assert len(result) == 1
        assert result[0].has_cfg is False
        assert result[0].has_sbp is True

    def test_list_blueprints_when_sorted_should_return_alphabetically(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "zebra")
        _write_blueprint(tmp_path, "apple")
        result = list_blueprints(str(tmp_path))
        assert result[0].name == "apple"
        assert result[1].name == "zebra"


class TestGetBlueprint:
    def test_get_blueprint_when_exists_should_return_it(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "factory1")
        bp = get_blueprint(str(tmp_path), "factory1")
        assert isinstance(bp, BlueprintRead)
        assert bp.name == "factory1"

    def test_get_blueprint_when_missing_should_raise_not_found(self, tmp_path: Path) -> None:
        with pytest.raises(BlueprintNotFoundError):
            get_blueprint(str(tmp_path), "ghost")


class TestGetSbpPath:
    def test_get_sbp_path_when_exists_should_return_path(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "bp1")
        path = get_sbp_path(str(tmp_path), "bp1")
        assert path.exists()
        assert path.suffix == ".sbp"

    def test_get_sbp_path_when_missing_should_raise_not_found(self, tmp_path: Path) -> None:
        with pytest.raises(BlueprintNotFoundError):
            get_sbp_path(str(tmp_path), "ghost")


class TestSaveBlueprint:
    def test_save_blueprint_when_new_should_return_true(self, tmp_path: Path) -> None:
        is_new = save_blueprint(str(tmp_path), "newbp", b"data", None)
        assert is_new is True
        assert (tmp_path / "newbp.sbp").exists()

    def test_save_blueprint_when_overwrite_should_return_false(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "existing")
        is_new = save_blueprint(str(tmp_path), "existing", b"new_data", None)
        assert is_new is False

    def test_save_blueprint_when_cfg_provided_should_write_cfg(self, tmp_path: Path) -> None:
        cfg = json.dumps({"description": "test"}).encode()
        save_blueprint(str(tmp_path), "withcfg", b"sbp_data", cfg)
        assert (tmp_path / "withcfg.sbpcfg").exists()

    def test_save_blueprint_when_dir_missing_should_create_it(self, tmp_path: Path) -> None:
        new_dir = tmp_path / "sub" / "blueprints"
        save_blueprint(str(new_dir), "bp", b"data", None)
        assert (new_dir / "bp.sbp").exists()


class TestDeleteBlueprint:
    def test_delete_blueprint_when_exists_should_remove_files(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "todelete")
        delete_blueprint(str(tmp_path), "todelete")
        assert not (tmp_path / "todelete.sbp").exists()
        assert not (tmp_path / "todelete.sbpcfg").exists()

    def test_delete_blueprint_when_missing_should_raise_not_found(self, tmp_path: Path) -> None:
        with pytest.raises(BlueprintNotFoundError):
            delete_blueprint(str(tmp_path), "ghost")
