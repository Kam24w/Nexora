import platform

from flask import Blueprint, current_app, jsonify

from api.requests import json_object_body

diagnostics_routes = Blueprint("diagnostics", __name__)

OPERATING_SYSTEMS = {"Windows": "Windows", "Linux": "Linux", "Darwin": "macOS"}


@diagnostics_routes.post("/ai-diagnosis")
def ai_diagnosis():
    """Sends a telemetry snapshot to AIDiagnosticService and returns the cause and solutions."""
    payload = json_object_body()
    result = current_app.extensions["ai_service"].generate(
        telemetry=payload.get("telemetry"),
        language=payload.get("language", "es"),
        operating_system=OPERATING_SYSTEMS.get(platform.system(), platform.system()),
    )
    return jsonify(result)
