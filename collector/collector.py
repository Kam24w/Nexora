import psutil
import time


def get_system_metrics():
    cpu_usage = psutil.cpu_percent(interval=1)
    ram_usage = psutil.virtual_memory().percent
    disk_space = psutil.disk_usage("C:\\").percent

    return {
        "cpu": round(cpu_usage, 1),
        "ram": round(ram_usage, 1),
        "disk_space": round(disk_space, 1)
    }

def get_disk_activity():
    disk_before = psutil.disk_io_counters()

    time.sleep(1)

    disk_after = psutil.disk_io_counters()

    disk_read = (
        disk_after.read_bytes - disk_before.read_bytes
    ) / (1024 * 1024)

    disk_write = (
        disk_after.write_bytes - disk_before.write_bytes
    ) / (1024 * 1024)

    return {
        "read": round(disk_read, 2),
        "write": round(disk_write, 2)
    }
    
def get_process_data():
    current_pid = psutil.Process().pid

    processes = []

    for process in psutil.process_iter(["pid", "name"]):
        try:
            process.cpu_percent(None)
            processes.append(process)

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    time.sleep(1)

    process_data = []

    for process in processes:
        try:
            cpu = process.cpu_percent(None)
            memory = process.memory_percent()
            pid = process.info["pid"]
            name = process.info["name"]

            if (
                pid != current_pid
                and name not in ["System Idle Process", "System"]
                and cpu > 1
            ):
                process_data.append({
                    "pid": pid,
                    "name": name,
                    "cpu": cpu,
                    "memory": memory
                })

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    process_data.sort(
        key=lambda process: process["cpu"],
        reverse=True
    )

    return process_data

def monitor_processes(duration=5, interval=1):
    process_samples = {}
    process_list = []

    # Get the processes that will be monitored
    for process in psutil.process_iter(["pid", "name"]):
        try:
            pid = process.info["pid"]
            name = process.info["name"]

            if (
                pid != psutil.Process().pid
                and name not in ["System Idle Process", "System", "dwm.exe"]
                and name
            ):
                # Establish the initial CPU measurement
                process.cpu_percent(None)

                process_list.append(process)

        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass

    # Collect CPU samples over time
    for _ in range(duration):
        time.sleep(interval)

        for process in process_list:
            try:
                cpu = process.cpu_percent(None)
                pid = process.info["pid"]
                name = process.info["name"]

                if pid not in process_samples:
                    process_samples[pid] = {
                        "name": name,
                        "samples": []
                    }

                process_samples[pid]["samples"].append(cpu)

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

    # Process the collected samples
    monitored_processes = []

    for pid, data in process_samples.items():
        samples = [
            cpu for cpu in data["samples"]
            if cpu >= 0
        ]

        if samples:
            average_cpu = sum(samples) / len(samples)
            maximum_cpu = max(samples)

            high_cpu_samples = sum(
                1 for cpu in samples
                if cpu >= 30
            )

            persistence = (
                high_cpu_samples / len(samples)
            ) * 100

            monitored_processes.append({
                "pid": pid,
                "name": data["name"],
                "average_cpu": round(average_cpu, 1),
                "maximum_cpu": round(maximum_cpu, 1),
                "persistence": round(persistence, 1)
            })

    # Ignore processes with insignificant CPU usage
    monitored_processes = [
        process
        for process in monitored_processes
        if process["average_cpu"] > 1
    ]

    monitored_processes.sort(
        key=lambda process: process["average_cpu"],
        reverse=True
    )

    return monitored_processes

def monitor_cpu(duration=5, interval=1):
    cpu_samples = []

    for _ in range(duration):
        cpu_usage = psutil.cpu_percent(interval=interval)
        cpu_samples.append(cpu_usage)

    average_cpu = sum(cpu_samples) / len(cpu_samples)

    return {
        "samples": [round(cpu, 1) for cpu in cpu_samples],
        "average": round(average_cpu, 1),
        "maximum": round(max(cpu_samples), 1)
    }