from flask import Blueprint, current_app, jsonify

from collector.hardware import get_hardware_profile

system_routes = Blueprint("system", __name__)


@system_routes.get("/health")
def health():
    return jsonify({"status": "ok", "ai_configured": current_app.extensions["ai_service"].is_configured})


@system_routes.get("/hardware")
def hardware():
    """CPU model, total RAM, storage and graphics cards of the machine running Nexora."""
    return jsonify(get_hardware_profile())
