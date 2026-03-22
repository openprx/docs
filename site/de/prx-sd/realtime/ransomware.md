---
title: Ransomware-Schutz
description: Verhaltensbasierte Ransomware-Erkennung mit Entropie-Analyse, Erweiterungs-Überwachung und Stapel-Verschlüsselungs-Erkennung.
---

# Ransomware-Schutz

PRX-SD enthält eine dedizierte `RansomwareDetector`-Engine, die Ransomware-Verhalten in Echtzeit identifiziert. Im Gegensatz zur signaturbasierten Erkennung, die bekannte Samples erfordert, verwendet der Ransomware-Detektor Verhaltens-Heuristiken, um Zero-Day-Ransomware zu erkennen, bevor sie Ihre Dateien vollständig verschlüsselt hat.

## Funktionsweise

Der Ransomware-Detektor läuft als Teil des Echtzeitmonitors und analysiert Dateisystem-Ereignisse auf Muster, die auf aktive Verschlüsselung hinweisen. Er arbeitet auf drei Erkennungsachsen:

### 1. Stapel-Verschlüsselungs-Erkennung

Der Detektor verfolgt Dateiänderungs-Raten pro Prozess und pro Verzeichnis. Wenn ein einzelner Prozess eine abnorm hohe Anzahl von Dateien in einem kurzen Zeitfenster ändert, wird ein Alarm ausgelöst.

| Parameter | Standard | Beschreibung |
|-----------|----------|--------------|
| `batch_threshold` | `20` | Anzahl der Dateiänderungen zur Auslösung der Erkennung |
| `batch_window_secs` | `10` | Zeitfenster in Sekunden für die Stapelzählung |
| `min_files_affected` | `5` | Minimale unterschiedliche Dateien vor Alarmierung |

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
```

### 2. Erweiterungs-Änderungs-Überwachung

Ransomware benennt Dateien nach der Verschlüsselung typischerweise mit einer neuen Erweiterung um. Der Detektor überwacht Massenerweiterungs-Änderungen, insbesondere auf bekannte Ransomware-Erweiterungen:

```
.encrypted, .enc, .locked, .crypto, .crypt, .crypted,
.ransomware, .ransom, .rans, .pay, .pay2key,
.locky, .zepto, .cerber, .cerber3, .dharma, .wallet,
.onion, .wncry, .wcry, .wannacry, .petya, .notpetya,
.ryuk, .conti, .lockbit, .revil, .sodinokibi,
.maze, .egregor, .darkside, .blackmatter, .hive,
.deadbolt, .akira, .alphv, .blackcat, .royal,
.rhysida, .medusa, .bianlian, .clop, .8base
```

::: warning
Erweiterungs-Überwachung allein ist nicht ausreichend -- ausgefeilte Ransomware kann zufällige oder legitim aussehende Erweiterungen verwenden. PRX-SD kombiniert Erweiterungs-Änderungen mit Entropie-Analyse für zuverlässige Erkennung.
:::

### 3. Hohe-Entropie-Erkennung

Verschlüsselte Dateien haben nahezu maximale Shannon-Entropie (nahe 8,0 für Byte-Ebenen-Analyse). Der Detektor vergleicht Datei-Entropie vor und nach der Änderung:

| Metrik | Schwellenwert | Bedeutung |
|--------|---------------|-----------|
| Datei-Entropie | > 7,8 | Dateiinhalt ist wahrscheinlich verschlüsselt oder komprimiert |
| Entropie-Delta | > 3,0 | Datei hat sich von niedriger zu hoher Entropie geändert (Verschlüsselung) |
| Header-Entropie | > 7,5 | Erste 4 KB haben hohe Entropie (ursprüngliche Magic-Bytes zerstört) |

Wenn die Entropie einer Datei nach der Änderung signifikant ansteigt und die Datei zuvor ein bekannter Dokumenttyp (PDF, DOCX, Bild) war, ist dies ein starker Indikator für Verschlüsselung.

## Erkennungs-Scoring

Jede Erkennungsachse trägt zu einem zusammengesetzten Ransomware-Score bei:

| Signal | Gewichtung | Beschreibung |
|--------|-----------|--------------|
| Stapel-Dateiänderung | 40 | Viele Dateien schnell von einem Prozess geändert |
| Erweiterungs-Änderung zu bekannter Ransomware-Erw. | 30 | Datei mit Ransomware-Erweiterung umbenannt |
| Erweiterungs-Änderung zu unbekannter Erw. | 15 | Datei mit ungewöhnlicher neuer Erweiterung umbenannt |
| Hohes Entropie-Delta | 25 | Datei-Entropie dramatisch gestiegen |
| Absolute hohe Entropie | 10 | Datei hat nahezu maximale Entropie |
| Lösegeldforderungs-Erstellung | 35 | Dateien, die Lösegeldforderungs-Mustern entsprechen, erkannt |
| Shadow-Copy-Löschung | 50 | Versuch, Volume-Shadow-Copies zu löschen |

Ein zusammengesetzter Score über **60** löst ein `MALICIOUS`-Urteil aus. Scores zwischen **30-59** erzeugen einen `SUSPICIOUS`-Alarm.

## Lösegeldforderungs-Erkennung

Der Detektor überwacht die Erstellung von Dateien, die häufigen Lösegeldforderungs-Mustern entsprechen:

```
README_RESTORE_FILES.txt, HOW_TO_DECRYPT.txt,
DECRYPT_INSTRUCTIONS.html, YOUR_FILES_ARE_ENCRYPTED.txt,
RECOVER_YOUR_FILES.txt, !README!.txt, _readme.txt,
HELP_DECRYPT.html, RANSOM_NOTE.txt, #DECRYPT#.txt
```

::: tip
Lösegeldforderungs-Erkennung ist musterbasiert und erfordert nicht, dass die Notiz-Datei selbst bösartig ist. Die bloße Erstellung einer Datei, die diesen Mustern entspricht, kombiniert mit anderen Signalen, trägt zum Ransomware-Score bei.
:::

## Automatische Reaktion

Wenn Ransomware erkannt wird, hängt die Reaktion von der konfigurierten Richtlinie ab:

| Aktion | Beschreibung |
|--------|--------------|
| **Alarm** | Ereignis protokollieren und Benachrichtigungen senden (Webhook, E-Mail) |
| **Blockieren** | Dateioperationen verweigern (nur Linux fanotify Block-Modus) |
| **Beenden** | Den beleidigenden Prozess beenden |
| **Quarantäne** | Betroffene Dateien in verschlüsselten Quarantänetresor verschieben |
| **Isolieren** | Gesamten Netzwerkzugriff für die Maschine blockieren (Notfall) |

Reaktion in `config.toml` konfigurieren:

```toml
[ransomware.response]
on_detection = "kill"           # alert | block | kill | quarantine | isolate
quarantine_affected = true      # geänderte Dateien als Beweise quarantänieren
notify_webhook = true           # Webhook-Benachrichtigung senden
notify_email = true             # E-Mail-Alarm senden
snapshot_process_tree = true    # Prozessbaum für Forensik aufzeichnen
```

## Konfiguration

Vollständige Ransomware-Detektor-Konfiguration:

```toml
[ransomware]
enabled = true
batch_threshold = 20
batch_window_secs = 10
min_files_affected = 5
entropy_threshold = 7.8
entropy_delta_threshold = 3.0
score_threshold_malicious = 60
score_threshold_suspicious = 30

# Verzeichnisse, die mit höherer Empfindlichkeit geschützt werden sollen
protected_dirs = [
    "~/Documents",
    "~/Pictures",
    "~/Desktop",
    "/var/www",
]

# Prozesse, die von der Überwachung ausgenommen sind (z.B. Backup-Software)
exempt_processes = [
    "borgbackup",
    "restic",
    "rsync",
]

[ransomware.response]
on_detection = "kill"
quarantine_affected = true
notify_webhook = true
notify_email = false
```

## Beispiele

```bash
# Überwachung mit Ransomware-Schutz starten
sd monitor --auto-quarantine /home

# Der Ransomware-Detektor ist im Daemon-Modus standardmäßig aktiviert
sd daemon start

# Ransomware-Detektor-Status prüfen
sd status --verbose
```

## Nächste Schritte

- [Dateiüberwachung](./monitor) -- Echtzeitüberwachung konfigurieren
- [Daemon](./daemon) -- Als Hintergrunddienst ausführen
- [Bedrohungsreaktion](/de/prx-sd/remediation/) -- Vollständige Bereinigungsrichtlinien-Konfiguration
- [Webhook-Alarme](/de/prx-sd/alerts/webhook) -- Sofortige Benachrichtigungen erhalten
