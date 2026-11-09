import logging
import os
import platform
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

ROOT = Path(__file__).resolve().parent

# Loads GROQ_API_KEY from <repo>/.env (next to this file, whatever the working
# directory is) before the AI client is created.
load_dotenv(ROOT / ".env")

from collector.hardware import get_hardware_profile  # noqa: E402
from diagnosis.ai_diagnostic_service import (  # noqa: E402
    AIDiagnosisError,
    AIDiagnosticService,
    AINotConfiguredError,
    AIRefusedError,
    InvalidTelemetryError,
)
from main import run_diagnosis  # noqa: E402
from security.input_validation import validate_auth_payload  # noqa: E402

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Generous for a deep scan's telemetry; anything larger is rejected with 413.
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024

# Any port on the local machine: Vite moves to 5174+ when 5173 is busy, and
# `vite preview` serves on 4173. Every other origin is rejected.
LOCAL_ORIGINS = r"^http://(localhost|127\.0\.0\.1)(:\d{1,5})?$"

CORS(app, origins=[LOCAL_ORIGINS])

ai_service = AIDiagnosticService()

if not os.environ.get("GROQ_API_KEY"):
    misplaced = ROOT / "frontend" / ".env.local"
    hint = (
        " It was found in frontend/.env.local, which only Vite reads: move it to .env."
        if misplaced.exists() and "GROQ_API_KEY" in misplaced.read_text(encoding="utf-8", errors="ignore")
        else ""
    )
    logging.warning("GROQ_API_KEY is not set in %s; /ai-diagnosis will use the rule engine.%s", ROOT / ".env", hint)

OPERATING_SYSTEMS = {"Windows": "Windows", "Linux": "Linux", "Darwin": "macOS"}

ERROR_STATUS = {
    InvalidTelemetryError: 400,
    AIRefusedError: 422,
    AINotConfiguredError: 503,
}


@app.post("/diagnose")
def diagnose():
    """Captures CPU, RAM, storage, temperature and processes, plus the rule-based pre-check."""
    diagnosis = run_diagnosis()
    return jsonify(diagnosis)


@app.post("/deep-scan")
def deep_scan():
    """On-demand scan: every running process, classified, with a longer CPU observation (about a minute)."""
    return jsonify(run_diagnosis(deep=True))


@app.get("/hardware")
def hardware():
    """CPU model, total RAM, storage and graphics cards of the machine running Nexora."""
    return jsonify(get_hardware_profile())


def json_object_body():
    payload = request.get_json(silent=True)
    return payload if isinstance(payload, dict) else {}


@app.post("/auth/validate")
def auth_validate():
    """Validates and sanitizes the login/signup form. Credentials are neither stored nor logged."""
    clean, errors = validate_auth_payload(json_object_body())
    if errors:
        return jsonify({"error": "validation_failed", "fields": errors}), 422
    return jsonify(clean)


@app.post("/ai-diagnosis")
def ai_diagnosis():
    """Sends a telemetry snapshot to AIDiagnosticService and returns the cause and solutions."""
    payload = json_object_body()

    try:
        result = ai_service.generate(
            telemetry=payload.get("telemetry"),
            language=payload.get("language", "es"),
            operating_system=OPERATING_SYSTEMS.get(platform.system(), platform.system()),
        )
    except AIDiagnosisError as error:
        status = next((code for kind, code in ERROR_STATUS.items() if isinstance(error, kind)), 502)
        return jsonify({"error": error.code}), status

    return jsonify(result)


@app.get("/health")
def health():
    return jsonify({"status": "ok", "ai_configured": ai_service.is_configured})


if __name__ == "__main__":
    # IPv4 loopback explicitly: the frontend calls http://127.0.0.1:5000.
    app.run(host="127.0.0.1", port=5000, debug=True)
