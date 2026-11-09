import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api import create_app  # noqa: E402
from api.routes import diagnostics  # noqa: E402
from diagnosis.ai_diagnostic_service import AINotConfiguredError, AIUnavailableError  # noqa: E402


class ApiErrorTests(unittest.TestCase):
    def setUp(self):
        self.ai = mock.Mock(is_configured=True)
        self.client = create_app(ai_service=self.ai).test_client()

    def test_unknown_route_is_json(self):
        response = self.client.get("/nope")
        self.assertEqual((response.status_code, response.get_json()), (404, {"error": "not_found"}))

    def test_ai_errors_map_to_status(self):
        self.ai.generate.side_effect = AINotConfiguredError("x")
        self.assertEqual(self.client.post("/ai-diagnosis", json={}).status_code, 503)
        self.ai.generate.side_effect = AIUnavailableError("x")
        self.assertEqual(self.client.post("/ai-diagnosis", json={}).status_code, 502)

    def test_unexpected_error_hides_details(self):
        with mock.patch.object(diagnostics, "run_diagnosis", side_effect=RuntimeError("secret detail")):
            response = self.client.post("/diagnose")
        self.assertEqual((response.status_code, response.get_json()), (500, {"error": "internal_error"}))

    def test_lock_is_released_after_a_failed_scan(self):
        with mock.patch.object(diagnostics, "run_diagnosis", side_effect=RuntimeError):
            self.client.post("/diagnose")
        with mock.patch.object(diagnostics, "run_diagnosis", return_value={"status": "NORMAL"}):
            self.assertEqual(self.client.post("/diagnose").status_code, 200)

    def test_concurrent_scan_is_rejected(self):
        self.assertTrue(diagnostics._scan_lock.acquire(blocking=False))
        try:
            response = self.client.post("/deep-scan")
        finally:
            diagnostics._scan_lock.release()
        self.assertEqual((response.status_code, response.get_json()), (409, {"error": "scan_in_progress"}))

    def test_oversized_body_is_rejected(self):
        response = self.client.post("/auth/validate", data=b"x" * (3 * 1024 * 1024), content_type="application/json")
        self.assertEqual(response.status_code, 413)


if __name__ == "__main__":
    unittest.main()
