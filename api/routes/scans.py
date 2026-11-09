from flask import Blueprint, current_app, jsonify

from api.requests import json_object_body

scan_routes = Blueprint("scans", __name__)


def _scans():
    return current_app.extensions["scans"]


@scan_routes.post("/scans")
def start_scan():
    """Starts a basic ({"type": "basic"}) or advanced ({"type": "advanced"}) scan in the background."""
    scan_type = json_object_body().get("type", "basic")
    if scan_type not in ("basic", "advanced"):
        return jsonify({"error": "invalid_scan_type"}), 400
    return jsonify(_scans().start(deep=scan_type == "advanced")), 202


@scan_routes.get("/scans/<job_id>")
def scan_status(job_id):
    """Current step and progress; includes the result once the scan has completed."""
    job = _scans().get(job_id)
    if job is None:
        return jsonify({"error": "scan_not_found"}), 404
    return jsonify(job)


@scan_routes.post("/diagnose")
def diagnose():
    """Synchronous basic scan (kept for scripts and older clients)."""
    return jsonify(_scans().run_now(deep=False))


@scan_routes.post("/deep-scan")
def deep_scan():
    """Synchronous advanced scan (kept for scripts and older clients)."""
    return jsonify(_scans().run_now(deep=True))
