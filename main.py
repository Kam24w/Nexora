import json
from pathlib import Path

from collector.collector import get_system_metrics, get_disk_activity, get_process_data, monitor_cpu, monitor_processes

from diagnosis.diagnosis import diagnose_system


def run_diagnosis():

    metrics = get_system_metrics()

    disk_activity = get_disk_activity()

    process_data = get_process_data()
    
    cpu_monitor = monitor_cpu()

    print("CPU monitoring:")
    print(cpu_monitor)
    
    process_monitor = monitor_processes()

    print("Process monitoring:")

    for process in process_monitor[:10]:
        print(
        "PID:", process["pid"],
        "| Process:", process["name"],
        "| Average CPU:", process["average_cpu"], "%",
        "| Maximum CPU:", process["maximum_cpu"], "%",
        "| Persistence:", process["persistence"], "%"
        )

    cpu_usage = metrics["cpu"]

    ram_usage = metrics["ram"]

    disk_space = metrics["disk_space"]

    disk_read = disk_activity["read"]

    disk_write = disk_activity["write"]

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

    diagnosis = diagnose_system(
        cpu_usage,
        ram_usage,
        disk_space,
        disk_read,
        disk_write,
        process_data,
        process_monitor
    )

    return diagnosis
    
diagnosis = run_diagnosis()

data_path = Path(__file__).parent / "data" / "diagnosis.json"

with open(data_path, "w", encoding="utf-8") as file:
    json.dump(diagnosis, file, indent=2)
frontend_path = Path(__file__).parent / "frontend" / "public" / "diagnosis.json"

with open(frontend_path, "w", encoding="utf-8") as file:
    json.dump(diagnosis, file, indent=2)

print("\nStructured diagnosis:")
print(json.dumps(diagnosis, indent=2))