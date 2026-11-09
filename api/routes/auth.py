from flask import Blueprint, jsonify

from api.requests import json_object_body
from security.input_validation import validate_auth_payload

auth_routes = Blueprint("auth", __name__, url_prefix="/auth")


@auth_routes.post("/validate")
def validate():
    """Validates and sanitizes the login/signup form. Credentials are neither stored nor logged."""
    clean, errors = validate_auth_payload(json_object_body())
    if errors:
        return jsonify({"error": "validation_failed", "fields": errors}), 422
    return jsonify(clean)
