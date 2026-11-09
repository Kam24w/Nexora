import logging
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent

# Loads GROQ_API_KEY from <repo>/.env (next to this file, whatever the working
# directory is) before the AI client is created.
load_dotenv(ROOT / ".env")

from api import create_app  # noqa: E402

logging.basicConfig(level=logging.INFO)

app = create_app()

if not os.environ.get("GROQ_API_KEY"):
    misplaced = ROOT / "frontend" / ".env.local"
    hint = (
        " It was found in frontend/.env.local, which only Vite reads: move it to .env."
        if misplaced.exists() and "GROQ_API_KEY" in misplaced.read_text(encoding="utf-8", errors="ignore")
        else ""
    )
    logging.warning("GROQ_API_KEY is not set in %s; /ai-diagnosis will use the rule engine.%s", ROOT / ".env", hint)


if __name__ == "__main__":
    # IPv4 loopback explicitly: the frontend calls http://127.0.0.1:5000.
    # The interactive debugger stays off unless FLASK_DEBUG=1 is set.
    app.run(host="127.0.0.1", port=5000, debug=os.environ.get("FLASK_DEBUG") == "1", threaded=True)
