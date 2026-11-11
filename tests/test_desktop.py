import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api import create_app, paths  # noqa: E402


class StaticSiteTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        root = Path(self.folder.name)
        (root / "assets").mkdir()
        (root / "index.html").write_text("<!doctype html><title>Nexora</title>", encoding="utf-8")
        (root / "assets" / "app-123.js").write_text("console.log(1)", encoding="utf-8")
        self.client = create_app(ai_service=mock.Mock(is_configured=True), scan_runner=mock.Mock(), web_root=root).test_client()

    def tearDown(self):
        self.folder.cleanup()

    def test_index_and_spa_fallback(self):
        for path in ("/", "/reports", "/chat/abc"):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
            self.assertIn(b"<title>Nexora</title>", response.data)
            self.assertEqual(response.headers["Cache-Control"], "no-cache")
            response.close()

    def test_fingerprinted_assets_are_cached(self):
        response = self.client.get("/assets/app-123.js")
        self.assertIn("max-age=31536000", response.headers["Cache-Control"])
        response.close()

    def test_api_routes_still_win(self):
        self.assertEqual(self.client.get("/health").get_json()["status"], "ok")
        self.assertEqual(self.client.get("/scans/missing").status_code, 404)

    def test_paths_cannot_escape_the_build(self):
        response = self.client.get("/../server.py")
        self.assertNotIn(b"create_app", response.data)
        response.close()

    def test_missing_build_is_reported(self):
        with self.assertRaises(FileNotFoundError):
            create_app(ai_service=mock.Mock(), scan_runner=mock.Mock(), web_root=Path(self.folder.name) / "nope")


class PathsTests(unittest.TestCase):
    def test_source_layout(self):
        self.assertFalse(paths.is_frozen())
        self.assertEqual(paths.web_root(), paths.REPO_ROOT / "frontend" / "dist")
        self.assertEqual(paths.app_home(), paths.REPO_ROOT)

    def test_frozen_layout(self):
        with mock.patch.object(sys, "frozen", True, create=True), mock.patch.object(sys, "_MEIPASS", "C:/tmp/_MEI1", create=True):
            self.assertEqual(paths.web_root(), Path("C:/tmp/_MEI1") / "web")
            self.assertEqual(paths.app_home(), Path(sys.executable).resolve().parent)


class SettingsFileTests(unittest.TestCase):
    """macOS Finder hides ".env": a visible "nexora.env" must work too."""

    def setUp(self):
        import nexora_app

        self.folder = tempfile.TemporaryDirectory()
        self.home = Path(self.folder.name)
        self.patch = mock.patch.object(nexora_app, "app_home", return_value=self.home)
        self.patch.start()
        self.settings_file = nexora_app.settings_file

    def tearDown(self):
        self.patch.stop()
        self.folder.cleanup()

    def test_visible_name_is_used(self):
        (self.home / "nexora.env").write_text("GROQ_API_KEY=x", encoding="utf-8")
        self.assertEqual(self.settings_file(), self.home / "nexora.env")

    def test_dotenv_wins_when_both_exist(self):
        (self.home / "nexora.env").touch()
        (self.home / ".env").touch()
        self.assertEqual(self.settings_file(), self.home / ".env")

    def test_missing_file_suggests_the_visible_name(self):
        self.assertEqual(self.settings_file(), self.home / "nexora.env")


if __name__ == "__main__":
    unittest.main()
