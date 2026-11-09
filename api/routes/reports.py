from flask import Blueprint, current_app, jsonify

from api.requests import json_object_body

report_routes = Blueprint("reports", __name__, url_prefix="/reports")


def _assistant():
    return current_app.extensions["report_assistant"]


@report_routes.post("/translate")
def translate():
    """Translates the texts of a saved report: {"report": {...}, "language": "es" | "en"}."""
    payload = json_object_body()
    return jsonify(_assistant().translate(payload.get("report"), payload.get("language")))


@report_routes.post("/chat")
def chat():
    """Answers a question about a saved report: {"report", "messages": [{role, content}], "question", "language"}."""
    payload = json_object_body()
    return jsonify(_assistant().ask(payload.get("report"), payload.get("messages"), payload.get("question"), payload.get("language")))
