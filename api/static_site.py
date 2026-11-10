"""Serves the React build from Flask, so the desktop app is a single local server.

API routes are more specific than the catch-all below, so they always win; any
other GET path returns index.html and the interface resolves it (hash routing).
"""

from pathlib import Path

from flask import send_from_directory

# Vite fingerprints asset names, so they can be cached for a year; index.html never.
ASSET_MAX_AGE_S = 365 * 24 * 3600


def register_static_site(app, web_root):
    web_root = Path(web_root)
    if not (web_root / "index.html").is_file():
        raise FileNotFoundError(f"React build not found in {web_root}; run `npm run build` in frontend/")

    def index():
        response = send_from_directory(web_root, "index.html", max_age=0)
        response.headers["Cache-Control"] = "no-cache"
        return response

    @app.get("/")
    def site_index():
        return index()

    @app.get("/<path:path>")
    def site_file(path):
        if (web_root / path).is_file():
            return send_from_directory(web_root, path, max_age=ASSET_MAX_AGE_S if path.startswith("assets/") else 3600)
        return index()
