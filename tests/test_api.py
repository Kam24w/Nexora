import sys
import threading
import time
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api import create_app  # noqa: E402
from diagnosis.ai_diagnostic_service import AINotConfiguredError, AIUnavailableError  # noqa: E402


def wait_for(client, job_id, status, timeout=3):
    deadline = time.time() + timeout
    while time.time() < deadline:
        job = client.get(f"/scans/{job_id}").get_json()
        if job["status"] == status:
            return job
        time.sleep(0.02)
    raise AssertionError(f"scan did not reach {status}")


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        self.ai = mock.Mock(is_configured=True)
        self.runner = mock.Mock(return_value={"status": "NORMAL"})
        self.client = create_app(ai_service=self.ai, scan_runner=self.runner).test_client()


class ApiErrorTests(ApiTestCase):
    def test_unknown_route_is_json(self):
        response = self.client.get("/nope")
        self.assertEqual((response.status_code, response.get_json()), (404, {"error": "not_found"}))

    def test_ai_errors_map_to_status(self):
        self.ai.generate.side_effect = AINotConfiguredError("x")
        self.assertEqual(self.client.post("/ai-diagnosis", json={}).status_code, 503)
        self.ai.generate.side_effect = AIUnavailableError("x")
        self.assertEqual(self.client.post("/ai-diagnosis", json={}).status_code, 502)

    def test_unexpected_error_hides_details(self):
        self.runner.side_effect = RuntimeError("secret detail")
        response = self.client.post("/diagnose")
        self.assertEqual((response.status_code, response.get_json()), (500, {"error": "internal_error"}))

    def test_lock_is_released_after_a_failed_scan(self):
        self.runner.side_effect = [RuntimeError, {"status": "NORMAL"}]
        self.client.post("/diagnose")
        self.assertEqual(self.client.post("/diagnose").status_code, 200)

    def test_oversized_body_is_rejected(self):
        response = self.client.post("/auth/validate", data=b"x" * (3 * 1024 * 1024), content_type="application/json")
        self.assertEqual(response.status_code, 413)


class ScanJobTests(ApiTestCase):
    def test_progress_and_result(self):
        release = threading.Event()

        def runner(deep, on_progress=None):
            on_progress("monitor", 0.5)
            release.wait(2)
            return {"status": "WARNING", "deep": deep}

        client = create_app(ai_service=self.ai, scan_runner=runner).test_client()
        started = client.post("/scans", json={"type": "advanced"})
        self.assertEqual(started.status_code, 202)
        job = started.get_json()
        self.assertEqual((job["type"], job["steps"][-1]), ("advanced", "rules"))

        time.sleep(0.1)
        running = client.get(f"/scans/{job['id']}").get_json()
        self.assertEqual((running["step"], running["step_index"], running["step_fraction"]), ("monitor", 2, 0.5))
        self.assertNotIn("result", running)

        self.assertEqual(client.post("/diagnose").status_code, 409)
        release.set()
        done = wait_for(client, job["id"], "completed")
        self.assertEqual(done["result"], {"status": "WARNING", "deep": True})

    def test_failed_scan_reports_a_stable_code(self):
        self.runner.side_effect = RuntimeError("secret")
        job = self.client.post("/scans", json={}).get_json()
        failed = wait_for(self.client, job["id"], "failed")
        self.assertEqual(failed["error"], "internal_error")
        self.assertEqual(self.client.post("/scans", json={}).status_code, 202)

    def test_invalid_type_and_unknown_job(self):
        self.assertEqual(self.client.post("/scans", json={"type": "full"}).status_code, 400)
        self.assertEqual(self.client.get("/scans/missing").get_json(), {"error": "scan_not_found"})


if __name__ == "__main__":
    unittest.main()
