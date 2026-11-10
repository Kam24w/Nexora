# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller: Nexora as a single executable (Flask API + React build).

Run it through `python build.py`, which builds the interface first.
Output: dist/Nexora.exe (Windows) or dist/Nexora.
"""

from pathlib import Path

ROOT = Path(SPECPATH)
WEB_BUILD = ROOT / "frontend" / "dist"

if not (WEB_BUILD / "index.html").is_file():
    raise SystemExit("frontend/dist is missing: run `python build.py` instead of PyInstaller directly.")

a = Analysis(
    [str(ROOT / "nexora_app.py")],
    pathex=[str(ROOT)],
    # Unpacked to sys._MEIPASS/web at runtime (see api/paths.py).
    datas=[(str(WEB_BUILD), "web")],
    hiddenimports=[],
    excludes=["tkinter", "unittest", "pydoc", "test"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name="Nexora",
    # Generated from the logo by tools/make_icon.py.
    icon=str(ROOT / "assets" / "nexora.ico"),
    # Console kept: it shows the address and closing it stops the local server.
    console=True,
    upx=False,
    debug=False,
    strip=False,
)
