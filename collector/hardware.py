"""Detects the components of the machine running Nexora.

Every lookup is best-effort: a component that cannot be read is reported as
null/empty instead of failing the whole response.
"""

import json
import logging
import os
import platform
import re
import shutil
import subprocess

import psutil

from collector.collector import get_system_root

logger = logging.getLogger(__name__)

COMMAND_TIMEOUT_S = 20
GIB = 1024 ** 3

# Software adapters Windows lists next to the real graphics card.
VIRTUAL_GPU_MARKERS = ("microsoft basic", "microsoft remote", "remote display", "virtual desktop")

_cached_profile = None


def _run(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=COMMAND_TIMEOUT_S, check=False)
    except (OSError, subprocess.SubprocessError) as error:
        logger.warning("Hardware command failed: %s", error)
        return ""
    return result.stdout.strip() if result.returncode == 0 else ""


def _cim_query(class_name, properties):
    """Reads a WMI class as a list of dicts. Both arguments are constants of this module."""
    script = (
        f"Get-CimInstance {class_name} | Select-Object {','.join(properties)} "
        "| ConvertTo-Json -Compress"
    )
    output = _run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", script])
    if not output:
        return []
    try:
        data = json.loads(output)
    except json.JSONDecodeError:
        return []
    return data if isinstance(data, list) else [data]


def _clean(value):
    return re.sub(r"\s+", " ", value).strip() if isinstance(value, str) and value.strip() else None


def _gigabytes(size):
    return round(size / GIB, 1) if isinstance(size, (int, float)) and size > 0 else None


def _windows_cpu_model():
    import winreg

    try:
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0") as key:
            return _clean(winreg.QueryValueEx(key, "ProcessorNameString")[0])
    except OSError:
        return None


def _linux_cpu_model():
    try:
        with open("/proc/cpuinfo", encoding="utf-8", errors="ignore") as file:
            for line in file:
                if line.lower().startswith("model name"):
                    return _clean(line.split(":", 1)[1])
    except OSError:
        pass
    return None


def _cpu_model():
    system = platform.system()
    model = None
    if system == "Windows":
        model = _windows_cpu_model()
    elif system == "Linux":
        model = _linux_cpu_model()
    elif system == "Darwin":
        model = _clean(_run(["sysctl", "-n", "machdep.cpu.brand_string"]))
    return model or _clean(platform.processor())


def _gpus():
    system = platform.system()
    names = []
    if system == "Windows":
        names = [item.get("Name") for item in _cim_query("Win32_VideoController", ["Name"])]
    elif system == "Linux" and shutil.which("lspci"):
        names = [
            line.split(": ", 1)[1]
            for line in _run(["lspci"]).splitlines()
            if re.search(r"VGA|3D controller|Display controller", line) and ": " in line
        ]
    elif system == "Darwin":
        names = re.findall(r"Chipset Model: (.+)", _run(["system_profiler", "SPDisplaysDataType"]))

    gpus = []
    for name in (_clean(value) for value in names):
        if name and name not in gpus and not any(marker in name.lower() for marker in VIRTUAL_GPU_MARKERS):
            gpus.append(name)
    return gpus


def _storage():
    if platform.system() == "Windows":
        drives = [
            {"model": _clean(item.get("Model")), "total_gb": _gigabytes(item.get("Size"))}
            for item in _cim_query("Win32_DiskDrive", ["Model", "Size"])
        ]
        drives = [drive for drive in drives if drive["model"] or drive["total_gb"]]
        if drives:
            return drives

    # No physical-drive information available: report the system volume.
    try:
        return [{"model": None, "total_gb": _gigabytes(psutil.disk_usage(get_system_root()).total)}]
    except OSError:
        return []


def get_hardware_profile():
    """Hardware does not change while the service runs; only complete results are cached."""
    global _cached_profile
    if _cached_profile is not None:
        return _cached_profile

    profile = {
        "cpu": {
            "model": _cpu_model(),
            "physical_cores": psutil.cpu_count(logical=False),
            "logical_cores": psutil.cpu_count(logical=True),
        },
        "ram_total_gb": _gigabytes(psutil.virtual_memory().total),
        "storage": _storage(),
        "gpus": _gpus(),
        "operating_system": f"{platform.system()} {platform.release()}",
        "machine_name": _clean(os.environ.get("COMPUTERNAME") or platform.node()),
    }

    if profile["cpu"]["model"] and profile["storage"] and profile["gpus"]:
        _cached_profile = profile
    return profile
