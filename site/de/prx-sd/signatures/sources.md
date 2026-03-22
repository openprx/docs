---
title: Signaturquellen
description: "Detaillierte Informationen zu jeder in PRX-SD integrierten Bedrohungsgeheimdienst-Quelle, einschließlich Update-Häufigkeit und Abdeckung."
---

# Signaturquellen

PRX-SD aggregiert Bedrohungsgeheimdienste aus über 20 Open-Source- und Community-Quellen. Diese Seite enthält detaillierte Informationen zu jeder Quelle, ihrer Abdeckung, Update-Häufigkeit und ihrem Datentyp.

## abuse.ch-Quellen

Das abuse.ch-Projekt bietet mehrere hochwertige, frei verfügbare Bedrohungs-Feeds:

| Quelle | Datentyp | Inhalt | Update-Häufigkeit | Lizenz |
|--------|----------|--------|-------------------|---------||
| **MalwareBazaar** | SHA-256 | Malware-Samples, die von Forschern weltweit eingereicht werden. Rollendes 48-Stunden-Fenster der neuesten Einreichungen. | Alle 5 Minuten | CC0 |
| **URLhaus** | SHA-256 | Datei-Hashes, die mit URLs zur Malware-Verteilung verknüpft sind. Umfasst Drive-by-Downloads, Phishing-Payloads und Exploit-Kit-Drops. | Stündlich | CC0 |
| **Feodo Tracker** | SHA-256 | Banking-Trojaner und Loader: Emotet, Dridex, TrickBot, QakBot, BazarLoader, IcedID. | Alle 5 Minuten | CC0 |
| **ThreatFox** | SHA-256 | Community-eingereichte IOCs über mehrere Malware-Familien hinweg. Enthält Datei-Hashes, Domains und IPs. | Stündlich | CC0 |
| **SSL Blacklist** | SHA-1 (Zert.) | SHA-1-Fingerabdrücke von SSL-Zertifikaten, die von Botnet-C2-Servern verwendet werden. Wird für Netzwerk-IOC-Matching verwendet. | Täglich | CC0 |

::: tip
Alle abuse.ch-Feeds sind ohne Registrierung oder API-Schlüssel verfügbar. PRX-SD lädt sie direkt von den öffentlichen API-Endpunkten herunter.
:::

## VirusShare

| Feld | Details |
|------|---------|
| **Datentyp** | MD5-Hashes |
| **Anzahl** | 20.000.000+ |
| **Inhalt** | Eines der größten öffentlichen Malware-Hash-Repositories. Enthält MD5-Hashes, die in nummerierten Listendateien (VirusShare_00000.md5 bis VirusShare_00500+.md5) organisiert sind. |
| **Update-Häufigkeit** | Neue Listendateien werden regelmäßig hinzugefügt |
| **Zugang** | Kostenlos (erfordert `--full`-Flag aufgrund der Download-Größe) |
| **Lizenz** | Kostenlos für nicht-kommerzielle Nutzung |

::: warning
Der vollständige VirusShare-Download beträgt ca. 500 MB und nimmt erhebliche Zeit für den Import in Anspruch. `sd update --full` verwenden, um ihn einzuschließen, oder `sd update` für Standard-Updates ohne VirusShare.
:::

## YARA-Regel-Quellen

| Quelle | Regelanzahl | Schwerpunkt | Qualität |
|--------|-------------|-------------|---------|
| **Eingebaute Regeln** | 64 | Ransomware, Trojaner, Backdoors, Rootkits, Miner, Webshells für Linux, macOS, Windows | Vom PRX-SD-Team kuratiert |
| **Yara-Rules/rules** | Community | Emotet, TrickBot, CobaltStrike, Mirai, LockBit, APTs | Community-gepflegt |
| **Neo23x0/signature-base** | Großes Volumen | APT29, Lazarus Group, Krypto-Mining, Webshells, Ransomware-Familien | Hohe Qualität, Florian Roth |
| **ReversingLabs YARA** | Kommerziell-grade | Trojaner, Ransomware, Backdoors, Hack-Tools, Exploits | Professionell, Open-Source |
| **Elastic Security** | Wachsend | Endpoint-Erkennungsregeln für Windows-, Linux-, macOS-Bedrohungen | Elastic-Bedrohungsforschungs-Team |
| **Google GCTI** | Selektiv | Hochvertrauenswürdige Regeln von Google Cloud Threat Intelligence | Sehr hohe Qualität |
| **ESET IOC** | Selektiv | APT-Tracking: Turla, Interception, InvisiMole und andere fortgeschrittene Bedrohungen | APT-fokussiert |
| **InQuest** | Spezialisiert | Bösartige Dokumente: OLE-Exploits, DDE-Injektion, Makro-basierte Malware | Dokumentenspezifisch |

### YARA-Regelkategorien

Der kombinierte Regelsatz deckt diese Malware-Kategorien ab:

| Kategorie | Beispiel-Familien | Plattform-Abdeckung |
|-----------|-------------------|---------------------|
| Ransomware | WannaCry, LockBit, Conti, REvil, Akira, BlackCat | Windows, Linux |
| Trojaner | Emotet, TrickBot, QakBot, Agent Tesla, RedLine | Windows |
| Backdoors | CobaltStrike, Metasploit, ShadowPad, PlugX | Plattformübergreifend |
| Rootkits | Reptile, Diamorphine, Horse Pill | Linux |
| Miner | XMRig, CCMiner-Varianten | Plattformübergreifend |
| Webshells | China Chopper, WSO, b374k, c99, r57 | Plattformübergreifend |
| APTs | APT29, Lazarus, Turla, Sandworm, OceanLotus | Plattformübergreifend |
| Exploits | EternalBlue, PrintNightmare, Log4Shell-Payloads | Plattformübergreifend |
| Hack-Tools | Mimikatz, Rubeus, BloodHound, Impacket | Windows |
| Dokumente | Bösartige Office-Makros, PDF-Exploits, RTF-Exploits | Plattformübergreifend |

## IOC-Feed-Quellen

| Quelle | Indikator-Typ | Anzahl | Inhalt | Update-Häufigkeit |
|--------|--------------|--------|--------|-------------------|
| **IPsum** | IP-Adressen | 150.000+ | Aggregierte bösartige IP-Reputation aus 50+ Blocklists. Multi-Level-Scoring (Stufe 1-8 basierend auf der Anzahl der Listen, die die IP zitieren). | Täglich |
| **FireHOL** | IP-Adressen | 200.000+ | Kuratierte IP-Blocklists nach Bedrohungsstufe (level1 bis level4). Höhere Stufen haben strengere Aufnahmekriterien. | Alle 6 Stunden |
| **Emerging Threats** | IP-Adressen | 100.000+ | IPs, extrahiert aus Suricata- und Snort-IDS-Regeln. Umfasst Botnet-C2, Scanning, Brute Force, Exploit-Versuche. | Täglich |
| **SANS ISC** | IP-Adressen | 50.000+ | Verdächtige IPs aus dem DShield-Sensornetzwerk des Internet Storm Center. | Täglich |
| **URLhaus (URLs)** | URLs | 85.000+ | Aktive bösartige URLs für Malware-Verteilung, Phishing und Exploit-Lieferung. | Stündlich |

## ClamAV-Datenbank

| Feld | Details |
|------|---------|
| **Datentyp** | Multi-Format-Signaturen (Hash, Bytecode, Regex, Logisch) |
| **Anzahl** | 11.000.000+ Signaturen |
| **Dateien** | `main.cvd` (Kern), `daily.cvd` (tägliche Updates), `bytecode.cvd` (Bytecode-Regeln) |
| **Inhalt** | Die größte Open-Source-Virensignatur-Datenbank. Umfasst Viren, Trojaner, Würmer, Phishing, PUAs. |
| **Update-Häufigkeit** | Mehrmals täglich |
| **Zugang** | Kostenlos via freshclam oder direktem Download |

ClamAV-Integration aktivieren:

```bash
# ClamAV-Datenbanken importieren
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

Detaillierte ClamAV-Import-Anweisungen finden Sie unter [Hashes importieren](./import).

## Quellkonfiguration

Einzelne Quellen in `config.toml` aktivieren oder deaktivieren:

```toml
[signatures.sources]
malware_bazaar = true
urlhaus = true
feodo_tracker = true
threatfox = true
ssl_blacklist = true
virusshare = false          # Mit sd update --full aktivieren
builtin_rules = true
yara_community = true
neo23x0 = true
reversinglabs = true
elastic = true
gcti = true
eset = true
inquest = true
ipsum = true
firehol = true
emerging_threats = true
sans_isc = true
clamav = false              # Nach Import der ClamAV-DBs aktivieren
```

## Nächste Schritte

- [Signaturen aktualisieren](./update) -- alle Quellen herunterladen und aktualisieren
- [Hashes importieren](./import) -- benutzerdefinierte Hashes und ClamAV-Datenbanken hinzufügen
- [Benutzerdefinierte YARA-Regeln](./custom-rules) -- eigene Erkennungsregeln schreiben
- [Bedrohungsgeheimdienst Übersicht](./index) -- Architektur und Datenverzeichnis-Layout
