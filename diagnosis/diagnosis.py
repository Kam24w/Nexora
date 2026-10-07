def diagnose_system(cpu_usage, ram_usage, disk_space, disk_read, disk_write, process_data, process_monitor):
    critical_issues = []
    warning_issues = []
    recommendations = []
    causes = []
    persistent_processes = [
        process
        for process in process_monitor
        if (
            process["average_cpu"] >= 30
            and process["persistence"] >= 60
        )
    ]
        
    # Check global CPU usage
    if cpu_usage >= 80:
        critical_issues.append("High CPU usage")
        recommendations.append(
        "Close unnecessary applications or processes."
    )

    elif cpu_usage >= 60:
        warning_issues.append("Elevated CPU usage")
        recommendations.append(
        "Consider closing applications that are using a lot of CPU."
    )

    # Check RAM usage
    if ram_usage >= 90:
        critical_issues.append("High RAM usage")
        recommendations.append(
        "Close applications that are using a lot of memory."
    )

    elif ram_usage >= 80:
        warning_issues.append("Elevated RAM usage")
        recommendations.append(
        "Consider closing some applications to reduce memory usage."
    )

    # Check disk space
    if disk_space >= 90:
        critical_issues.append("Low disk space")
        recommendations.append(
        "Free up disk space by removing unnecessary files."
    )

    elif disk_space >= 85:
        warning_issues.append("Disk space is getting low")
        recommendations.append(
        "Consider freeing up some disk space."
    )

    # Check disk activity
    if disk_read >= 100 or disk_write >= 100:
        critical_issues.append("High disk activity")

    # Check persistent high CPU processes
    if process_monitor:
        print("\nPersistent CPU candidates:")

        for process in process_monitor:
            print(
                process["name"],
                "| Average:", process["average_cpu"],
                "| Persistence:", process["persistence"]
            )

            if (
                process["average_cpu"] >= 30
                and process["persistence"] >= 60
            ):
                warning_issues.append(
                    f"Persistent high CPU usage in {process['name']}"
                )

                recommendations.append(
                    f"Consider closing {process['name']} if it is not needed."
                )
                causes.append(
                    f"{process['name']} may be contributing to high CPU usage."
                )

    # Determine final system status
    if critical_issues:
        status = "CRITICAL"
        issues = critical_issues

    elif warning_issues:
        status = "WARNING"
        issues = warning_issues

    else:
        status = "NORMAL"
        issues = []

    return {
        "cpu": round(cpu_usage, 1),
        "ram": round(ram_usage, 1),
        "disk_space": round(disk_space, 1),
        "disk_read": round(disk_read, 2),
        "disk_write": round(disk_write, 2),
        "status": status,
        "issues": issues,
        "recommendations": recommendations,
        "causes": causes,
        "processes": process_data
}