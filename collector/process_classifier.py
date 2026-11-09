"""Labels running processes without ever hiding them.

A process name alone proves nothing: malware often calls itself svchost.exe. So a
well-known Windows name only counts as "system" when the executable runs from the
folder Windows installs it in; the same name anywhere else is flagged for review.

Categories:
- system: Windows component, location confirmed.
- system_unverified: Windows name, but the OS denied access to its path.
- suspicious: Windows name running from an unexpected location.
- application: everything else.
"""

import ntpath
import os
import re

SYSTEM = "system"
SYSTEM_UNVERIFIED = "system_unverified"
SUSPICIOUS = "suspicious"
APPLICATION = "application"
CATEGORIES = (SYSTEM, SYSTEM_UNVERIFIED, SUSPICIOUS, APPLICATION)

# Kernel-created processes have no executable; their parent is System (4) or Idle (0).
KERNEL_PROCESSES = {"system", "registry", "memory compression", "secure system"}
KERNEL_PARENT_PIDS = {0, 4}

SYSTEM32_PROCESSES = {
    "audiodg.exe", "conhost.exe", "csrss.exe", "ctfmon.exe", "dashost.exe", "dllhost.exe",
    "dwm.exe", "fontdrvhost.exe", "lsaiso.exe", "lsass.exe", "runtimebroker.exe",
    "searchindexer.exe", "services.exe", "sihost.exe", "smss.exe", "spoolsv.exe",
    "svchost.exe", "taskhostw.exe", "wininit.exe", "winlogon.exe", "wudfhost.exe",
}
DEFENDER_PROCESSES = {"msmpeng.exe", "nissrv.exe"}

_USER_FOLDER = re.compile(r"^[a-z]:\\users\\[^\\]+", re.IGNORECASE)


def _folder(*parts):
    return ntpath.normcase(ntpath.join(*parts))


def _is_within(directory, parent):
    return directory == parent or directory.startswith(parent + "\\")


def mask_user_folder(path):
    """Removes the account name: paths end up in saved reports and in diagnosis.json."""
    return _USER_FOLDER.sub("%USERPROFILE%", path) if path else None


def _classify_windows(name, exe, parent_pid):
    lowered = name.lower()
    root = os.environ.get("SystemRoot", r"C:\Windows")

    if lowered in KERNEL_PROCESSES:
        return SYSTEM if parent_pid in KERNEL_PARENT_PIDS else SUSPICIOUS

    system_folders = (_folder(root, "System32"), _folder(root, "SysWOW64"))
    wbem_folders = tuple(ntpath.join(folder, "wbem") for folder in system_folders)
    well_known = lowered in SYSTEM32_PROCESSES or lowered in DEFENDER_PROCESSES or lowered in ("explorer.exe", "wmiprvse.exe")

    if not exe:
        return SYSTEM_UNVERIFIED if well_known else APPLICATION

    directory = ntpath.normcase(ntpath.dirname(exe))

    if lowered in SYSTEM32_PROCESSES:
        return SYSTEM if directory in system_folders else SUSPICIOUS
    if lowered == "wmiprvse.exe":
        return SYSTEM if directory in wbem_folders else SUSPICIOUS
    if lowered == "explorer.exe":
        return SYSTEM if directory == ntpath.normcase(root) else SUSPICIOUS
    if lowered in DEFENDER_PROCESSES:
        defender_folders = (
            _folder(os.environ.get("ProgramData", r"C:\ProgramData"), "Microsoft", "Windows Defender"),
            _folder(os.environ.get("ProgramFiles", r"C:\Program Files"), "Windows Defender"),
        )
        return SYSTEM if any(_is_within(directory, folder) for folder in defender_folders) else SUSPICIOUS

    trusted_folders = (*system_folders, _folder(root, "SystemApps"))
    return SYSTEM if any(_is_within(directory, folder) for folder in trusted_folders) else APPLICATION


def classify_process(name, exe, parent_pid):
    """Returns the category and the displayable path of a process."""
    category = _classify_windows(name or "", exe or "", parent_pid) if os.name == "nt" else APPLICATION
    return {"category": category, "path": mask_user_folder(exe)}
