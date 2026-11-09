import json
from pathlib import Path

from collector.collector import (
    get_system_metrics,
    get_disk_activity,
    get_process_data,
    monitor_processes,
    summarize_processes,
)
from collector.hardware import get_hardware_profile
from collector.temperature import get_system_temperature

from diagnosis.diagnosis import diagnose_system


ROOT = Path(__file__).parent
OUTPUT_PATHS = (
    ROOT / "data" / "diagnosis.json",
)

# Basic scan: the busiest processes and a short CPU observation (~15 s).
BASIC_MONITOR_DURATION_S = 3
# Advanced scan: every process, a longer CPU observation and the hardware profile (~1 min).
DEEP_PROCESS_SAMPLE_S = 3
DEEP_MONITOR_DURATION_S = 12

SCAN_STEPS = {
    False: ("metrics", "processes", "monitor", "rules"),
    True: ("metrics", "processes", "monitor", "hardware", "rules"),
}


def run_diagnosis(deep=False, on_progress=None):
    """Runs a scan. `on_progress(step, fraction)` is called when a step starts and while it advances."""
    report = on_progress or (lambda step, fraction=0.0: None)

    report("metrics")
    metrics = get_system_metrics()
    disk_activity = get_disk_activity()
    temperature = get_system_temperature()

    report("processes")
    process_data = (
        get_process_data(sample_seconds=DEEP_PROCESS_SAMPLE_S, include_inactive=True)
        if deep
        else get_process_data()
    )

    report("monitor")
    process_monitor = monitor_processes(
        duration=DEEP_MONITOR_DURATION_S if deep else BASIC_MONITOR_DURATION_S,
        on_tick=lambda done, total: report("monitor", done / total),
    )

    hardware = None
    if deep:
        report("hardware")
        hardware = get_hardware_profile()

    report("rules")
    diagnosis = diagnose_system(
        metrics["cpu"],
        metrics["ram"],
        metrics["disk_space"],
        disk_activity["read"],
        disk_activity["write"],
        process_data,
        process_monitor,
        temperature["celsius"],
    )

    diagnosis["cpu_temperature"] = temperature["celsius"]
    diagnosis["temperature_source"] = temperature["source"]
    diagnosis["scan_type"] = "deep" if deep else "standard"
    diagnosis["process_summary"] = summarize_processes(process_data)
    if hardware is not None:
        diagnosis["hardware"] = hardware

    return diagnosis


def save_diagnosis(diagnosis):
    for path in OUTPUT_PATHS:
        with open(path, "w", encoding="utf-8") as file:
            json.dump(diagnosis, file, indent=2)


if __name__ == "__main__":
    result = run_diagnosis(on_progress=lambda step, fraction=0.0: print(f"[{step}] {fraction:.0%}"))
    save_diagnosis(result)

    print("\nStructured diagnosis:")
    print(json.dumps(result, indent=2))
