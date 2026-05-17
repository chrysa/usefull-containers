from __future__ import annotations

import io
import json
import zipfile
from pathlib import Path

import pytest

from app.models.blueprint import BlueprintRead
from app.services.blueprint_service import (
    BlueprintDirectoryError,
    BlueprintNotFoundError,
    InvalidZipError,
    build_blueprints_zip,
    delete_blueprint,
    extract_zip_to_batch,
    get_blueprint,
    get_sbp_path,
    list_blueprints,
    save_blueprint,
    save_blueprint_batch,
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

    def test_list_blueprints_when_dir_missing_should_return_empty_list(
        self, tmp_path: Path
    ) -> None:
        result = list_blueprints(str(tmp_path / "nonexistent"))
        assert result == []

    def test_list_blueprints_when_blueprints_present_should_return_all(
        self, tmp_path: Path
    ) -> None:
        _write_blueprint(tmp_path, "alpha")
        _write_blueprint(tmp_path, "beta")
        result = list_blueprints(str(tmp_path))
        assert len(result) == 2
        names = [bp.name for bp in result]
        assert "alpha" in names
        assert "beta" in names

    def test_list_blueprints_when_cfg_present_should_parse_description(
        self, tmp_path: Path
    ) -> None:
        _write_blueprint(tmp_path, "myblueprint")
        result = list_blueprints(str(tmp_path))
        assert result[0].description == "Desc myblueprint"
        assert result[0].icon_id == 2

    def test_list_blueprints_when_cfg_present_should_parse_color(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "colored")
        result = list_blueprints(str(tmp_path))
        assert result[0].color is not None
        assert result[0].color.r == pytest.approx(0.1)

    def test_list_blueprints_when_only_sbp_no_cfg_should_return_blueprint(
        self, tmp_path: Path
    ) -> None:
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


class TestBuildBlueprintsZip:
    def test_build_zip_when_empty_dir_should_return_valid_empty_zip(self, tmp_path: Path) -> None:
        data = build_blueprints_zip(str(tmp_path))
        zf = zipfile.ZipFile(io.BytesIO(data))
        assert zf.namelist() == []

    def test_build_zip_when_dir_missing_should_return_valid_empty_zip(self, tmp_path: Path) -> None:
        data = build_blueprints_zip(str(tmp_path / "nonexistent"))
        zf = zipfile.ZipFile(io.BytesIO(data))
        assert zf.namelist() == []

    def test_build_zip_when_blueprints_present_should_include_sbp_and_cfg(
        self, tmp_path: Path
    ) -> None:
        _write_blueprint(tmp_path, "alpha")
        _write_blueprint(tmp_path, "beta", with_cfg=False)
        data = build_blueprints_zip(str(tmp_path))
        zf = zipfile.ZipFile(io.BytesIO(data))
        names = zf.namelist()
        assert "alpha.sbp" in names
        assert "alpha.sbpcfg" in names
        assert "beta.sbp" in names

    def test_build_zip_when_blueprints_present_should_preserve_file_content(
        self, tmp_path: Path
    ) -> None:
        (tmp_path / "solo.sbp").write_bytes(b"FAKE_SBP_CONTENT")
        data = build_blueprints_zip(str(tmp_path))
        zf = zipfile.ZipFile(io.BytesIO(data))
        assert zf.read("solo.sbp") == b"FAKE_SBP_CONTENT"

    def test_build_zip_when_path_is_not_dir_should_raise_directory_error(
        self, tmp_path: Path
    ) -> None:
        not_a_dir = tmp_path / "file.txt"
        not_a_dir.write_text("hello")
        with pytest.raises(BlueprintDirectoryError):
            build_blueprints_zip(str(not_a_dir))


class TestSaveBlueprintBatch:
    def test_batch_with_only_sbp_files_should_create_blueprints(self, tmp_path: Path) -> None:
        files = {
            "alpha.sbp": b"SBP_ALPHA",
            "beta.sbp": b"SBP_BETA",
        }
        result = save_blueprint_batch(str(tmp_path), files)
        assert result.total == 2
        assert "alpha" in result.created
        assert "beta" in result.created
        assert result.updated == []
        assert result.failed == []

    def test_batch_with_sbp_and_cfg_should_save_both(self, tmp_path: Path) -> None:
        files = {
            "iron.sbp": b"SBP_IRON",
            "iron.sbpcfg": b'{"description":"Iron"}',
        }
        result = save_blueprint_batch(str(tmp_path), files)
        assert "iron" in result.created
        assert (tmp_path / "iron.sbpcfg").exists()

    def test_batch_update_existing_should_count_as_updated(self, tmp_path: Path) -> None:
        _write_blueprint(tmp_path, "alpha")
        files = {"alpha.sbp": b"NEW_SBP_DATA"}
        result = save_blueprint_batch(str(tmp_path), files)
        assert "alpha" in result.updated
        assert result.created == []

    def test_batch_ignores_non_blueprint_extensions(self, tmp_path: Path) -> None:
        files = {
            "readme.txt": b"hello",
            "valid.sbp": b"SBP_DATA",
        }
        result = save_blueprint_batch(str(tmp_path), files)
        assert result.total == 1
        assert "valid" in result.created

    def test_batch_with_empty_files_dict_should_return_zero_total(self, tmp_path: Path) -> None:
        result = save_blueprint_batch(str(tmp_path), {})
        assert result.total == 0
        assert result.created == []


def _make_zip(files: dict[str, bytes]) -> bytes:
    """Build an in-memory ZIP from a filename→bytes mapping."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w") as zf:
        for name, data in files.items():
            zf.writestr(name, data)
    return buf.getvalue()


class TestExtractZipToBatch:
    def test_extracts_sbp_and_cfg_files(self) -> None:
        zip_bytes = _make_zip({"alpha.sbp": b"SBP", "alpha.sbpcfg": b"{}"})
        result = extract_zip_to_batch(zip_bytes, max_file_size=1024)
        assert "alpha.sbp" in result
        assert "alpha.sbpcfg" in result
        assert result["alpha.sbp"] == b"SBP"

    def test_ignores_non_blueprint_extensions(self) -> None:
        zip_bytes = _make_zip({"readme.txt": b"hello", "iron.sbp": b"SBP"})
        result = extract_zip_to_batch(zip_bytes, max_file_size=1024)
        assert "readme.txt" not in result
        assert "iron.sbp" in result

    def test_skips_oversized_files(self) -> None:
        zip_bytes = _make_zip({"big.sbp": b"x" * 100})
        result = extract_zip_to_batch(zip_bytes, max_file_size=50)
        assert "big.sbp" not in result

    def test_flattens_nested_directory_entries(self) -> None:
        zip_bytes = _make_zip({"subdir/iron.sbp": b"SBP_IRON"})
        result = extract_zip_to_batch(zip_bytes, max_file_size=1024)
        assert "iron.sbp" in result

    def test_invalid_zip_raises_error(self) -> None:
        with pytest.raises(InvalidZipError):
            extract_zip_to_batch(b"not a zip", max_file_size=1024)

    def test_empty_zip_returns_empty_dict(self) -> None:
        zip_bytes = _make_zip({})
        result = extract_zip_to_batch(zip_bytes, max_file_size=1024)
        assert result == {}
