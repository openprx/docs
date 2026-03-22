---
title: Bedrohungsreaktion
description: Automatische Bedrohungsbereinigung mit Reaktionsrichtlinien, Persistenz-Bereinigung und Netzwerkisolierung konfigurieren.
---

# Bedrohungsreaktion

Die Bereinigungsengine von PRX-SD bietet automatisierte Bedrohungsreaktion über die einfache Erkennung hinaus. Wenn eine Bedrohung identifiziert wird, kann die Engine abgestufte Aktionen von der Protokollierung bis hin zur vollständigen Netzwerkisolierung durchführen, abhängig von der konfigurierten Richtlinie.

## Reaktionstypen

| Aktion | Beschreibung | Reversibel | Root erforderlich |
|--------|-------------|-----------|-------------------|
| **Melden** | Erkennung protokollieren und fortfahren. Keine Aktion an der Datei. | N/A | Nein |
| **Quarantäne** | Datei verschlüsseln und in den Quarantänetresor verschieben. | Ja | Nein |
| **Blockieren** | Dateizugriff/-ausführung über fanotify verweigern (nur Linux-Echtzeit). | Ja | Ja |
| **Beenden** | Den Prozess beenden, der die bösartige Datei erstellt hat oder verwendet. | Nein | Ja |
| **Bereinigen** | Bösartige Inhalte aus der Datei entfernen, während das Original erhalten bleibt (z.B. Makro-Entfernung aus Office-Docs). | Teilweise | Nein |
| **Löschen** | Die bösartige Datei dauerhaft von der Festplatte löschen. | Nein | Nein |
| **Isolieren** | Gesamten Netzwerkzugriff für die Maschine mit Firewall-Regeln blockieren. | Ja | Ja |
| **Blocklist** | Datei-Hash zur lokalen Blocklist für zukünftige Scans hinzufügen. | Ja | Nein |

## Richtlinien-Konfiguration

### Mit sd policy-Befehlen

```bash
# Aktuelle Richtlinie anzeigen
sd policy show

# Richtlinie für bösartige Erkennungen festlegen
sd policy set on_malicious quarantine

# Richtlinie für verdächtige Erkennungen festlegen
sd policy set on_suspicious report

# Auf Standardwerte zurücksetzen
sd policy reset
```

### Beispielausgabe

```bash
sd policy show
```

```
Threat Response Policy
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### Konfigurationsdatei

Richtlinien in `~/.prx-sd/config.toml` festlegen:

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # bösartige Hashes automatisch zur lokalen Blocklist hinzufügen
clean_persistence = true        # Persistenzmechanismen bei bösartiger Erkennung entfernen
network_isolate = false         # Netzwerkisolierung für kritische Bedrohungen aktivieren

[policy.notify]
webhook = true
email = false

[policy.escalation]
# Zu stärkerer Aktion eskalieren, wenn dieselbe Bedrohung wieder auftritt
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
Die Richtlinien `on_malicious` und `on_suspicious` akzeptieren unterschiedliche Aktionssets. Destruktive Aktionen wie `kill` und `delete` sind nur für `on_malicious` verfügbar.
:::

## Persistenz-Bereinigung

Wenn `clean_persistence` aktiviert ist, sucht PRX-SD nach Persistenzmechanismen, die Malware möglicherweise installiert hat, und entfernt sie. Dies läuft automatisch nach dem Quarantänieren oder Löschen einer Bedrohung.

### Linux-Persistenzpunkte

| Speicherort | Technik | Bereinigungsaktion |
|-------------|---------|-------------------|
| `/etc/cron.d/`, `/var/spool/cron/` | Cron-Jobs | Bösartige Cron-Einträge entfernen |
| `/etc/systemd/system/` | systemd-Dienste | Bösartige Units deaktivieren und entfernen |
| `~/.config/systemd/user/` | Benutzer-systemd-Dienste | Deaktivieren und entfernen |
| `~/.bashrc`, `~/.profile` | Shell-RC-Injektion | Injizierte Zeilen entfernen |
| `~/.ssh/authorized_keys` | SSH-Backdoor-Schlüssel | Nicht autorisierte Schlüssel entfernen |
| `/etc/ld.so.preload` | LD_PRELOAD-Hijacking | Bösartige Preload-Einträge entfernen |
| `/etc/init.d/` | SysV-Init-Skripte | Bösartige Skripte entfernen |

### macOS-Persistenzpunkte

| Speicherort | Technik | Bereinigungsaktion |
|-------------|---------|-------------------|
| `~/Library/LaunchAgents/` | LaunchAgent-Plists | Entladen und entfernen |
| `/Library/LaunchDaemons/` | LaunchDaemon-Plists | Entladen und entfernen |
| `~/Library/Application Support/` | Login-Items | Bösartige Items entfernen |
| `/Library/StartupItems/` | Startup-Items | Entfernen |
| `~/.zshrc`, `~/.bash_profile` | Shell-RC-Injektion | Injizierte Zeilen entfernen |
| Keychain | Keychain-Missbrauch | Alarm (keine automatische Bereinigung) |

### Windows-Persistenzpunkte

| Speicherort | Technik | Bereinigungsaktion |
|-------------|---------|-------------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | Registry-Run-Schlüssel | Bösartige Werte entfernen |
| `HKLM\SYSTEM\CurrentControlSet\Services` | Bösartige Dienste | Stoppen, deaktivieren und entfernen |
| `Startup`-Ordner | Startup-Verknüpfungen | Bösartige Verknüpfungen entfernen |
| Task-Scheduler | Geplante Aufgaben | Bösartige Aufgaben löschen |
| WMI-Abonnements | WMI-Ereignis-Consumer | Bösartige Abonnements entfernen |

::: warning
Persistenz-Bereinigung ändert System-Konfigurationsdateien und Registry-Einträge. Überprüfen Sie das Bereinigungsprotokoll unter `~/.prx-sd/remediation.log` nach jeder Operation, um zu verifizieren, dass nur bösartige Einträge entfernt wurden.
:::

## Netzwerkisolierung

Für kritische Bedrohungen (aktive Ransomware, Datenexfiltration) kann PRX-SD die Maschine vom Netzwerk isolieren:

### Linux (iptables)

```bash
# PRX-SD fügt diese Regeln automatisch hinzu, wenn es isoliert
 iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD konfiguriert pf-Regeln
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

Isolierung aufheben:

```bash
sd isolate lift
```

::: warning
Netzwerkisolierung blockiert den GESAMTEN Netzwerkverkehr einschließlich SSH. Stellen Sie sicher, dass Sie physischen oder Out-of-Band-Konsolenzugang haben, bevor Sie automatische Netzwerkisolierung aktivieren.
:::

## Bereinigungsprotokoll

Alle Bereinigungsaktionen werden in `~/.prx-sd/remediation.log` protokolliert:

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## Beispiele

```bash
# Aggressive Richtlinie für Server festlegen
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# Konservative Richtlinie für Workstations festlegen
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# Mit expliziter Bereinigung scannen
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# Netzwerkisolierung prüfen und aufheben
sd isolate status
sd isolate lift

# Bereinigungshistorie anzeigen
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## Nächste Schritte

- [Quarantäneverwaltung](/de/prx-sd/quarantine/) -- Quarantänierte Dateien verwalten
- [Ransomware-Schutz](/de/prx-sd/realtime/ransomware) -- Spezialisierte Ransomware-Reaktion
- [Webhook-Alarme](/de/prx-sd/alerts/webhook) -- Bei Bereinigungsaktionen benachrichtigen
- [E-Mail-Alarme](/de/prx-sd/alerts/email) -- E-Mail-Benachrichtigungen für Bedrohungen
