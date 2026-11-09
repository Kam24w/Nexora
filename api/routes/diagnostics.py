import platform
import threading

from flask import Blueprint, current_app, jsonify

from api.errors import ScanInProgressError
from api.requests import json_object_body
from main import run_diagnosis

diagnostics_routes = Blueprint("diagnostics", __name__)

OPERATING_SYSTEMS = {"Windows": "Windows", "Linux": "Linux", "Darwin": "macOS"}

# Two scans at once would skew each other's CPU samples.
_scan_lock = threading.Lock()


def _exclusive_scan(deep):
    if not _scan_lock.acquire(blocking=False):
        raise ScanInProgressError
    try:
        return run_diagnosis(deep=deep)
    finally:
        _scan_lock.release()


@diagnostics_routes.post("/diagnose")
def diagnose():
    """Captures CPU, RAM, storage, temperature and processes, plus the rule-based pre-check."""
    return jsonify(_exclusive_scan(deep=False))


@diagnostics_routes.post("/deep-scan")
def deep_scan():
    """On-demand scan: every running process, classified, with a longer CPU observation (about a minute)."""
    return jsonify(_exclusive_scan(deep=True))


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
