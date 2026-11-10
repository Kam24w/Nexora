"""Nexora desktop entry point: the local API and the interface on one port.

This is what the PyInstaller executable runs. It reads `.env` from the folder of
the executable (GROQ_API_KEY), serves the bundled React build and opens the
browser. Closing the console window stops Nexora.
"""

import logging
import os
import threading
import webbrowser

from dotenv import load_dotenv

from api.paths import app_home, web_root

# Before importing the app: the AI client reads GROQ_* when it is created.
load_dotenv(app_home() / ".env")

from api import create_app  # noqa: E402

DEFAULT_PORT = 5000


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    port = int(os.environ.get("NEXORA_PORT", DEFAULT_PORT))
    app = create_app(web_root=web_root())
    url = f"http://127.0.0.1:{port}/"

    if not os.environ.get("GROQ_API_KEY"):
        logging.warning("GROQ_API_KEY is not set in %s: diagnoses will use the rule engine.", app_home() / ".env")
    if os.environ.get("NEXORA_NO_BROWSER") != "1":
        threading.Timer(1.0, webbrowser.open, args=[url]).start()

    print(f"\n  Nexora está en marcha: {url}\n  Cierra esta ventana para detenerlo.\n")
    app.run(host="127.0.0.1", port=port, threaded=True)


if __name__ == "__main__":
    main()
