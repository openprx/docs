---
title: Heuristische Analyse
description: "Die PRX-SD-Heuristik-Engine führt dateityp-bewusste Verhaltensanalysen an PE-, ELF-, Mach-O-, Office- und PDF-Dateien durch, um unbekannte Bedrohungen zu erkennen."
---

# Heuristische Analyse

Heuristische Analyse ist die dritte Schicht in der PRX-SD-Erkennungspipeline. Während Hash-Matching und YARA-Regeln auf bekannten Signaturen und Mustern beruhen, analysiert die Heuristik die **strukturellen und Verhaltens-Eigenschaften** einer Datei, um Bedrohungen zu erkennen, die noch nie zuvor gesehen wurden -- einschließlich Zero-Day-Malware, benutzerdefinierter Implantate und stark verschleierter Samples.

## Funktionsweise

PRX-SD identifiziert zunächst den Dateityp über Magic-Number-Erkennung und wendet dann eine Reihe gezielter heuristischer Prüfungen spezifisch für dieses Dateiformat an. Jede Prüfung, die ausgelöst wird, fügt Punkte zu einem kumulativen Score hinzu. Der endgültige Score bestimmt das Urteil.

### Scoring-Mechanismus

| Score-Bereich | Urteil | Bedeutung |
|---------------|--------|-----------|
| 0 - 29 | **Sauber** | Keine signifikanten verdächtigen Indikatoren |
| 30 - 59 | **Verdächtig** | Einige Anomalien erkannt; manuelle Überprüfung empfohlen |
| 60 - 100 | **Bösartig** | Hochwahrscheinliche Bedrohung; mehrere starke Indikatoren |

Scores sind additiv. Eine Datei mit einer kleinen Anomalie (z.B. leicht erhöhte Entropie) könnte 15 Punkte erzielen, während eine Datei mit hoher Entropie, verdächtigen API-Imports und Packer-Signaturen 75+ Punkte erzielen würde.

## PE (Windows-Executable) Analyse

PE-Heuristiken zielen auf Windows-Executables (.exe, .dll, .scr, .sys) ab:

| Prüfung | Punkte | Beschreibung |
|---------|--------|--------------|
| Hohe Abschnitts-Entropie | 10-25 | Abschnitte mit Entropie > 7,0 weisen auf Packing oder Verschlüsselung hin |
| Verdächtige API-Imports | 5-20 | APIs wie `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread` |
| Bekannte Packer-Signaturen | 15-25 | UPX-, Themida-, VMProtect-, ASPack-, PECompact-Header erkannt |
| Zeitstempel-Anomalie | 5-10 | Kompilierungs-Zeitstempel in der Zukunft oder vor 2000 |
| Abschnittsname-Anomalie | 5-10 | Nicht-standardmäßige Abschnittsnamen (`.rsrc` ersetzt, zufällige Strings) |
| Ressourcen-Anomalie | 5-15 | Eingebettete PE-Dateien in Ressourcen, verschlüsselte Ressourcenabschnitte |
| Import-Tabellen-Anomalie | 10-15 | Sehr wenige Imports (gepackt) oder verdächtige Import-Kombinationen |
| Digitale Signatur | -10 | Gültige Authenticode-Signatur reduziert den Score |
| TLS-Callbacks | 10 | Anti-Debug-TLS-Callback-Einträge |
| Overlay-Daten | 5-10 | Bedeutende Daten nach der PE-Struktur angehängt |

### Beispiel PE-Befunde

```
Heuristic Analysis: updater.exe
Score: 72/100 [MALICIOUS]

Findings:
  [+25] Section '.text' entropy: 7.91 (likely packed or encrypted)
  [+15] Packer detected: UPX 3.96
  [+12] Suspicious API imports: VirtualAllocEx, WriteProcessMemory,
        CreateRemoteThread, NtUnmapViewOfSection
  [+10] Section name anomaly: '.UPX0', '.UPX1' (non-standard)
  [+10] Compilation timestamp: 2089-01-01 (future date)
```

## ELF (Linux-Executable) Analyse

ELF-Heuristiken zielen auf Linux-Binärdateien und Shared Objects ab:

| Prüfung | Punkte | Beschreibung |
|---------|--------|--------------|
| Hohe Abschnitts-Entropie | 10-25 | Abschnitte mit Entropie > 7,0 |
| LD_PRELOAD-Referenzen | 15-20 | Strings, die auf `LD_PRELOAD` oder `/etc/ld.so.preload` verweisen |
| Cron-Persistenz | 10-15 | Referenzen auf `/etc/crontab`, `/var/spool/cron`, Cron-Verzeichnisse |
| Systemd-Persistenz | 10-15 | Referenzen auf systemd-Unit-Pfade, `systemctl enable` |
| SSH-Backdoor-Indikatoren | 15-20 | Geänderte `authorized_keys`-Pfade, `sshd`-Konfig-Strings |
| Anti-Debugging | 10-15 | `ptrace(PTRACE_TRACEME)`, `/proc/self/status`-Prüfungen |
| Netzwerkoperationen | 5-10 | Raw-Socket-Erstellung, verdächtige Port-Bindungen |
| Selbstlöschung | 10 | `unlink` des eigenen Binärpfads nach Ausführung |
| Gestripped + hohe Entropie | 10 | Gestrippte Binärdatei mit hoher Entropie deutet auf gepackte Malware hin |
| `/dev/null`-Umleitung | 5 | Ausgabe zu `/dev/null` umleiten (Daemon-Verhalten) |

### Beispiel ELF-Befunde

```
Heuristic Analysis: .cache/systemd-helper
Score: 65/100 [MALICIOUS]

Findings:
  [+20] LD_PRELOAD reference: /etc/ld.so.preload manipulation
  [+15] Cron persistence: writes to /var/spool/cron/root
  [+15] SSH backdoor: modifies /root/.ssh/authorized_keys
  [+10] Self-deletion: unlinks /tmp/.cache/systemd-helper
  [+5]  Network: creates raw socket
```

## Mach-O (macOS-Executable) Analyse

Mach-O-Heuristiken zielen auf macOS-Binärdateien, Bundles und universelle Binärdateien ab:

| Prüfung | Punkte | Beschreibung |
|---------|--------|--------------|
| Hohe Abschnitts-Entropie | 10-25 | Abschnitte mit Entropie > 7,0 |
| Dylib-Injektion | 15-20 | `DYLD_INSERT_LIBRARIES`-Referenzen, verdächtiges Dylib-Laden |
| LaunchAgent/Daemon-Persistenz | 10-15 | Referenzen auf `~/Library/LaunchAgents`, `/Library/LaunchDaemons` |
| Keychain-Zugriff | 10-15 | Keychain-API-Aufrufe, `security`-Befehlsnutzung |
| Gatekeeper-Umgehung | 10-15 | `xattr -d com.apple.quarantine`-Strings |
| Privacy TCC-Umgehung | 10-15 | Referenzen auf TCC-Datenbank, Accessibility-API-Missbrauch |
| Anti-Analyse | 10 | `sysctl`-Prüfungen für Debugger, VM-Erkennungs-Strings |
| Code-Signing-Anomalie | 5-10 | Ad-hoc-signierte oder unsignierte Binärdatei |

### Beispiel Mach-O-Befunde

```
Heuristic Analysis: com.apple.helper
Score: 55/100 [SUSPICIOUS]

Findings:
  [+20] Dylib injection: DYLD_INSERT_LIBRARIES manipulation
  [+15] LaunchAgent persistence: writes to ~/Library/LaunchAgents/
  [+10] Keychain access: SecKeychainFindGenericPassword calls
  [+10] Unsigned binary: no code signature present
```

## Office-Dokument-Analyse

Office-Heuristiken zielen auf Microsoft-Office-Formate (.doc, .docx, .xls, .xlsx, .ppt) ab:

| Prüfung | Punkte | Beschreibung |
|---------|--------|--------------|
| VBA-Makros vorhanden | 10-15 | Auto-Execute-Makros (`AutoOpen`, `Document_Open`, `Workbook_Open`) |
| Makro mit Shell-Ausführung | 20-30 | `Shell()`, `WScript.Shell`, `PowerShell`-Aufruf in Makros |
| DDE-Felder | 15-20 | Dynamic Data Exchange-Felder, die Befehle ausführen |
| Externer Template-Link | 10-15 | Remote-Template-Injektion über `attachedTemplate` |
| Verschleiertes VBA | 10-20 | Stark verschleierter Makro-Code (Chr(), String-Concatenation-Missbrauch) |
| Eingebettete OLE-Objekte | 5-10 | Eingebettete Executables oder Skripte als OLE-Objekte |
| Verdächtige Metadaten | 5 | Autorfelder mit Base64-Strings oder ungewöhnlichen Mustern |

### Beispiel Office-Befunde

```
Heuristic Analysis: Q3_Report.xlsm
Score: 60/100 [MALICIOUS]

Findings:
  [+15] VBA macro with AutoOpen trigger
  [+25] Macro executes: Shell("powershell -enc JABjAGwA...")
  [+10] Obfuscated VBA: 47 Chr() calls, string concatenation abuse
  [+10] External template: https://evil.example.com/template.dotm
```

## PDF-Analyse

PDF-Heuristiken zielen auf PDF-Dokumente ab:

| Prüfung | Punkte | Beschreibung |
|---------|--------|--------------|
| Eingebettetes JavaScript | 15-25 | JavaScript in `/JS`- oder `/JavaScript`-Aktionen |
| Launch-Aktion | 20-25 | `/Launch`-Aktion, die Systembefehle ausführt |
| URI-Aktion | 5-10 | Verdächtige URI-Aktionen, die auf bekannte schlechte Muster zeigen |
| Verschleierte Streams | 10-15 | Mehrere Kodierungsschichten (FlateDecode + ASCII85 + Hex) |
| Eingebettete Dateien | 5-10 | Executable-Dateien als Anhänge eingebettet |
| Formular-Übermittlung | 5-10 | Formulare, die Daten an externe URLs übermitteln |
| AcroForm mit JavaScript | 15 | Interaktive Formulare mit eingebettetem JavaScript |

### Beispiel PDF-Befunde

```
Heuristic Analysis: shipping_label.pdf
Score: 45/100 [SUSPICIOUS]

Findings:
  [+20] Embedded JavaScript: 3 /JS actions found
  [+15] Obfuscated stream: triple-encoded FlateDecode chain
  [+10] Embedded file: invoice.exe (PE executable)
```

## Häufige Befunde-Referenz

Die folgende Tabelle listet die am häufigsten ausgelösten heuristischen Befunde über alle Dateitypen auf:

| Befund | Schweregrad | Dateitypen | Fehlalarm-Rate |
|--------|-------------|------------|----------------|
| Hohe Entropie Abschnitt | Mittel | PE, ELF, Mach-O | Niedrig-Mittel (Spiel-Assets, komprimierte Daten) |
| Packer-Erkennung | Hoch | PE | Sehr niedrig |
| Auto-Execute-Makro | Hoch | Office | Niedrig (einige legitime Makros) |
| LD_PRELOAD-Manipulation | Hoch | ELF | Sehr niedrig |
| Eingebettetes JavaScript | Mittel-Hoch | PDF | Niedrig |
| Verdächtige API-Imports | Mittel | PE | Mittel (Sicherheits-Tools lösen dies aus) |
| Selbstlöschung | Hoch | ELF | Sehr niedrig |

::: tip Fehlalarme reduzieren
Wenn eine legitime Datei heuristische Alarme auslöst, können Sie sie per SHA-256-Hash zur Allowlist hinzufügen:
```bash
sd allowlist add /path/to/legitimate/file
```
Dateien auf der Allowlist überspringen die heuristische Analyse, werden aber weiterhin gegen Hash- und YARA-Datenbanken geprüft.
:::

## Nächste Schritte

- [Unterstützte Dateitypen](./file-types) -- Vollständige Dateityp-Matrix und Magic-Erkennungsdetails
- [YARA-Regeln](./yara-rules) -- Musterbasierte Erkennung, die Heuristik ergänzt
- [Hash-Matching](./hash-matching) -- Die schnellste Erkennungsschicht
- [Erkennungsengine Übersicht](./index) -- Wie alle Schichten zusammenarbeiten
