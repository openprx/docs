---
title: Unterstützte Dateitypen
description: "PRX-SD unterstützte Dateitypen-Matrix. Magic-Number-Erkennung für PE, ELF, Mach-O, PDF, Office, Archive und Skripte mit rekursivem Archiv-Scannen."
---

# Unterstützte Dateitypen

PRX-SD identifiziert Dateitypen mit Magic-Number-Erkennung (Untersuchung der ersten Bytes einer Datei) anstatt auf Dateiendungen zu vertrauen. Dies gewährleistet eine genaue Identifikation, auch wenn Dateien umbenannt wurden oder keine Endungen haben.

## Dateityp-Matrix

Die folgende Tabelle zeigt alle unterstützten Dateitypen und welche Erkennungsschichten für jeden gelten:

| Dateityp | Erweiterungen | Magic-Bytes | Hash | YARA | Heuristik | Archiv-Rekursion |
|----------|---------------|-------------|------|------|-----------|-----------------|
| **PE (Windows)** | .exe, .dll, .sys, .scr, .ocx | `4D 5A` (MZ) | Ja | Ja | Ja | -- |
| **ELF (Linux)** | .so, .o, (keine) | `7F 45 4C 46` | Ja | Ja | Ja | -- |
| **Mach-O (macOS)** | .dylib, .bundle, (keine) | `FE ED FA CE/CF` oder `CE FA ED FE/CF` | Ja | Ja | Ja | -- |
| **Universal Binary** | (keine) | `CA FE BA BE` | Ja | Ja | Ja | -- |
| **PDF** | .pdf | `25 50 44 46` (%PDF) | Ja | Ja | Ja | -- |
| **Office (OLE)** | .doc, .xls, .ppt | `D0 CF 11 E0` | Ja | Ja | Ja | -- |
| **Office (OOXML)** | .docx, .xlsx, .pptx | `50 4B 03 04` (ZIP) + `[Content_Types].xml` | Ja | Ja | Ja | Extrahiert |
| **ZIP** | .zip | `50 4B 03 04` | Ja | Ja | Begrenzt | Rekursiv |
| **7-Zip** | .7z | `37 7A BC AF 27 1C` | Ja | Ja | Begrenzt | Rekursiv |
| **tar** | .tar | `75 73 74 61 72` bei Offset 257 | Ja | Ja | Begrenzt | Rekursiv |
| **gzip** | .gz, .tgz | `1F 8B` | Ja | Ja | Begrenzt | Rekursiv |
| **bzip2** | .bz2 | `42 5A 68` (BZh) | Ja | Ja | Begrenzt | Rekursiv |
| **xz** | .xz | `FD 37 7A 58 5A 00` | Ja | Ja | Begrenzt | Rekursiv |
| **RAR** | .rar | `52 61 72 21` (Rar!) | Ja | Ja | Begrenzt | Rekursiv |
| **CAB** | .cab | `4D 53 43 46` (MSCF) | Ja | Ja | Begrenzt | Rekursiv |
| **ISO** | .iso | `43 44 30 30 31` bei Offset 32769 | Ja | Ja | Begrenzt | Rekursiv |
| **Shell-Skript** | .sh, .bash | `23 21` (#!) | Ja | Ja | Muster | -- |
| **Python** | .py, .pyc | Text / `42 0D 0D 0A` | Ja | Ja | Muster | -- |
| **JavaScript** | .js, .mjs | Text-Erkennung | Ja | Ja | Muster | -- |
| **PowerShell** | .ps1, .psm1 | Text-Erkennung | Ja | Ja | Muster | -- |
| **VBScript** | .vbs, .vbe | Text-Erkennung | Ja | Ja | Muster | -- |
| **Batch** | .bat, .cmd | Text-Erkennung | Ja | Ja | Muster | -- |
| **Java** | .class, .jar | `CA FE BA BE` / ZIP | Ja | Ja | Begrenzt | .jar rekursiv |
| **WebAssembly** | .wasm | `00 61 73 6D` | Ja | Ja | Begrenzt | -- |
| **DEX (Android)** | .dex | `64 65 78 0A` (dex\n) | Ja | Ja | Begrenzt | -- |
| **APK (Android)** | .apk | ZIP + `AndroidManifest.xml` | Ja | Ja | Begrenzt | Rekursiv |

### Erkennungsschicht-Legende

| Schicht | Bedeutung |
|---------|-----------|
| **Hash** | SHA-256/MD5-Hash gegen Signaturdatenbank geprüft |
| **YARA** | Vollständiges YARA-Regelset auf Dateiinhalt angewendet |
| **Heuristik: Ja** | Vollständige dateityp-spezifische heuristische Analyse (siehe [Heuristik](./heuristics)) |
| **Heuristik: Begrenzt** | Nur grundlegende Entropie- und Strukturprüfungen |
| **Heuristik: Muster** | Textbasiertes Muster-Matching für verdächtige Befehle und Verschleierung |
| **Archiv-Rekursion** | Inhalte werden extrahiert und jede Datei wird einzeln gescannt |

## Magic-Number-Erkennung

PRX-SD liest die ersten 8192 Bytes jeder Datei, um ihren Typ zu bestimmen. Dieser Ansatz ist zuverlässiger als erweiterungsbasierte Erkennung:

```
Datei: invoice.pdf.exe
Erweiterung deutet auf: PDF hin
Magic-Bytes: 4D 5A → PE-Executable
PRX-SD identifiziert: PE (korrekt)
```

::: warning Erweiterungs-Abweichung
Wenn die Dateiendung nicht mit der erkannten Magic-Number übereinstimmt, fügt PRX-SD eine Notiz zum Scan-Bericht hinzu. Erweiterungs-Abweichungen sind eine häufige Social-Engineering-Technik (z.B. `photo.jpg.exe`).
:::

### Magic-Erkennungs-Priorität

Wenn mehrere Signaturen passen könnten (z.B. ZIP-Magic für sowohl .zip als auch .docx), verwendet PRX-SD eine tiefere Inspektion:

1. Magic-Bytes bei Offset 0 lesen
2. Bei Mehrdeutigkeit (z.B. ZIP) die interne Struktur prüfen
3. Für ZIP-basierte Formate nach `[Content_Types].xml` (OOXML), `META-INF/MANIFEST.MF` (JAR), `AndroidManifest.xml` (APK) suchen
4. Auf den generischen Container-Typ zurückfallen

## Rekursives Archiv-Scannen

Wenn PRX-SD ein Archiv (ZIP, 7z, tar, gzip, RAR usw.) antrifft, extrahiert es den Inhalt in ein temporäres Verzeichnis und scannt jede Datei einzeln durch die vollständige Erkennungspipeline.

### Rekursionstiefe

| Einstellung | Standard | Beschreibung |
|-------------|----------|--------------|
| `max_archive_depth` | 5 | Maximale Verschachtelungsebenen für Archive innerhalb von Archiven |
| `max_archive_files` | 10.000 | Maximale Dateien, die aus einem einzelnen Archiv extrahiert werden |
| `max_archive_size_mb` | 500 | Maximale Gesamtgröße der extrahierten Inhalte vor dem Stopp |

Diese Limits verhindern Ressourcenerschöpfung durch Zip-Bomben und tief verschachtelte Archive.

```toml
# ~/.config/prx-sd/config.toml
[scanning]
max_archive_depth = 5
max_archive_files = 10000
max_archive_size_mb = 500
```

::: warning Zip-Bomben
PRX-SD erkennt Zip-Bomben (Archive mit extremen Kompressionsverhältnissen) und stoppt die Extraktion, bevor übermäßiger Festplatten- oder Arbeitsspeicher verbraucht wird. Eine Zip-Bomben-Erkennung wird als `SUSPICIOUS` in den Scan-Ergebnissen gemeldet.
:::

### Passwortgeschützte Archive

PRX-SD kann keine passwortgeschützten Archive extrahieren. Diese werden als `übersprungen` in den Scan-Ergebnissen mit einem Hinweis auf die Verschlüsselung gemeldet. Die Archivdatei selbst wird weiterhin gegen Hash- und YARA-Datenbanken geprüft.

## Skript-Erkennung

Für textbasierte Skriptdateien (Shell, Python, JavaScript, PowerShell, VBScript, Batch) wendet PRX-SD musterbasierte Heuristiken an:

| Muster | Punkte | Beschreibung |
|--------|--------|--------------|
| Verschleierte Strings | 10-20 | Base64-kodierte Befehle, übermäßige String-Concatenation |
| Download + Execute | 15-25 | `curl/wget` zu `bash/sh` geleitet, `Invoke-WebRequest` + `Invoke-Expression` |
| Reverse Shell | 20-30 | Bekannte Reverse-Shell-Muster (`/dev/tcp`, `nc -e`, `bash -i`) |
| Credential-Zugriff | 10-15 | Lesen von `/etc/shadow`, Browser-Credential-Stores, Keychain |
| Persistenz-Mechanismen | 10-15 | Cron-Jobs, systemd-Dienste, Registry-Schlüssel hinzufügen |

## Nicht unterstützte Dateien

Dateien, die keiner bekannten Magic-Number entsprechen, werden weiterhin gegen Hash- und YARA-Datenbanken geprüft. Heuristische Analyse wird nicht auf unbekannte Dateitypen angewendet. Häufige Beispiele:

- Rohe Binärdaten
- Proprietäre Formate ohne öffentliche Magic-Numbers
- Verschlüsselte Dateien (sofern das Container-Format nicht erkannt wird)

Diese Dateien erscheinen als `type: unknown` in Scan-Berichten und erhalten nur Hash- + YARA-Scannen.

## Nächste Schritte

- [Heuristische Analyse](./heuristics) -- Detaillierte heuristische Prüfungen pro Dateityp
- [YARA-Regeln](./yara-rules) -- Regeln, die auf spezifische Dateiformat-Strukturen abzielen
- [Datei- und Verzeichnisscan](../scanning/file-scan) -- Dateien in der Praxis scannen
- [Erkennungsengine Übersicht](./index) -- Wie alle Schichten zusammenarbeiten
