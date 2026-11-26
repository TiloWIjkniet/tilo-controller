
import json
import re
import inspect

from copy import deepcopy
from pathlib import Path
from aiohttp import web


# ==================================================
# DEFAULT INSTELLINGEN
# ==================================================

DEFAULT_NOTIFICATION_SETTINGS = {
    "enabled": True,

    # Algemene notificatiebestemmingen.
    "destinations": [],

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


# ==================================================
# INSTELLINGEN PROVIDER
# ==================================================

_SETTINGS_PROVIDER = None
_SETTINGS_WRITER = None


def set_settings_provider(provider, writer=None):
    """
    Configure the settings provider.

    provider:
        Function that returns the current settings.

    writer:
        Optional function that saves updated settings.
        Can be synchronous or asynchronous.
    """

    global _SETTINGS_PROVIDER
    global _SETTINGS_WRITER

    _SETTINGS_PROVIDER = provider
    _SETTINGS_WRITER = writer


SETTINGS_FILE = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "notification_settings.json"
)


# ==================================================
# HULPFUNCTIES
# ==================================================

def merge_settings(defaults, supplied):
    """
    Merge supplied settings with defaults.

    Unknown settings are ignored.
    Missing settings automatically receive their default value.
    """

    result = deepcopy(defaults)

    if not isinstance(supplied, dict):
        return result

    for key, value in supplied.items():
        if key not in defaults:
            continue

        if isinstance(defaults[key], dict):
            if isinstance(value, dict):
                result[key] = merge_settings(defaults[key], value)

        else:
            result[key] = value

    return result


# ==================================================
# VALIDATIE
# ==================================================

def validate_settings(settings):
    """Validate all notification settings."""

    if not isinstance(settings, dict):
        raise ValueError("Settings must be a JSON object")

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
        ("fragrances", "unavailable"),
        ("fragrances", "available"),

        ("schedule", "sprayError"),
        ("schedule", "scheduleError"),

        ("firmware", "available"),

        ("buffer", "enabled"),
        ("repeat", "enabled")
    ]

    for path in boolean_paths:
        value = settings

        for key in path:
            if not isinstance(value, dict) or key not in value:
                raise ValueError(
                    f"Missing setting: {'.'.join(path)}"
                )

            value = value[key]

        if not isinstance(value, bool):
            raise ValueError(
                f"Invalid setting: {'.'.join(path)}"
            )

    # ----------------------------------------------
    # NOTIFICATIEBESTEMMINGEN
    # ----------------------------------------------

    destinations = settings["destinations"]

    if not isinstance(destinations, list):
        raise ValueError(
            "destinations must be a list"
        )

    if not all(
        isinstance(destination, str)
        and re.fullmatch(
            r"notify\.[a-z0-9_]+",
            destination
        )
        for destination in destinations
    ):
        raise ValueError(
            "destinations must contain valid notify entity IDs"
        )

    if len(destinations) != len(set(destinations)):
        raise ValueError(
            "destinations cannot contain duplicates"
        )

    # ----------------------------------------------
    # NUMERIEKE INSTELLINGEN
    # ----------------------------------------------

    days = settings["fragrances"]["predictionDays"]
    delay = settings["buffer"]["delaySeconds"]
    repeat_interval = settings["repeat"]["intervalMinutes"]

    if type(days) is not int or not 1 <= days <= 14:
        raise ValueError(
            "predictionDays must be between 1 and 14"
        )

    if type(delay) is not int or not 1 <= delay <= 300:
        raise ValueError(
            "buffer.delaySeconds must be between 1 and 300"
        )

    if (
        type(repeat_interval) is not int
        or not 1 <= repeat_interval <= 10080
    ):
        raise ValueError(
            "repeat.intervalMinutes must be between 1 and 10080"
        )

    # ----------------------------------------------
    # STILLE UREN
    # ----------------------------------------------

    quiet_hours = settings["general"]["quietHours"]

    for key in ("start", "end"):
        value = quiet_hours[key]

        if (
            not isinstance(value, str)
            or not re.fullmatch(
                r"(?:[01]\d|2[0-3]):[0-5]\d",
                value
            )
        ):
            raise ValueError(
                f"Invalid quiet hours time: {key}"
            )


# ==================================================
# OPSLAAN NAAR JSON
# ==================================================

def save_settings(settings):
    """Save notification settings safely to a JSON file."""

    SETTINGS_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    temporary_file = SETTINGS_FILE.with_suffix(".tmp")

    with temporary_file.open("w", encoding="utf-8") as file:
        json.dump(
            settings,
            file,
            indent=4,
            ensure_ascii=False
        )

    temporary_file.replace(SETTINGS_FILE)


# ==================================================
# LADEN
# ==================================================

def load_settings():
    """
    Load notification settings.

    Home Assistant Store is authoritative when configured.
    Otherwise, settings are loaded from the local JSON file.
    """

    if _SETTINGS_PROVIDER is not None:
        supplied = _SETTINGS_PROVIDER()

        settings = merge_settings(
            DEFAULT_NOTIFICATION_SETTINGS,
            supplied or {}
        )

        validate_settings(settings)

        return settings

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
        print(
            "[NOTIFICATIONS] Failed to load settings:",
            error
        )

        settings = deepcopy(DEFAULT_NOTIFICATION_SETTINGS)

        save_settings(settings)

        return settings


# ==================================================
# GET NOTIFICATION SETTINGS
# ==================================================

async def get_notification_settings(request):
    """Return current notification settings."""

    try:
        settings = load_settings()

        return web.json_response(settings)

    except Exception as error:
        print(
            "[NOTIFICATIONS] Failed to get settings:",
            error
        )

        return web.json_response({
            "success": False,
            "error": "Could not load notification settings"
        }, status=500)


# ==================================================
# PUT NOTIFICATION SETTINGS
# ==================================================

async def update_notification_settings(request):
    """Validate and update notification settings."""

    try:
        data = await request.json()

        if not isinstance(data, dict):
            raise ValueError("Expected a JSON object")

        settings = merge_settings(
            DEFAULT_NOTIFICATION_SETTINGS,
            data
        )

        validate_settings(settings)

        # ------------------------------------------
        # HOME ASSISTANT STORE
        # ------------------------------------------

        if _SETTINGS_PROVIDER is not None:
            if _SETTINGS_WRITER is None:
                raise RuntimeError(
                    "Home Assistant settings provider has no writer"
                )

            result = _SETTINGS_WRITER(settings)

            if inspect.isawaitable(result):
                await result

        # ------------------------------------------
        # LOKAAL JSON-BESTAND
        # ------------------------------------------

        else:
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

    except RuntimeError as error:
        print(
            "[NOTIFICATIONS] Settings configuration error:",
            error
        )

        return web.json_response({
            "success": False,
            "error": "Notification settings storage is not configured"
        }, status=500)

    except OSError as error:
        print(
            "[NOTIFICATIONS] Failed to save settings:",
            error
        )

        return web.json_response({
            "success": False,
            "error": "Could not save notification settings"
        }, status=500)

    except Exception as error:
        print(
            "[NOTIFICATIONS] Failed to update settings:",
            error
        )

        return web.json_response({
            "success": False,
            "error": "Could not update notification settings"
        }, status=500)
