---
title: USB Device Scanning
description: Automatically detect and scan removable USB storage devices for malware when they are connected using sd scan-usb.
---

# USB Device Scanning

The `sd scan-usb` command detects connected removable USB storage devices and scans their contents for malware. This is critical for environments where USB drives are a common vector for malware delivery, such as air-gapped networks, shared workstations, and industrial control systems.

## How It Works

When invoked, `sd scan-usb` performs the following steps:

1. **Device discovery** -- Enumerates block devices via `/sys/block/` and identifies removable devices (USB mass storage).
2. **Mount detection** -- Checks if the device is already mounted. If not, it can optionally mount it in read-only mode to a temporary directory.
3. **Full scan** -- Runs the complete detection pipeline (hash matching, YARA rules, heuristic analysis) on all files on the device.
4. **Report** -- Produces a scan report with per-file verdicts.

::: tip Auto-Mount
By default, `sd scan-usb` scans devices that are already mounted. Use `--auto-mount` to automatically mount unmounted USB devices in read-only mode for scanning.
:::

## Basic Usage

Scan all connected USB storage devices:

```bash
sd scan-usb
```

Example output:

```
PRX-SD USB Scan
===============
Detected USB devices:
  /dev/sdb1 → /media/user/USB_DRIVE (vfat, 16 GB)

Scanning /media/user/USB_DRIVE...
Scanned: 847 files (2.1 GB)
Threats: 1

  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe
    Layer:   YARA rule
    Rule:    win_worm_usb_spreader
    Details: USB worm with autorun.inf exploitation

Duration: 4.2s
```

## Command Options

| Option | Short | Default | Description |
|--------|-------|---------|-------------|
| `--auto-quarantine` | `-q` | off | Automatically quarantine detected threats |
| `--auto-mount` | | off | Mount unmounted USB devices in read-only mode |
| `--device` | `-d` | all | Scan only a specific device (e.g., `/dev/sdb1`) |
| `--json` | `-j` | off | Output results in JSON format |
| `--eject-after` | | off | Safely eject the device after scanning |
| `--max-size-mb` | | 100 | Skip files larger than this size |

## Auto-Quarantine

Automatically isolate threats found on USB devices:

```bash
sd scan-usb --auto-quarantine
```

```
Scanning /media/user/USB_DRIVE...
  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe → Quarantined (QR-20260321-012)
  [MALICIOUS] /media/user/USB_DRIVE/.hidden/payload.bin → Quarantined (QR-20260321-013)

Threats quarantined: 2
Safe to use: Review remaining files before opening.
```

::: warning Important
When `--auto-quarantine` is used with USB scanning, the malicious files are moved to the local quarantine vault on the host machine, not deleted from the USB device. The original files on the USB remain unless you also use `--remediate`.
:::

## Scanning Specific Devices

If multiple USB devices are connected, scan a specific one:

```bash
sd scan-usb --device /dev/sdb1
```

List detected USB devices without scanning:

```bash
sd scan-usb --list
```

```
Detected USB storage devices:
  1. /dev/sdb1  Kingston DataTraveler  16 GB  vfat  Mounted: /media/user/USB_DRIVE
  2. /dev/sdc1  SanDisk Ultra          64 GB  exfat Not mounted
```

## JSON Output

```bash
sd scan-usb --json
```

```json
{
  "scan_type": "usb",
  "timestamp": "2026-03-21T17:00:00Z",
  "devices": [
    {
      "device": "/dev/sdb1",
      "label": "USB_DRIVE",
      "filesystem": "vfat",
      "size_gb": 16,
      "mount_point": "/media/user/USB_DRIVE",
      "files_scanned": 847,
      "threats": [
        {
          "path": "/media/user/USB_DRIVE/autorun.exe",
          "verdict": "malicious",
          "layer": "yara",
          "rule": "win_worm_usb_spreader"
        }
      ]
    }
  ]
}
```

## Common USB Threats

USB devices are frequently used to deliver the following types of malware:

| Threat Type | Description | Detection Layer |
|-------------|-------------|-----------------|
| Autorun worms | Exploit `autorun.inf` to execute on Windows | YARA rules |
| USB droppers | Disguised executables (e.g., `document.pdf.exe`) | Heuristic + YARA |
| BadUSB payloads | Scripts targeting HID emulation attacks | File analysis |
| Ransomware carriers | Encrypted payloads that activate on copy | Hash + YARA |
| Data exfiltration tools | Utilities designed to collect and extract data | Heuristic analysis |

## Integration with Real-Time Monitoring

You can combine USB scanning with the `sd monitor` daemon to automatically scan USB devices when they are connected:

```bash
sd monitor --watch-usb /home /tmp
```

This starts the real-time file monitor and adds USB auto-scan capability. When a new USB device is detected via udev, it is automatically scanned.

::: tip Kiosk Mode
For public terminals or shared workstations, combine `--watch-usb` with `--auto-quarantine` to automatically neutralize threats from USB devices without user intervention.
:::

## Next Steps

- [File & Directory Scanning](./file-scan) -- Full reference for `sd scan`
- [Memory Scanning](./memory-scan) -- Scan running process memory
- [Rootkit Detection](./rootkit) -- Check for system-level threats
- [Detection Engine](../detection/) -- How the multi-layer pipeline works
