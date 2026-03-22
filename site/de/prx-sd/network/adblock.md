---
title: Werbung und bösartige Domain-Blockierung
description: "Werbung, Tracker und bösartige Domains auf DNS-Ebene mit dem Befehl sd adblock blockieren. Unterstützt mehrere Filterlisten, benutzerdefinierte Regeln und persistentes Protokollieren."
---

# Werbung und bösartige Domain-Blockierung

PRX-SD enthält eine eingebaute Adblock-Engine, die Werbung, Tracker und bekannte bösartige Domains auf DNS-Ebene blockiert, indem Einträge in die System-Hosts-Datei geschrieben werden (`/etc/hosts` unter Linux/macOS, `C:\Windows\System32\drivers\etc\hosts` unter Windows). Filterlisten werden lokal unter `~/.prx-sd/adblock/` gespeichert und unterstützen sowohl Adblock Plus (ABP)-Syntax als auch das Hosts-Datei-Format.

## Funktionsweise

Wenn Adblock aktiviert wird, führt PRX-SD folgende Schritte durch:

1. Konfigurierte Filterlisten herunterladen (EasyList, abuse.ch URLhaus usw.)
2. ABP-Regeln (`||domain.com^`) und Hosts-Einträge (`0.0.0.0 domain.com`) parsen
3. Alle blockierten Domains in die System-Hosts-Datei schreiben, auf `0.0.0.0` zeigend
4. Jeden blockierten Domain-Lookup in `~/.prx-sd/adblock/blocked_log.jsonl` protokollieren

::: tip
Für vollständige DNS-Filterung mit vorgelagerter Weiterleitung Adblock mit dem [DNS-Proxy](./dns-proxy) kombinieren. Der Proxy integriert Adblock-Regeln, IOC-Domain-Feeds und benutzerdefinierte Blocklists in einem einzigen Resolver.
:::

## Befehle

### Schutz aktivieren

Filterlisten herunterladen und DNS-Blockierung über die Hosts-Datei installieren. Erfordert Root-/Administrator-Rechte.

```bash
sudo sd adblock enable
```

Ausgabe:

```
>>> Enabling adblock protection...
  Loaded 4 lists (128432 rules)
success: Adblock enabled: 95211 domains blocked via /etc/hosts
  Lists: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  Log: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### Schutz deaktivieren

Alle PRX-SD-Einträge aus der Hosts-Datei entfernen. Anmeldedaten und zwischengespeicherte Listen bleiben erhalten.

```bash
sudo sd adblock disable
```

### Filterlisten synchronisieren

Alle konfigurierten Filterlisten zwangsweise neu herunterladen. Wenn Adblock aktuell aktiviert ist, wird die Hosts-Datei automatisch mit den neuen Regeln aktualisiert.

```bash
sudo sd adblock sync
```

### Statistiken anzeigen

Aktuellen Status, geladene Listen, Regelanzahl und Blockprotokoll-Größe anzeigen.

```bash
sd adblock stats
```

Ausgabe:

```
Adblock Engine Statistics
  Status:        ENABLED
  Lists loaded:  4
  Total rules:   128432
  Cache dir:     /home/user/.prx-sd/adblock
  Last sync:     2026-03-20T14:30:00Z
  Blocked log:   1842 entries

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### URL oder Domain prüfen

Testen, ob eine bestimmte URL oder Domain von den aktuellen Filterlisten blockiert wird.

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

Wenn die Domain nicht vollständig mit Schema qualifiziert ist, stellt PRX-SD automatisch `https://` voran.

Ausgabe:

```
BLOCKED ads.example.com -> Ads
```

oder:

```
ALLOWED docs.example.com
```

### Blockprotokoll anzeigen

Letzte blockierte Einträge aus dem persistenten JSONL-Protokoll anzeigen. Das Flag `--count` steuert, wie viele Einträge angezeigt werden (Standard: 50).

```bash
sd adblock log
sd adblock log --count 100
```

Jeder Protokolleintrag enthält einen Zeitstempel, die Domain, URL, Kategorie und Quelle.

### Benutzerdefinierte Filterliste hinzufügen

Eine Drittanbieter- oder benutzerdefinierte Filterliste nach Name und URL hinzufügen. Das Flag `--category` klassifiziert die Liste (Standard: `unknown`).

Verfügbare Kategorien: `ads`, `tracking`, `malware`, `social`.

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### Filterliste entfernen

Eine zuvor hinzugefügte Filterliste nach Name entfernen.

```bash
sd adblock remove my-blocklist
```

## Standard-Filterlisten

PRX-SD enthält die folgenden eingebauten Filterquellen:

| Liste | Kategorie | Beschreibung |
|-------|-----------|-------------|
| EasyList | Werbung | Community-gepflegte Anzeigen-Filterliste |
| EasyPrivacy | Tracking | Tracker- und Fingerprinting-Schutz |
| URLhaus-Domains | Malware | abuse.ch bösartige URL-Domains |
| Malware-Domains | Malware | Bekannte Malware-Verteilungs-Domains |

## Filterlisten-Format

Benutzerdefinierte Listen können entweder Adblock Plus (ABP)-Syntax oder Hosts-Datei-Format verwenden:

**ABP-Format:**

```
||ads.example.com^
||tracker.analytics.io^
```

**Hosts-Format:**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

Zeilen, die mit `!`, `#` oder `[` beginnen, werden als Kommentare behandelt und ignoriert.

## Datenverzeichnis-Struktur

```
~/.prx-sd/adblock/
  enabled           # Flag-Datei (vorhanden wenn Adblock aktiv)
  config.json       # Quelllisten-Konfiguration
  blocked_log.jsonl # Persistentes Blockprotokoll
  lists/            # Zwischengespeicherte Filterlisten-Dateien
```

::: warning
Das Aktivieren und Deaktivieren von Adblock modifiziert die System-Hosts-Datei. Immer `sd adblock disable` verwenden, um Einträge sauber zu entfernen, anstatt die Hosts-Datei manuell zu bearbeiten. Der Befehl erfordert Root-/Administrator-Rechte.
:::

## Beispiele

**Vollständiger Setup-Workflow:**

```bash
# Mit Standardlisten aktivieren
sudo sd adblock enable

# Benutzerdefinierte Malware-Blocklist hinzufügen
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# Neu synchronisieren, um die neue Liste herunterzuladen
sudo sd adblock sync

# Prüfen, ob eine bekannte bösartige Domain blockiert ist
sd adblock check malware-c2.example.com

# Statistiken prüfen
sd adblock stats

# Letzte Blockierungen anzeigen
sd adblock log --count 20
```

**Deaktivieren und bereinigen:**

```bash
sudo sd adblock disable
```

## Nächste Schritte

- [DNS-Proxy](./dns-proxy) einrichten für vollständige DNS-Filterung mit vorgelagerter Weiterleitung
- [Webhook-Alarme](../alerts/) konfigurieren, um bei blockierten Domains benachrichtigt zu werden
- Die [CLI-Referenz](../cli/) für die vollständige Befehlsliste erkunden
