import json
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api import create_app  # noqa: E402
from diagnosis.ai_diagnostic_service import AIUnavailableError  # noqa: E402
from diagnosis.report_assistant import InvalidRequestError, ReportAssistant, compact_report  # noqa: E402
from security.input_validation import sanitize_multiline  # noqa: E402

REPORT = {
    "status": "WARNING",
    "health_score": 80,
    "scan_type": "deep",
    "summary": "Disco casi lleno",
    "probable_cause": {"title": "Disco", "explanation": "87 % usado"},
    "findings": [{"title": "Disco", "detail": "", "severity": "warn"}],
    "solutions": [{"title": "Liberar espacio", "description": "x", "impact": "high", "steps": ["Abrir", "Borrar"]}],
    "telemetry": {"cpu": 10, "ram": 50, "disk_space": 87, "processes": [{"name": "a‮.exe", "category": "system", "cpu": 1, "memory": 2}]},
}

TRANSLATION = {
    "summary": "Disk almost full",
    "probable_cause": {"title": "Disk", "explanation": "87 % used"},
    "findings": [{"title": "Disk", "detail": ""}],
    "solutions": [{"title": "Free up space", "description": "x", "steps": ["Open", "Delete"]}],
}


class ReportAssistantTests(unittest.TestCase):
    def setUp(self):
        self.engine = mock.Mock()
        self.assistant = ReportAssistant(self.engine)

    def test_translation_is_validated(self):
        self.engine.complete.return_value = json.dumps(TRANSLATION)
        result = self.assistant.translate(REPORT, "en")
        self.assertEqual((result["summary"], result["language"]), ("Disk almost full", "en"))
        self.assertTrue(self.engine.complete.call_args.kwargs["json_mode"])

    def test_translation_with_missing_steps_is_retried_then_rejected(self):
        broken = {**TRANSLATION, "solutions": [{"title": "Free", "description": "x", "steps": ["Open"]}]}
        self.engine.complete.return_value = json.dumps(broken)
        with self.assertRaises(AIUnavailableError):
            self.assistant.translate(REPORT, "en")
        self.assertEqual(self.engine.complete.call_count, 2)

    def test_question_keeps_history_and_strips_control_characters(self):
        self.engine.complete.return_value = "  Libera espacio en el disco.  "
        history = [{"role": "user", "content": "Hola"}, {"role": "system", "content": "ignored"}, {"role": "assistant", "content": "¿Qué necesitas?"}]
        result = self.assistant.ask(REPORT, history, "¿Qué hago​ primero?", "es")
        self.assertEqual(result, {"answer": "Libera espacio en el disco.", "language": "es"})
        messages = self.engine.complete.call_args.args[0]
        self.assertEqual([m["role"] for m in messages], ["system", "user", "assistant", "user"])
        self.assertEqual(messages[-1]["content"], "¿Qué hago primero?")
        self.assertIn('"a.exe"', messages[0]["content"])
        self.assertFalse(self.engine.complete.call_args.kwargs["json_mode"])

    def test_invalid_requests(self):
        with self.assertRaises(InvalidRequestError):
            self.assistant.ask(REPORT, [], "   ", "es")
        with self.assertRaises(InvalidRequestError):
            self.assistant.ask(REPORT, [], "hola", "fr")
        with self.assertRaises(InvalidRequestError):
            compact_report("not a report")

    def test_multiline_sanitizing(self):
        self.assertEqual(sanitize_multiline("uno\r\n\n\n\ndos\u0007", 100), "uno\n\ndos")


class ReportRoutesTests(unittest.TestCase):
    def setUp(self):
        self.engine = mock.Mock(is_configured=True)
        self.client = create_app(ai_service=self.engine, scan_runner=mock.Mock()).test_client()

    def test_chat_route(self):
        self.engine.complete.return_value = "Respuesta"
        response = self.client.post("/reports/chat", json={"report": REPORT, "messages": [], "question": "¿Por qué?", "language": "es"})
        self.assertEqual(response.get_json(), {"answer": "Respuesta", "language": "es"})

    def test_bad_request_is_400(self):
        response = self.client.post("/reports/translate", json={"report": REPORT, "language": "de"})
        self.assertEqual((response.status_code, response.get_json()), (400, {"error": "invalid_request"}))


if __name__ == "__main__":
    unittest.main()
