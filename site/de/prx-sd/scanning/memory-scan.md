---
title: Prozessarbeitsspeicher-Scan
description: "Laufenden Prozessarbeitsspeicher auf In-Memory-Malware, dateilose Bedrohungen und eingeschleusten Code mit sd scan-memory scannen."
---

# Prozessarbeitsspeicher-Scan

Der Befehl `sd scan-memory` scannt den Arbeitsspeicher laufender Prozesse, um dateilose Malware, eingeschleuste Shellcodes und In-Memory-Bedrohungen zu erkennen, die die Festplatte nie berühren. Dies ist unerlässlich, um fortgeschrittene Bedrohungen abzufangen, die das traditionelle dateibasierte Scannen umgehen.

::: warning Anforderungen
- **Root-Rechte erforderlich** -- Arbeitsspeicher-Scannen liest `/proc/<pid>/mem`, was Root oder `CAP_SYS_PTRACE` erfordert.
- **Nur Linux** -- Prozessarbeitsspeicher-Scannen wird derzeit nur unter Linux unterstützt. macOS-Unterstützung ist geplant.
:::

## Funktionsweise

Prozessarbeitsspeicher-Scannen liest die virtuellen Speicher-Mappings eines laufenden Prozesses und wendet dieselbe Erkennungspipeline an, die für Datei-Scannen verwendet wird:

1. **Speicherregionen aufzählen** -- `/proc/<pid>/maps` parsen, um lesbare Speichersegmente zu finden (Heap, Stack, anonyme Mappings, gemappte Dateien).
2. **Speicherinhalt lesen** -- Jede Region von `/proc/<pid>/mem` lesen.
3. **YARA-Regel-Scan** -- In-Memory YARA-Regeln anwenden, die für die Erkennung von Shellcode-Mustern, eingeschleusten DLLs und bekannten Malware-Signaturen im Speicher optimiert sind.
4. **Musteranalyse** -- Auf verdächtige Muster wie RWX-Speicherregionen, PE-Header in nicht datei-gesicherten Mappings und bekannte Exploit-Payloads prüfen.

## Grundlegende Verwendung

Alle laufenden Prozesse scannen:

```bash
sudo sd scan-memory
```

Einen bestimmten Prozess nach PID scannen:

```bash
sudo sd scan-memory --pid 1234
```

Mehrere bestimmte Prozesse scannen:

```bash
sudo sd scan-memory --pid 1234 --pid 5678 --pid 9012
```

## Befehlsoptionen

| Option | Kurz | Standard | Beschreibung |
|--------|------|----------|--------------|
| `--pid` | `-p` | alle | Nur die angegebene Prozess-ID scannen (wiederholbar) |
| `--json` | `-j` | aus | Ergebnisse im JSON-Format ausgeben |
| `--exclude-pid` | | keine | Bestimmte PIDs vom Scannen ausschließen |
| `--exclude-user` | | keine | Prozesse eines bestimmten Benutzers ausschließen |
| `--min-region-size` | | 4096 | Minimale Speicherregionsgröße zum Scannen (Bytes) |
| `--skip-mapped-files` | | aus | Datei-gesicherte Speicherregionen überspringen |

## Ausgabe-Beispiel

```bash
sudo sd scan-memory
```

```
PRX-SD Memory Scan Report
=========================
Processes scanned: 142
Memory regions scanned: 8,451
Total memory scanned: 4.2 GB

  [MALICIOUS] PID 3847 (svchost)
    Region:  0x7f4a00000000-0x7f4a00040000 (anon, RWX)
    Match:   YARA rule: memory_cobalt_strike_beacon
    Details: CobaltStrike Beacon shellcode detected in anonymous RWX mapping

  [SUSPICIOUS] PID 12045 (python3)
    Region:  0x7f8b10000000-0x7f8b10010000 (anon, RWX)
    Match:   Pattern analysis
    Details: Executable code in anonymous RWX region, possible shellcode injection

Duration: 12.4s
```

### JSON-Ausgabe

```bash
sudo sd scan-memory --pid 3847 --json
```

```json
{
  "scan_type": "memory",
  "timestamp": "2026-03-21T15:00:00Z",
  "processes_scanned": 1,
  "regions_scanned": 64,
  "threats": [
    {
      "pid": 3847,
      "process_name": "svchost",
      "region_start": "0x7f4a00000000",
      "region_end": "0x7f4a00040000",
      "region_perms": "rwx",
      "region_type": "anonymous",
      "verdict": "malicious",
      "rule": "memory_cobalt_strike_beacon",
      "description": "CobaltStrike Beacon shellcode detected"
    }
  ]
}
```

## Anwendungsfälle

### Incident Response

Während einer aktiven Untersuchung alle Prozesse scannen, um kompromittierte Dienste zu finden:

```bash
sudo sd scan-memory --json > /evidence/memory-scan-$(date +%s).json
```

### Erkennung dateiloser Malware

Moderne Malware wird oft vollständig im Arbeitsspeicher ausgeführt, ohne auf die Festplatte zu schreiben. Häufige Techniken umfassen:

- **Prozess-Injektion** -- Malware injiziert Code in legitime Prozesse mit `ptrace` oder `/proc/pid/mem`-Schreibvorgängen
- **Reflective DLL-Laden** -- Eine DLL wird aus dem Arbeitsspeicher geladen, ohne das Dateisystem zu berühren
- **Shellcode-Ausführung** -- Roher Shellcode wird in RWX-Speicher allokiert und direkt ausgeführt

`sd scan-memory` erkennt diese Muster durch Suche nach:

| Indikator | Beschreibung |
|-----------|--------------|
| RWX anonyme Mappings | Ausführbarer Code in nicht datei-gesichertem Speicher |
| PE-Header im Speicher | Windows-PE-Strukturen im Linux-Prozessarbeitsspeicher (plattformübergreifende Payloads) |
| Bekannte Shellcode-Signaturen | Metasploit, CobaltStrike, Sliver-Beacon-Muster |
| Verdächtige Syscall-Stubs | Gehakte oder gepatchte Syscall-Einstiegspunkte |

### Server-Gesundheitsprüfung

Periodische Arbeitsspeicher-Scans auf Produktionsservern ausführen:

```bash
# Zu Cron hinzufügen: alle 6 Stunden scannen
0 */6 * * * root /usr/local/bin/sd scan-memory --json --exclude-user nobody >> /var/log/prx-sd/memory-scan.log 2>&1
```

::: tip Performance-Auswirkungen
Arbeitsspeicher-Scannen liest Prozessarbeitsspeicher und kann kurzzeitig I/O erhöhen. Auf Produktionsservern sollten Scans in Zeiten geringen Datenverkehrs oder unter Ausschluss nicht-kritischer Prozesse durchgeführt werden.
:::

## Einschränkungen

- Arbeitsspeicher-Scannen liest einen Schnappschuss des Prozessarbeitsspeichers zum Zeitpunkt des Scans. Sich schnell ändernde Speicherregionen können unvollständige Ergebnisse liefern.
- Kernel-Arbeitsspeicher wird von `scan-memory` nicht gescannt. Verwenden Sie `sd check-rootkit` für Kernel-Ebene-Bedrohungserkennung.
- Stark verschleierte oder verschlüsselte In-Memory-Payloads können YARA-Regeln umgehen. Die Musteranalyse-Schicht bietet einen sekundären Erkennungsmechanismus.

## Nächste Schritte

- [Rootkit-Erkennung](./rootkit) -- Kernel- und Userspace-Rootkits erkennen
- [Datei- und Verzeichnisscan](./file-scan) -- Traditionelles dateibasiertes Scannen
- [YARA-Regeln](../detection/yara-rules) -- Die für Arbeitsspeicher-Scannen verwendete Regel-Engine verstehen
- [Erkennungsengine](../detection/) -- Funktionsweise aller Erkennungsschichten
