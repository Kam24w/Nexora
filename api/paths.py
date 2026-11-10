"""Where Nexora's files live, both from source and inside a PyInstaller executable.

A one-file executable unpacks its bundled data into a temporary folder
(`sys._MEIPASS`); user files such as `.env` must instead sit next to the .exe.
"""

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def is_frozen():
    return bool(getattr(sys, "frozen", False))


def bundle_root():
    """Read-only files shipped with the app (the React build)."""
    return Path(getattr(sys, "_MEIPASS", REPO_ROOT))


def app_home():
    """Folder for user files (.env): next to the executable, or the repository from source."""
    return Path(sys.executable).resolve().parent if is_frozen() else REPO_ROOT


def web_root():
    """The React build served by the desktop app."""
    return bundle_root() / "web" if is_frozen() else REPO_ROOT / "frontend" / "dist"
