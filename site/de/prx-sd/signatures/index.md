---
title: Bedrohungsgeheimdienst Übersicht
description: Architektur der PRX-SD-Signaturdatenbank einschließlich Hash-Signaturen, YARA-Regeln, IOC-Feeds und ClamAV-Integration.
---

# Bedrohungsgeheimdienst Übersicht

PRX-SD aggregiert Bedrohungsgeheimdienste aus mehreren Open-Source- und Community-Quellen in eine einheitliche lokale Datenbank. Dieser mehrschichtige Ansatz gewährleistet breite Abdeckung -- von bekannten Malware-Hashes über Verhaltens-Musterregeln bis hin zu Netzwerk-Indikatoren für Kompromittierung.

## Signaturkategorien

PRX-SD organisiert Bedrohungsgeheimdienste in vier Kategorien:

| Kategorie | Quellen | Anzahl | Lookup-Geschwindigkeit | Speicher |
|-----------|---------|--------|----------------------|---------|
| **Hash-Signaturen** | 7 Quellen | Millionen SHA-256/MD5 | O(1) via LMDB | ~500 MB |
| **YARA-Regeln** | 8 Quellen | 38.800+ Regeln | Muster-Matching | ~15 MB |
| **IOC-Feeds** | 5 Quellen | 585.000+ Indikatoren | Trie / Hash-Map | ~25 MB |
| **ClamAV-Datenbank** | 1 Quelle | 11.000.000+ Signaturen | ClamAV-Engine | ~300 MB |

### Hash-Signaturen

Die schnellste Erkennungsschicht. Jede Datei wird beim Scannen gehasht und gegen eine lokale LMDB-Datenbank mit bekannten bösartigen Datei-Hashes geprüft:

- **abuse.ch MalwareBazaar** -- SHA-256-Hashes aktueller Malware-Samples (rollendes 48-Stunden-Fenster)
- **abuse.ch URLhaus** -- SHA-256-Hashes von Dateien, die über bösartige URLs verteilt werden
- **abuse.ch Feodo Tracker** -- SHA-256-Hashes von Banking-Trojanern (Emotet, Dridex, TrickBot)
- **abuse.ch ThreatFox** -- SHA-256-IOCs aus Community-Einreichungen
- **abuse.ch SSL Blacklist** -- SHA-1-Fingerabdrücke von bösartigen SSL-Zertifikaten
- **VirusShare** -- 20.000.000+ MD5-Hashes (verfügbar mit `--full`-Update)
- **Eingebaute Blocklist** -- Fest programmierte Hashes für EICAR-Testdatei, WannaCry, NotPetya, Emotet

### YARA-Regeln

Muster-Matching-Regeln, die Malware durch Code-Muster, Strings und Struktur statt durch exakte Hashes identifizieren. Dies erkennt Varianten und Familien von Malware:

- **Eingebaute Regeln** -- 64 kuratierte Regeln für Ransomware, Trojaner, Backdoors, Rootkits, Miner, Webshells
- **Yara-Rules/rules** -- Community-gepflegte Regeln für Emotet, TrickBot, CobaltStrike, Mirai, LockBit
- **Neo23x0/signature-base** -- Hochwertige Regeln für APT29, Lazarus, Krypto-Mining, Webshells
- **ReversingLabs YARA** -- Kommerziell-grade Open-Source-Regeln für Trojaner, Ransomware, Backdoors
- **ESET IOC** -- APT-Tracking-Regeln für Turla, Interception und andere fortgeschrittene Bedrohungen
- **InQuest** -- Spezialisierte Regeln für bösartige Dokumente (OLE, DDE-Exploits)
- **Elastic Security** -- Erkennungsregeln vom Elastic-Bedrohungsforschungs-Team
- **Google GCTI** -- YARA-Regeln von Google Cloud Threat Intelligence

### IOC-Feeds

Netzwerk-Indikatoren für Kompromittierung zur Erkennung von Verbindungen zu bekannt-bösartiger Infrastruktur:

- **IPsum** -- Aggregierte bösartige IP-Reputationsliste (Multi-Quellen-Scoring)
- **FireHOL** -- Kuratierte IP-Blocklists auf mehreren Bedrohungsstufen
- **Emerging Threats** -- Suricata/Snort-Regeln zu IP/Domain-IOCs konvertiert
- **SANS ISC** -- Tägliche verdächtige IP-Feeds vom Internet Storm Center
- **URLhaus** -- Aktive bösartige URLs für Phishing, Malware-Verteilung

### ClamAV-Datenbank

Optionale Integration mit der ClamAV-Virenten-Datenbank, die das größte Open-Source-Signatur-Set bietet:

- **main.cvd** -- Kern-Virus-Signaturen
- **daily.cvd** -- Täglich aktualisierte Signaturen
- **bytecode.cvd** -- Bytecode-Erkennungs-Signaturen

## Datenverzeichnis-Struktur

Alle Signaturdaten werden unter `~/.prx-sd/signatures/` gespeichert:

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOCs
    virusshare.lmdb           # VirusShare MD5 (nur --full)
    custom.lmdb               # Benutzerimportierte Hashes
  yara/
    builtin/                  # Eingebaute Regeln (mit Binärdatei geliefert)
    community/                # Heruntergeladene Community-Regeln
    custom/                   # Benutzerdefinierte Regeln
    compiled.yarc             # Vorkompilierter Regel-Cache
  ioc/
    ipsum.dat                 # IPsum IP-Reputation
    firehol.dat               # FireHOL-Blocklists
    et_compromised.dat        # Emerging Threats IPs
    sans_isc.dat              # SANS ISC verdächtige IPs
    urlhaus_urls.dat          # URLhaus bösartige URLs
  clamav/
    main.cvd                  # ClamAV-Kern-Signaturen
    daily.cvd                 # ClamAV-Tages-Updates
    bytecode.cvd              # ClamAV-Bytecode-Signaturen
  metadata.json               # Update-Zeitstempel und Versionsinformationen
```

::: tip
Verwenden Sie `sd info`, um den aktuellen Zustand aller Signaturdatenbanken anzuzeigen, einschließlich Quellenanzahl, letzter Update-Zeiten und Festplattennutzung.
:::

## Signaturstatus abfragen

```bash
sd info
```

```
PRX-SD Signature Database
  Hash signatures:    1,247,832 entries (7 sources)
  YARA rules:         38,847 rules (8 sources, 64 built-in)
  IOC indicators:     585,221 entries (5 sources)
  ClamAV signatures:  not installed
  Last updated:       2026-03-21 08:00:12 UTC
  Database version:   2026.0321.1
  Disk usage:         542 MB
```

## Nächste Schritte

- [Signaturen aktualisieren](./update) -- Datenbanken aktuell halten
- [Signaturquellen](./sources) -- Detaillierte Informationen zu jeder Quelle
- [Hashes importieren](./import) -- Eigene Hash-Blocklists hinzufügen
- [Benutzerdefinierte YARA-Regeln](./custom-rules) -- Eigene Erkennungsregeln schreiben und einsetzen
