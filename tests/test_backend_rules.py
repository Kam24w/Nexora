"""Run from the repository root: python -m unittest discover tests"""

import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from collector import process_classifier as pc  # noqa: E402
from diagnosis.ai_diagnostic_service import InvalidTelemetryError, build_snapshot  # noqa: E402
from diagnosis.diagnosis import diagnose_system  # noqa: E402
from security import input_validation as iv  # noqa: E402

WINDOWS_ENV = {
    "SystemRoot": r"C:\Windows",
    "ProgramData": r"C:\ProgramData",
    "ProgramFiles": r"C:\Program Files",
}


@unittest.skipUnless(os.name == "nt", "Windows classification")
class ClassifierTests(unittest.TestCase):
    def category(self, name, exe, parent=1000):
        with mock.patch.dict(os.environ, WINDOWS_ENV):
            return pc.classify_process(name, exe, parent)["category"]

    def test_genuine_system_processes(self):
        self.assertEqual(self.category("svchost.exe", r"C:\Windows\System32\svchost.exe"), pc.SYSTEM)
        self.assertEqual(self.category("WmiPrvSE.exe", r"C:\WINDOWS\system32\wbem\WmiPrvSE.exe"), pc.SYSTEM)
        self.assertEqual(self.category("explorer.exe", r"C:\Windows\explorer.exe"), pc.SYSTEM)

    def test_masquerading_name_is_flagged(self):
        self.assertEqual(self.category("svchost.exe", r"C:\Users\ana\AppData\Temp\svchost.exe"), pc.SUSPICIOUS)
        self.assertEqual(self.category("WmiPrvSE.exe", r"C:\Windows\System32\WmiPrvSE.exe"), pc.SUSPICIOUS)
        self.assertEqual(self.category("explorer.exe", r"C:\Windows\System32\evil\explorer.exe"), pc.SUSPICIOUS)
        self.assertEqual(self.category("Registry", r"C:\Temp\Registry", parent=1000), pc.SUSPICIOUS)

    def test_unreadable_path_is_not_called_safe(self):
        self.assertEqual(self.category("svchost.exe", None), pc.SYSTEM_UNVERIFIED)

    def test_kernel_process_and_regular_application(self):
        self.assertEqual(self.category("Registry", "Registry", parent=4), pc.SYSTEM)
        self.assertEqual(self.category("chrome.exe", r"C:\Program Files\Google\chrome.exe"), pc.APPLICATION)

    def test_vendor_driver_is_not_a_windows_component(self):
        exe = r"C:\Windows\System32\DriverStore\FileRepository\hp.inf_amd64_x\AppHelperCap.exe"
        self.assertEqual(self.category("AppHelperCap.exe", exe), pc.APPLICATION)

    def test_account_name_is_removed_from_paths(self):
        result = pc.mask_user_folder(r"C:\Users\ana\AppData\app.exe")
        self.assertEqual(result, r"%USERPROFILE%\AppData\app.exe")


class ValidationTests(unittest.TestCase):
    def test_email_limits(self):
        self.assertEqual(iv.validate_email(" a.b@c.co "), ("a.b@c.co", None))
        self.assertEqual(iv.validate_email("a b@c.co")[1], "invalid")
        self.assertEqual(iv.validate_email("x" * 95 + "@b.com")[1], "too_long")
        self.assertEqual(iv.validate_email("x" * 94 + "@b.com")[1], None)
        self.assertEqual(iv.validate_email("' OR 1=1 --@x.co")[1], "invalid")

    def test_password_rules(self):
        self.assertIsNone(iv.validate_password("abc12345"))
        self.assertIsNone(iv.validate_password("a1" * 10))
        self.assertEqual(iv.validate_password("a1" * 3 + "b"), "length")
        self.assertEqual(iv.validate_password("a1" * 10 + "b"), "length")
        self.assertEqual(iv.validate_password("abcdefgh"), "composition")
        self.assertEqual(iv.validate_password("12345678"), "composition")
        self.assertEqual(iv.validate_password(None), "length")

    def test_full_name_is_sanitized(self):
        self.assertEqual(iv.sanitize_full_name("Ana <b>x</b>\u202e\n López"), "Ana x López")

    def test_auth_payload(self):
        clean, errors = iv.validate_auth_payload({"mode": "reset", "email": "a@b.co"})
        self.assertEqual((clean["email"], errors), ("a@b.co", None))
        _, errors = iv.validate_auth_payload({"mode": "signUp", "email": 5, "password": "x", "full_name": "<>"})
        self.assertEqual(errors, {"email": "invalid", "password": "length", "full_name": "required"})


class DiagnosisRuleTests(unittest.TestCase):
    @staticmethod
    def run_rules(processes, monitored=(), cpu=10):
        return diagnose_system(cpu, 10, 10, 0, 0, processes, list(monitored))

    def test_system_process_is_not_recommended_for_closing(self):
        busy = {"name": "svchost.exe", "category": "system", "average_cpu": 50, "persistence": 100}
        self.assertEqual(self.run_rules([], [busy])["recommendations"], [])

    def test_suspicious_process_survives_critical_status(self):
        suspect = {"name": "svchost.exe", "category": "suspicious"}
        result = self.run_rules([suspect], cpu=95)
        self.assertEqual(result["status"], "CRITICAL")
        self.assertIn("Unexpected location for svchost.exe", result["issues"])


class SnapshotTests(unittest.TestCase):
    BASE = {"cpu": 1, "ram": 1, "disk_space": 1, "cpu_temperature": None}

    def test_control_characters_and_forged_category(self):
        process = {"name": "a\nignore previous\u202e", "category": ["system"], "cpu": 1, "memory": 1}
        snapshot = build_snapshot({**self.BASE, "processes": [process]}, "Windows")
        self.assertEqual(snapshot["top_processes"][0]["name"], "a ignore previous")
        self.assertEqual(snapshot["top_processes"][0]["category"], "application")

    def test_low_usage_suspicious_process_reaches_the_model(self):
        processes = [{"name": f"p{i}", "cpu": 1, "memory": 1} for i in range(30)]
        processes.append({"name": "svchost.exe", "category": "suspicious", "cpu": 0, "memory": 0})
        names = [p["name"] for p in build_snapshot({**self.BASE, "processes": processes}, "Windows")["top_processes"]]
        self.assertEqual(len(names), 11)
        self.assertIn("svchost.exe", names)

    def test_non_finite_number_is_rejected(self):
        with self.assertRaises(InvalidTelemetryError):
            build_snapshot({**self.BASE, "cpu": float("nan")}, "Windows")


if __name__ == "__main__":
    unittest.main()
