from __future__ import annotations

from typing import Final

APP_TITLE: Final = "Satisfactory Factory Manager"
APP_VERSION: Final = "0.1.0"
API_PREFIX: Final = "/api/v1"

BLUEPRINTS_DIR_DEFAULT: Final = "/data/blueprints"
BLUEPRINT_FILE_EXT: Final = ".sbp"
BLUEPRINT_CFG_EXT: Final = ".sbpcfg"
BLUEPRINT_META_EXT: Final = ".meta.json"

MAX_BLUEPRINT_SIZE_BYTES: Final = 50 * 1024 * 1024  # 50 MB
BLUEPRINTS_ZIP_FILENAME: Final = "blueprints.zip"

GAMEDATA_DIR_DEFAULT: Final = "/data/gamedata"
GAMEDATA_JSON_FILENAME: Final = "gamedata.json"
MAX_GAMEDATA_ZIP_SIZE_BYTES: Final = 100 * 1024 * 1024  # 100 MB

DATA_DIR_DEFAULT: Final = "/data"
PLANS_FILENAME: Final = "plans.json"
