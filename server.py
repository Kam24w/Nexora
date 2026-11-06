import logging
import platform

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# Loads ANTHROPIC_API_KEY (and friends) from ./.env before the AI client is created.
load_dotenv()

from diagnosis.ai_diagnostic_service import (  # noqa: E402
    AIDiagnosisError,
    AIDiagnosticService,
    AINotConfiguredError,
    AIRefusedError,
    InvalidTelemetryError,
)
from main import run_diagnosis  # noqa: E402

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

ai_service = AIDiagnosticService()

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


@app.post("/ai-diagnosis")
def ai_diagnosis():
    """Sends a telemetry snapshot to AIDiagnosticService and returns the cause and solutions."""
    payload = request.get_json(silent=True) or {}

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
    app.run(debug=True)
