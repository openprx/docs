---
title: Fehlerbehebung
description: "Lösungen für häufige PRX-SD-Probleme, einschließlich Signatur-Updates, Scan-Leistung, Berechtigungen, Falsch-Positive, Daemon-Probleme und Speichernutzung."
---

# Fehlerbehebung

Diese Seite behandelt die häufigsten Probleme beim Ausführen von PRX-SD sowie deren Ursachen und Lösungen.

## Signatur-Datenbank-Update schlägt fehl

**Symptome:** `sd update` schlägt mit einem Netzwerkfehler, Timeout oder SHA-256-Nichtübereinstimmung fehl.

**Mögliche Ursachen:**
- Keine Internetverbindung oder Firewall blockiert ausgehende HTTPS-Verbindungen
- Der Update-Server ist vorübergehend nicht verfügbar
- Ein Proxy oder eine Unternehmens-Firewall modifiziert die Antwort

**Lösungen:**

1. **Konnektivität zum Update-Server prüfen:**

```bash
curl -fsSL https://api.github.com/repos/openprx/prx-sd-signatures/commits?per_page=1
```

2. **Offline-Update-Skript verwenden**, wenn Netzwerkeinschränkungen bestehen:

```bash
# Auf einem Computer mit Internetzugang
./tools/update-signatures.sh

# Signaturen-Verzeichnis auf den Zielcomputer kopieren
scp -r ~/.prx-sd/signatures user@target:~/.prx-sd/
```

3. **Neu herunterladen erzwingen**, um beschädigten Cache zu löschen:

```bash
sd update --force
```

4. **Benutzerdefinierten Update-Server verwenden**, wenn Sie einen privaten Spiegel betreiben:

```bash
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"
sd update
```

5. **SHA-256-Nichtübereinstimmung prüfen** -- dies bedeutet normalerweise, dass der Download während der Übertragung beschädigt wurde. Erneut versuchen oder manuell herunterladen:

```bash
sd update --force
```

::: tip
`sd update --check-only` ausführen, um zu prüfen, ob ein Update verfügbar ist, ohne es herunterzuladen.
:::

## Scan-Geschwindigkeit ist langsam

**Symptome:** Das Scannen eines Verzeichnisses dauert viel länger als erwartet.

**Mögliche Ursachen:**
- Scannen netzwerkgemounteter Dateisysteme (NFS, CIFS, SSHFS)
- YARA-Regeln werden bei jedem Scan kompiliert (kein Kompilierungs-Cache)
- Zu viele Threads konkurrieren um I/O auf Festplatten mit rotierenden Scheiben
- Archiv-Rekursion bei großen verschachtelten Archiven

**Lösungen:**

1. **Thread-Anzahl für SSD-gespeicherte Daten erhöhen:**

```bash
sd config set scan.threads 16
```

2. **Thread-Anzahl für rotierende Festplatten reduzieren** (I/O-gebunden):

```bash
sd config set scan.threads 2
```

3. **Langsame oder irrelevante Pfade ausschließen:**

```bash
sd config set scan.exclude_paths '["/mnt/nfs", "/proc", "/sys", "/dev", "*.iso"]'
```

4. **Archiv-Scanning deaktivieren**, wenn nicht benötigt:

```bash
sd config set scan.scan_archives false
```

5. **Archiv-Tiefe reduzieren**, um tief verschachtelte Archive zu vermeiden:

```bash
sd config set scan.max_archive_depth 1
```

6. **`--exclude`-Flag für einmalige Scans verwenden:**

```bash
sd scan /home --exclude "*.iso" --exclude "node_modules"
```

7. **Debug-Protokollierung aktivieren**, um Engpässe zu finden:

```bash
sd --log-level debug scan /path/to/dir 2>&1 | grep -i "slow\|timeout\|skip"
```

## fanotify-Berechtigungsfehler

**Symptome:** `sd monitor --block` schlägt mit "Permission denied" oder "Operation not permitted" fehl.

**Mögliche Ursachen:**
- Nicht als Root ausgeführt
- Linux-Kernel hat `CONFIG_FANOTIFY_ACCESS_PERMISSIONS` nicht aktiviert
- AppArmor oder SELinux blockiert fanotify-Zugriff

**Lösungen:**

1. **Als Root ausführen:**

```bash
sudo sd monitor /home /tmp --block
```

2. **Kernel-Konfiguration prüfen:**

```bash
zgrep FANOTIFY /proc/config.gz
# Sollte anzeigen: CONFIG_FANOTIFY=y und CONFIG_FANOTIFY_ACCESS_PERMISSIONS=y
```

3. **Nicht-Block-Modus als Fallback verwenden** (erkennt Bedrohungen noch, verhindert aber keinen Dateizugriff):

```bash
sd monitor /home /tmp
```

::: warning
Block-Modus ist nur unter Linux mit fanotify-Unterstützung verfügbar. Unter macOS (FSEvents) und Windows (ReadDirectoryChangesW) arbeitet die Echtzeitüberwachung nur im Erkennungsmodus.
:::

4. **SELinux/AppArmor prüfen:**

```bash
# SELinux: nach Ablehnungen suchen
ausearch -m AVC -ts recent | grep prx-sd

# AppArmor: nach Ablehnungen suchen
dmesg | grep apparmor | grep prx-sd
```

## Falsch-Positiv (legitime Datei als Bedrohung erkannt)

**Symptome:** Eine bekannt-sichere Datei wird als Verdächtig oder Bösartig markiert.

**Lösungen:**

1. **Prüfen, was die Erkennung ausgelöst hat:**

```bash
sd scan /path/to/file --json
```

Die Felder `detection_type` und `threat_name` betrachten:
- `HashMatch` -- der Hash der Datei stimmt mit einem bekannten Malware-Hash überein (unwahrscheinliches Falsch-Positiv)
- `YaraRule` -- eine YARA-Regel hat Muster in der Datei gefunden
- `Heuristic` -- die heuristische Engine hat die Datei über dem Schwellenwert bewertet

2. **Für heuristische Falsch-Positive**, den Schwellenwert erhöhen:

```bash
# Standard ist 60; auf 70 erhöhen für weniger Falsch-Positive
sd config set scan.heuristic_threshold 70
```

3. **Datei oder Verzeichnis vom Scanning ausschließen:**

```bash
sd config set scan.exclude_paths '["/path/to/safe-file", "/opt/known-good/"]'
```

4. **Für YARA-Falsch-Positive** können bestimmte Regeln durch Entfernen oder Auskommentieren im Verzeichnis `~/.prx-sd/yara/` ausgeschlossen werden.

5. **Via Hash auf Whitelist setzen** -- den SHA-256 der Datei zu einer lokalen Allowlist hinzufügen (zukünftige Funktion). Als Workaround die Datei nach Pfad ausschließen.

::: tip
Wenn Sie glauben, dass eine Erkennung ein echtes Falsch-Positiv ist, melden Sie es bitte unter [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues) mit dem Datei-Hash (nicht der Datei selbst) und dem Regelnamen.
:::

## Daemon kann nicht starten

**Symptome:** `sd daemon` beendet sich sofort, oder `sd status` zeigt "stopped".

**Mögliche Ursachen:**
- Eine andere Instanz läuft bereits (PID-Datei existiert)
- Das Datenverzeichnis ist nicht zugänglich oder beschädigt
- Die Signaturdatenbank fehlt

**Lösungen:**

1. **Nach veralteter PID-Datei suchen:**

```bash
cat ~/.prx-sd/prx-sd.pid
# Wenn die aufgelistete PID nicht läuft, Datei entfernen
rm ~/.prx-sd/prx-sd.pid
```

2. **Daemon-Status prüfen:**

```bash
sd status
```

3. **Im Vordergrund ausführen** mit Debug-Protokollierung, um Startfehler zu sehen:

```bash
sd --log-level debug daemon /home /tmp
```

4. **Sicherstellen, dass Signaturen existieren:**

```bash
sd info
# Wenn hash_count 0 ist, ausführen:
sd update
```

5. **Verzeichnis-Berechtigungen prüfen:**

```bash
ls -la ~/.prx-sd/
# Alle Verzeichnisse sollten Ihrem Benutzer gehören und beschreibbar sein
```

6. **Neu initialisieren**, wenn das Datenverzeichnis beschädigt ist:

```bash
# Vorhandene Daten sichern
mv ~/.prx-sd ~/.prx-sd.bak

# Beliebigen Befehl ausführen, um First-Run-Setup auszulösen
sd info

# Signaturen neu herunterladen
sd update
```

## Protokollstufe anpassen

**Problem:** Sie benötigen mehr Diagnoseinformationen, um ein Problem zu debuggen.

PRX-SD unterstützt fünf Protokollstufen, von ausführlichster bis wenigster ausführlich:

| Stufe | Beschreibung |
|-------|-------------|
| `trace` | Alles, einschließlich Details zum YARA-Matching pro Datei |
| `debug` | Detaillierte Engine-Operationen, Plugin-Laden, Hash-Lookups |
| `info` | Scan-Fortschritt, Signatur-Updates, Plugin-Registrierung |
| `warn` | Warnungen und nicht-fatale Fehler (Standard) |
| `error` | Nur kritische Fehler |

```bash
# Maximale Ausführlichkeit
sd --log-level trace scan /tmp

# Debug-Stufe für Fehlerbehebung
sd --log-level debug monitor /home

# Protokolle zur Analyse in Datei umleiten
sd --log-level debug scan /home 2> /tmp/prx-sd-debug.log
```

::: tip
Das Flag `--log-level` ist global und muss **vor** dem Unterbefehl stehen:
```bash
# Korrekt
sd --log-level debug scan /tmp

# Falsch (Flag nach Unterbefehl)
sd scan /tmp --log-level debug
```
:::

## Hoher Speicherverbrauch

**Symptome:** Der `sd`-Prozess verbraucht mehr Speicher als erwartet, besonders bei großen Verzeichnis-Scans.

**Mögliche Ursachen:**
- Scannen einer sehr großen Anzahl von Dateien mit vielen Threads
- YARA-Regeln werden in den Speicher kompiliert (38.800+ Regeln verbrauchen erheblichen Speicher)
- Archiv-Scanning bläht große komprimierte Dateien in den Speicher auf
- WASM-Plugins mit hohen `max_memory_mb`-Limits

**Lösungen:**

1. **Thread-Anzahl reduzieren** (jeder Thread lädt seinen eigenen YARA-Kontext):

```bash
sd config set scan.threads 2
```

2. **Maximale Dateigröße begrenzen**, um sehr große Dateien zu überspringen:

```bash
# Auf 50 MiB begrenzen
sd config set scan.max_file_size 52428800
```

3. **Archiv-Scanning deaktivieren** für speicherbeschränkte Systeme:

```bash
sd config set scan.scan_archives false
```

4. **Archiv-Tiefe reduzieren:**

```bash
sd config set scan.max_archive_depth 1
```

5. **WASM-Plugin-Speicherlimits prüfen** -- `~/.prx-sd/plugins/*/plugin.json` auf Plugins mit hohen `max_memory_mb`-Werten prüfen und diese reduzieren.

6. **Speicher während Scans überwachen:**

```bash
# In einem anderen Terminal
watch -n 1 'ps aux | grep sd | grep -v grep'
```

7. **Für den Daemon**, Speicher über Zeit überwachen:

```bash
sd status
# Zeigt PID; top/htop verwenden, um Speicher zu beobachten
```

## Andere häufige Probleme

### Warnung "No YARA rules found"

Das YARA-Regeln-Verzeichnis ist leer. First-Time-Setup erneut ausführen oder Regeln herunterladen:

```bash
sd update
# Oder manuell Setup auslösen durch Entfernen des yara-Verzeichnisses:
rm -rf ~/.prx-sd/yara
sd info  # löst First-Run-Setup mit eingebetteten Regeln aus
```

### Fehler "Failed to open signature database"

Die LMDB-Signaturdatenbank könnte beschädigt sein:

```bash
rm -rf ~/.prx-sd/signatures
sd update
```

### Adblock: "insufficient privileges"

Die Adblock-Aktivierungs-/Deaktivierungsbefehle modifizieren die System-Hosts-Datei und erfordern Root:

```bash
sudo sd adblock enable
sudo sd adblock disable
```

### Scan überspringt Dateien mit "timeout"-Fehler

Individuelle Datei-Timeouts sind standardmäßig auf 30 Sekunden gesetzt. Für komplexe Dateien erhöhen:

```bash
sd config set scan.timeout_per_file_ms 60000
```

## Hilfe erhalten

Wenn keine der oben genannten Lösungen Ihr Problem löst:

1. **Vorhandene Issues prüfen:** [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)
2. **Neues Issue einreichen** mit:
   - PRX-SD-Version (`sd info`)
   - Betriebssystem und Kernel-Version
   - Debug-Protokollausgabe (`sd --log-level debug ...`)
   - Schritte zur Reproduktion

## Nächste Schritte

- Die [Konfigurationsreferenz](../configuration/reference) prüfen, um das Engine-Verhalten anzupassen
- Die [Erkennungsengine](../detection/) erlernen, um zu verstehen, wie Bedrohungen identifiziert werden
- [Alarme](../alerts/) einrichten, um proaktiv über Probleme informiert zu werden
