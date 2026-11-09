"""Single place that turns exceptions into JSON responses."""

import logging

from flask import jsonify
from werkzeug.exceptions import HTTPException

from diagnosis.ai_diagnostic_service import (
    AIDiagnosisError,
    AINotConfiguredError,
    AIRefusedError,
    InvalidTelemetryError,
)
from diagnosis.report_assistant import InvalidRequestError

logger = logging.getLogger(__name__)

AI_ERROR_STATUS = {
    InvalidTelemetryError: 400,
    InvalidRequestError: 400,
    AIRefusedError: 422,
    AINotConfiguredError: 503,
}


class ScanInProgressError(Exception):
    """Another scan is already sampling this machine."""


def register_error_handlers(app):
    @app.errorhandler(AIDiagnosisError)
    def handle_ai_error(error):
        status = next((code for kind, code in AI_ERROR_STATUS.items() if isinstance(error, kind)), 502)
        return jsonify({"error": error.code}), status

    @app.errorhandler(ScanInProgressError)
    def handle_scan_in_progress(_error):
        return jsonify({"error": "scan_in_progress"}), 409

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        return jsonify({"error": error.name.lower().replace(" ", "_")}), error.code

    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        # The details stay in the server log; the client only gets a stable code.
        logger.exception("Unhandled error", exc_info=error)
        return jsonify({"error": "internal_error"}), 500
