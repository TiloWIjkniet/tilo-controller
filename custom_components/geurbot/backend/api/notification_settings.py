import json
import re

from copy import deepcopy
from pathlib import Path
from aiohttp import web


# ==================================================
# INSTELLINGEN
# ==================================================

DEFAULT_NOTIFICATION_SETTINGS = {
    "enabled": True,

    "general": {
        "sound": False,
        "quietHours": {
            "enabled": False,
            "start": "22:00",
            "end": "08:00"
        }
    },

    "devices": {
        "errors": True,
        "offline": True,
        "online": True,
        "sensorErrors": True
    },

   "fragrances": {
        "empty": True,
        "predictedEmpty": True,
        "unavailable": True,
        "available": True,
        "predictionDays": 3
    },

    "schedule": {
        "sprayError": True,
        "scheduleError": True
    },

    "firmware": {
        "available": True
    },

 

    "buffer": {
        "enabled": True,
        "delaySeconds": 10
    },

    "repeat": {
        "enabled": True,
        "intervalMinutes": 360
    }

    
}


_SETTINGS_PROVIDER = None

def set_settings_provider(provider):
    """Use HA Store as the authoritative settings source when configured."""
    global _SETTINGS_PROVIDER
    _SETTINGS_PROVIDER = provider


SETTINGS_FILE = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "notification_settings.json"
)


# ==================================================
# HULPFUNCTIES
# ==================================================

def merge_settings(defaults, supplied):
    result = deepcopy(defaults)

    for key, value in supplied.items():
        if key not in defaults:
            continue

        if isinstance(defaults[key], dict):
            if isinstance(value, dict):
                result[key] = merge_settings(defaults[key], value)
        else:
            result[key] = value

    return result


def validate_settings(settings):
    boolean_paths = [
        ("enabled",),
        ("general", "sound"),
        ("general", "quietHours", "enabled"),
        ("devices", "errors"),
        ("devices", "offline"),
        ("devices", "online"),
        ("devices", "sensorErrors"),
        ("fragrances", "empty"),
        ("fragrances", "predictedEmpty"),
        ("schedule", "sprayError"),
        ("schedule", "scheduleError"),
        ("firmware", "available"),
        ("buffer", "enabled"),
        ("repeat", "enabled")
    ]

    for path in boolean_paths:
        value = settings

        for key in path:
            value = value[key]

        if not isinstance(value, bool):
            raise ValueError(f"Invalid setting: {'.'.join(path)}")

    days = settings["fragrances"]["predictionDays"]
    delay = settings["buffer"]["delaySeconds"]
    repeat_interval = settings["repeat"]["intervalMinutes"]

    if type(days) is not int or not 1 <= days <= 14:
        raise ValueError("predictionDays must be between 1 and 14")
    if type(delay) is not int or not 1 <= delay <= 300:
        raise ValueError("buffer.delaySeconds must be between 1 and 300")
    if type(repeat_interval) is not int or not 1 <= repeat_interval <= 10080:
        raise ValueError("repeat.intervalMinutes must be between 1 and 10080")

    for key in ("start", "end"):
        value = settings["general"]["quietHours"][key]

        if not isinstance(value, str) or not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", value):
            raise ValueError(f"Invalid quiet hours time: {key}")


def save_settings(settings):
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)

    temporary_file = SETTINGS_FILE.with_suffix(".tmp")

    with temporary_file.open("w", encoding="utf-8") as file:
        json.dump(settings, file, indent=4, ensure_ascii=False)

    temporary_file.replace(SETTINGS_FILE)


def load_settings():
    if _SETTINGS_PROVIDER is not None:
        supplied = _SETTINGS_PROVIDER()
        return merge_settings(DEFAULT_NOTIFICATION_SETTINGS, supplied or {})

    if not SETTINGS_FILE.exists():
        settings = deepcopy(DEFAULT_NOTIFICATION_SETTINGS)
        save_settings(settings)
        return settings

    try:
        with SETTINGS_FILE.open("r", encoding="utf-8") as file:
            stored_settings = json.load(file)

        if not isinstance(stored_settings, dict):
            raise ValueError("Invalid settings format")

        settings = merge_settings(
            DEFAULT_NOTIFICATION_SETTINGS,
            stored_settings
        )

        validate_settings(settings)

        return settings

    except (OSError, ValueError, TypeError, KeyError) as error:
        print("[NOTIFICATIONS] Failed to load settings:", error)

        settings = deepcopy(DEFAULT_NOTIFICATION_SETTINGS)
        save_settings(settings)

        return settings


# ==================================================
# GET NOTIFICATIONS
# ==================================================

async def get_notification_settings(request):
    settings = load_settings()

    return web.json_response(settings)


# ==================================================
# PUT NOTIFICATIONS
# ==================================================

async def update_notification_settings(request):
    try:
        data = await request.json()

        if not isinstance(data, dict):
            raise ValueError("Expected a JSON object")

        settings = merge_settings(
            DEFAULT_NOTIFICATION_SETTINGS,
            data
        )

        validate_settings(settings)

        save_settings(settings)

        print("[NOTIFICATIONS] Settings updated")

        return web.json_response({
            "success": True,
            "settings": settings
        })

    except (ValueError, TypeError, KeyError) as error:
        return web.json_response({
            "success": False,
            "error": str(error)
        }, status=400)

    except OSError as error:
        print("[NOTIFICATIONS] Failed to save settings:", error)

        return web.json_response({
            "success": False,
            "error": "Could not save notification settings"
        }, status=500)