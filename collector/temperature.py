"""Best-effort system temperature reading for Windows, Linux and macOS.

Temperature sensors are not exposed uniformly across operating systems, so every
reader returns ``None`` instead of raising when no source is available.
"""

import json
import platform
import subprocess

import psutil

# Plausible range for a CPU/system sensor, in Celsius. Values outside it are
# placeholders reported by some firmwares (e.g. 0 °C or 27.8 °C fixed zones).
MIN_PLAUSIBLE_C = 5.0
MAX_PLAUSIBLE_C = 125.0

POWERSHELL_TIMEOUT_S = 6

# Sensor names that usually represent the CPU package on Linux.
LINUX_CPU_SENSORS = ("coretemp", "k10temp", "zenpower", "cpu_thermal", "cpu-thermal", "acpitz")


def _plausible(values):
    return [value for value in values if MIN_PLAUSIBLE_C <= value <= MAX_PLAUSIBLE_C]


def _run_powershell_json(script):
    """Runs a PowerShell snippet and parses its JSON output. Returns [] on any failure."""
    try:
        completed = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
            capture_output=True,
            text=True,
            timeout=POWERSHELL_TIMEOUT_S,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
    except (OSError, subprocess.SubprocessError):
        return []

    output = completed.stdout.strip()
    if completed.returncode != 0 or not output:
        return []

    try:
        data = json.loads(output)
    except json.JSONDecodeError:
        return []

    return data if isinstance(data, list) else [data]


def _windows_temperature():
    # 1. LibreHardwareMonitor / OpenHardwareMonitor expose the real CPU package
    #    sensor through WMI while they are running.
    for namespace in ("root/LibreHardwareMonitor", "root/OpenHardwareMonitor"):
        rows = _run_powershell_json(
            f"Get-CimInstance -Namespace {namespace} -ClassName Sensor -ErrorAction Stop "
            "| Where-Object { $_.SensorType -eq 'Temperature' -and $_.Name -match 'CPU|Package|Core' } "
            "| Select-Object Value | ConvertTo-Json -Compress"
        )
        values = _plausible(float(row["Value"]) for row in rows if isinstance(row.get("Value"), (int, float)))
        if values:
            return max(values), namespace.split("/")[-1]

    # 2. ACPI thermal zones through performance counters (no admin rights needed).
    #    HighPrecisionTemperature is expressed in tenths of a Kelvin.
    rows = _run_powershell_json(
        "Get-CimInstance -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation -ErrorAction Stop "
        "| Select-Object HighPrecisionTemperature | ConvertTo-Json -Compress"
    )
    values = _plausible(
        row["HighPrecisionTemperature"] / 10 - 273.15
        for row in rows
        if isinstance(row.get("HighPrecisionTemperature"), (int, float))
    )
    if values:
        return max(values), "acpi_thermal_zone"

    return None, None


def _linux_temperature():
    sensors_reader = getattr(psutil, "sensors_temperatures", None)
    if sensors_reader is None:
        return None, None

    try:
        sensors = sensors_reader()
    except (OSError, RuntimeError):
        return None, None

    for name in LINUX_CPU_SENSORS:
        values = _plausible(entry.current for entry in sensors.get(name, []))
        if values:
            return max(values), name

    values = _plausible(entry.current for entries in sensors.values() for entry in entries)
    return (max(values), "psutil") if values else (None, None)


def get_system_temperature():
    """Returns ``{"celsius": float | None, "source": str | None}``.

    macOS does not expose sensors without elevated tools (``powermetrics`` needs
    sudo), so it reports ``None`` and the UI shows the value as unavailable.
    """
    system = platform.system()

    if system == "Windows":
        celsius, source = _windows_temperature()
    elif system == "Linux":
        celsius, source = _linux_temperature()
    else:
        celsius, source = None, None

    return {
        "celsius": round(celsius, 1) if celsius is not None else None,
        "source": source,
    }
