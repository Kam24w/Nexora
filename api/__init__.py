"""Application factory of the local Nexora service."""

from flask import Flask
from flask_cors import CORS

from api.errors import register_error_handlers
from api.routes.auth import auth_routes
from api.routes.diagnostics import diagnostics_routes
from api.routes.system import system_routes
from diagnosis.ai_diagnostic_service import AIDiagnosticService

# Any port on the local machine: Vite moves to 5174+ when 5173 is busy, and
# `vite preview` serves on 4173. Every other origin is rejected.
LOCAL_ORIGINS = r"^http://(localhost|127\.0\.0\.1)(:\d{1,5})?$"

# Generous for a deep scan's telemetry; anything larger is rejected with 413.
MAX_BODY_BYTES = 2 * 1024 * 1024


def create_app(ai_service=None):
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_BODY_BYTES
    app.extensions["ai_service"] = ai_service or AIDiagnosticService()

    CORS(app, origins=[LOCAL_ORIGINS])
    register_error_handlers(app)

    for blueprint in (diagnostics_routes, system_routes, auth_routes):
        app.register_blueprint(blueprint)

    return app
