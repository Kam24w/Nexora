"""Nexora desktop entry point: the local API and the interface on one port.

This is what the PyInstaller executable runs. It reads `.env` or `nexora.env` from the
folder of the executable (GROQ_API_KEY), serves the bundled React build and opens the
browser. Closing the console window stops Nexora.
"""

import logging
import os
import socket
import threading
import webbrowser

from dotenv import load_dotenv

from api.paths import app_home, web_root

# Settings file next to the executable. "nexora.env" is the visible alternative:
# macOS Finder and Linux file managers hide files whose name starts with a dot.
SETTINGS_FILES = (".env", "nexora.env")


def settings_file():
    """The settings file in use (the first that exists), or the default name for messages."""
    for name in SETTINGS_FILES:
        if (app_home() / name).is_file():
            return app_home() / name
    return app_home() / SETTINGS_FILES[-1]


# Before importing the app: the AI client reads GROQ_* when it is created.
load_dotenv(settings_file())

from api import create_app  # noqa: E402

DEFAULT_PORT = 5000
PORT_ATTEMPTS = 10


def find_free_port(preferred):
    """The preferred port or the next free one (e.g. while `server.py` uses 5000 for development).

    The port is part of the browser origin, where the session is stored: a stable
    port keeps the user signed in between runs.
    """
    for port in range(preferred, preferred + PORT_ATTEMPTS):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            if probe.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError(f"No free port between {preferred} and {preferred + PORT_ATTEMPTS - 1}; set NEXORA_PORT")


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    port = find_free_port(int(os.environ.get("NEXORA_PORT", DEFAULT_PORT)))
    app = create_app(web_root=web_root())
    url = f"http://127.0.0.1:{port}/"

    if not os.environ.get("GROQ_API_KEY"):
        logging.warning("GROQ_API_KEY is not set in %s: diagnoses will use the rule engine.", settings_file())
    if os.environ.get("NEXORA_NO_BROWSER") != "1":
        threading.Timer(1.0, webbrowser.open, args=[url]).start()

    print(f"\n  Nexora está en marcha: {url}\n  Cierra esta ventana para detenerlo.\n")
    # load_dotenv=False: Flask would also read any .env in the working directory
    # (and its parents); only the one next to the executable must count.
    app.run(host="127.0.0.1", port=port, threaded=True, load_dotenv=False)


if __name__ == "__main__":
    main()
