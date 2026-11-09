"""Background scans whose progress the client can poll.

A scan takes from ~15 s (basic) to ~1 min (advanced). Running it in a thread lets
the interface show which step is in progress instead of a request that hangs.
Only one scan runs at a time: two would skew each other's CPU samples.
"""

import logging
import threading
import time
import uuid
from collections import OrderedDict

from api.errors import ScanInProgressError

logger = logging.getLogger(__name__)

MAX_STORED_JOBS = 20


class ScanJobs:
    def __init__(self, runner, steps):
        """`runner(deep, on_progress)` performs the scan; `steps[deep]` lists its step names in order."""
        self._runner = runner
        self._steps = steps
        self._jobs = OrderedDict()
        self._jobs_lock = threading.Lock()
        self._busy = threading.Lock()

    def run_now(self, deep):
        """Synchronous scan (legacy endpoints), still exclusive with background jobs."""
        if not self._busy.acquire(blocking=False):
            raise ScanInProgressError
        try:
            return self._runner(deep=deep)
        finally:
            self._busy.release()

    def start(self, deep):
        if not self._busy.acquire(blocking=False):
            raise ScanInProgressError

        steps = self._steps[deep]
        job = {
            "id": uuid.uuid4().hex,
            "type": "advanced" if deep else "basic",
            "status": "running",
            "steps": list(steps),
            "step": steps[0],
            "step_index": 0,
            "step_fraction": 0.0,
            "started_at": time.time(),
            "result": None,
            "error": None,
        }
        with self._jobs_lock:
            self._jobs[job["id"]] = job
            while len(self._jobs) > MAX_STORED_JOBS:
                self._jobs.popitem(last=False)

        threading.Thread(target=self._run, args=(job, deep), daemon=True).start()
        return self.get(job["id"])

    def _run(self, job, deep):
        def on_progress(step, fraction=0.0):
            with self._jobs_lock:
                if step in job["steps"]:
                    job["step"] = step
                    job["step_index"] = job["steps"].index(step)
                    job["step_fraction"] = round(min(1.0, max(0.0, fraction)), 3)

        try:
            result = self._runner(deep=deep, on_progress=on_progress)
            with self._jobs_lock:
                job.update(status="completed", result=result, step_fraction=1.0)
        except Exception:  # noqa: BLE001 - reported to the client as a stable code
            logger.exception("Scan %s failed", job["id"])
            with self._jobs_lock:
                job.update(status="failed", error="internal_error")
        finally:
            self._busy.release()

    def get(self, job_id):
        with self._jobs_lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            snapshot = {key: value for key, value in job.items() if key != "result"}
            snapshot["elapsed_s"] = round(time.time() - job["started_at"], 1)
            if job["status"] == "completed":
                snapshot["result"] = job["result"]
            return snapshot
