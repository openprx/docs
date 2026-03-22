---
title: Rootkit-Erkennung
description: "Kernel- und Userspace-Rootkits unter Linux mit sd check-rootkit erkennen. Prüft versteckte Prozesse, Kernel-Module, System-Call-Hooks und mehr."
---

# Rootkit-Erkennung

Der Befehl `sd check-rootkit` führt tiefgreifende System-Integritätsprüfungen durch, um sowohl Kernel-Ebene- als auch Userspace-Rootkits zu erkennen. Rootkits gehören zu den gefährlichsten Malware-Typen, weil sie ihre Anwesenheit vor Standard-System-Tools verbergen und dadurch für herkömmliche Datei-Scanner unsichtbar sind.

::: warning Anforderungen
- **Root-Rechte erforderlich** -- Rootkit-Erkennung liest Kernel-Datenstrukturen und System-Interna.
- **Nur Linux** -- Diese Funktion basiert auf `/proc`, `/sys` und Linux-spezifischen Kernel-Schnittstellen.
:::

## Was erkannt wird

PRX-SD prüft auf Rootkit-Präsenz über mehrere Vektoren:

### Kernel-Ebene-Prüfungen

| Prüfung | Beschreibung |
|---------|--------------|
| Versteckte Kernel-Module | Geladene Module aus `/proc/modules` gegen `sysfs`-Einträge vergleichen, um Diskrepanzen zu finden |
| System-Call-Tabellen-Hooks | Syscall-Tabellen-Einträge gegen bekannte Kernel-Symbole verifizieren |
| `/proc`-Inkonsistenzen | Prozesse erkennen, die vor `/proc` versteckt sind, aber durch andere Schnittstellen sichtbar sind |
| Kernel-Symbol-Manipulation | Auf geänderte Funktionszeiger in wichtigen Kernel-Strukturen prüfen |
| Interrupt-Deskriptor-Tabelle | IDT-Einträge auf unerwartete Änderungen prüfen |

### Userspace-Prüfungen

| Prüfung | Beschreibung |
|---------|--------------|
| Versteckte Prozesse | `readdir(/proc)`-Ergebnisse mit brute-force PID-Enumeration gegenüberstellen |
| LD_PRELOAD-Injektion | Auf bösartige Shared Libraries prüfen, die über `LD_PRELOAD` oder `/etc/ld.so.preload` geladen werden |
| Binärdatei-Ersatz | Integrität kritischer System-Binärdateien verifizieren (`ls`, `ps`, `netstat`, `ss`, `lsof`) |
| Versteckte Dateien | Dateien erkennen, die durch Abfangen des `getdents`-Syscalls versteckt werden |
| Verdächtige Cron-Einträge | Crontabs auf verschleierte oder kodierte Befehle scannen |
| Systemd-Dienst-Manipulation | Auf nicht autorisierte oder geänderte systemd-Units prüfen |
| SSH-Backdoors | Auf nicht autorisierte SSH-Schlüssel, geänderte `sshd_config` oder backdoored `sshd`-Binärdateien prüfen |
| Netzwerk-Listener | Versteckte Netzwerk-Sockets identifizieren, die von `ss`/`netstat` nicht angezeigt werden |

## Grundlegende Verwendung

Eine vollständige Rootkit-Prüfung ausführen:

```bash
sudo sd check-rootkit
```

Beispiel-Ausgabe:

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## Befehlsoptionen

| Option | Kurz | Standard | Beschreibung |
|--------|------|----------|--------------|
| `--json` | `-j` | aus | Ergebnisse im JSON-Format ausgeben |
| `--kernel-only` | | aus | Nur Kernel-Ebene-Prüfungen ausführen |
| `--userspace-only` | | aus | Nur Userspace-Prüfungen ausführen |
| `--baseline` | | keine | Pfad zu einer Baseline-Datei für Vergleich |
| `--save-baseline` | | keine | Aktuellen Zustand als Baseline speichern |

## Baseline-Vergleich

Für laufende Überwachung eine Baseline des bekannt-sauberen Systemzustands erstellen und zukünftige Prüfungen damit vergleichen:

```bash
# Baseline auf einem bekannt-sauberen System erstellen
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# Zukünftige Prüfungen vergleichen mit Baseline
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

Die Baseline erfasst Kernel-Modul-Listen, Syscall-Tabellen-Hashes, kritische Binärdatei-Prüfsummen und Netzwerk-Listener-Zustände. Jede Abweichung löst einen Alarm aus.

## JSON-Ausgabe

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## Beispiel: Erkennung eines Kernel-Modul-Rootkits

Wenn ein Rootkit ein Kernel-Modul versteckt, erkennt `sd check-rootkit` die Inkonsistenz:

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning Kritische Befunde
Ein `CRITICAL`-Befund des Rootkit-Checkers sollte als ernsthafter Sicherheitsvorfall behandelt werden. Versuchen Sie keine Bereinigung auf einem möglicherweise kompromittierten System. Isolieren Sie stattdessen die Maschine und untersuchen Sie von vertrauenswürdigen Medien aus.
:::

## Regelmäßige Prüfungen planen

Rootkit-Prüfungen in Ihre Monitoring-Routine aufnehmen:

```bash
# Cron: alle 4 Stunden prüfen
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## Nächste Schritte

- [Arbeitsspeicher-Scan](./memory-scan) -- In-Memory-Bedrohungen in laufenden Prozessen erkennen
- [Datei- und Verzeichnisscan](./file-scan) -- Traditionelles dateibasiertes Scannen
- [USB-Scan](./usb-scan) -- Wechselmedien beim Anschließen scannen
- [Erkennungsengine](../detection/) -- Übersicht aller Erkennungsschichten
