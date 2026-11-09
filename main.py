import json
from pathlib import Path

from collector.collector import (
    get_system_metrics,
    get_disk_activity,
    get_process_data,
    monitor_cpu,
    monitor_processes,
    summarize_processes,
)
from collector.temperature import get_system_temperature

from diagnosis.diagnosis import diagnose_system


ROOT = Path(__file__).parent
OUTPUT_PATHS = (
    ROOT / "data" / "diagnosis.json",
)


# Deep scan: every process (not only the top consumers) and a longer CPU observation.
DEEP_PROCESS_SAMPLE_S = 3
DEEP_MONITOR_DURATION_S = 12


def run_diagnosis(deep=False):

    metrics = get_system_metrics()

    disk_activity = get_disk_activity()

    temperature = get_system_temperature()

    process_data = (
        get_process_data(sample_seconds=DEEP_PROCESS_SAMPLE_S, include_inactive=True)
        if deep
        else get_process_data()
    )

    cpu_monitor = monitor_cpu()

    print("CPU monitoring:")
    print(cpu_monitor)

    process_monitor = monitor_processes(duration=DEEP_MONITOR_DURATION_S) if deep else monitor_processes()

    print("Process monitoring:")

    for process in process_monitor[:10]:
        print(
            "PID:", process["pid"],
            "| Process:", process["name"],
            "| Average CPU:", process["average_cpu"], "%",
            "| Maximum CPU:", process["maximum_cpu"], "%",
            "| Persistence:", process["persistence"], "%"
        )

    print("Top processes:")

    for process in process_data[:10]:
        print(
            "PID:", process["pid"],
            "| Process:", process["name"],
            "| CPU:", round(process["cpu"], 1), "%",
            "| RAM:", round(process["memory"], 1), "%"
        )

    print("Disk activity:")
    print(disk_activity)

    print("System metrics:")
    print(metrics)

    print("Temperature:")
    print(temperature)

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

    return diagnosis


def save_diagnosis(diagnosis):
    for path in OUTPUT_PATHS:
        with open(path, "w", encoding="utf-8") as file:
            json.dump(diagnosis, file, indent=2)


if __name__ == "__main__":
    result = run_diagnosis()
    save_diagnosis(result)

    print("\nStructured diagnosis:")
    print(json.dumps(result, indent=2))
