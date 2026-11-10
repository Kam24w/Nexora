"""Builds Nexora as a single executable: React build + PyInstaller, in one command.

    python build.py

Requirements: Node.js (npm) and the Python dependencies of requirements.txt and
requirements-build.txt in the active environment. The Supabase settings are read
from frontend/.env.local at build time (the anon key is public by design); the
GROQ_API_KEY is NOT bundled: put a .env next to the generated executable.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT / "frontend"
OUTPUT = ROOT / "dist" / ("Nexora.exe" if os.name == "nt" else "Nexora")


def step(message):
    print(f"\n==> {message}", flush=True)


def run(command, cwd, env=None):
    result = subprocess.run(command, cwd=cwd, env=env)
    if result.returncode != 0:
        sys.exit(f"Failed: {' '.join(map(str, command))}")


def build_frontend():
    npm = shutil.which("npm")
    if npm is None:
        sys.exit("npm was not found: install Node.js to build the interface.")
    if not (FRONTEND / ".env.local").is_file():
        print("Warning: frontend/.env.local is missing; the executable will run without Supabase (no accounts or reports).")

    if not (FRONTEND / "node_modules").is_dir():
        step("Installing frontend dependencies (npm ci)")
        run([npm, "ci"], FRONTEND)

    step("Building the interface (npm run build)")
    # The API lives on the same server as the interface inside the executable.
    run([npm, "run", "build"], FRONTEND, env={**os.environ, "VITE_DIAGNOSIS_API_URL": "same-origin"})


def build_executable():
    step("Packaging with PyInstaller")
    run([sys.executable, "-m", "PyInstaller", "nexora.spec", "--noconfirm", "--clean"], ROOT)


def main():
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        sys.exit("PyInstaller is not installed: pip install -r requirements-build.txt")

    build_frontend()
    build_executable()

    step("Done")
    print(f"Executable: {OUTPUT}")
    print("Copy your .env (GROQ_API_KEY) next to it and double-click it to start Nexora.")


if __name__ == "__main__":
    main()
