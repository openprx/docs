---
title: YARA-Regeln
description: "PRX-SD verwendet YARA-X zum Scannen von Dateien gegen 38.800+ Regeln aus 8 Quellen einschließlich Community-Repositories, kommerziellen Regelsets und 64 eingebauten Regeln."
---

# YARA-Regeln

YARA-Regeln sind die zweite Schicht in der PRX-SD-Erkennungspipeline. Während Hash-Matching exakte Kopien bekannter Malware erkennt, erkennen YARA-Regeln Malware-**Familien**, **Varianten** und **Verhaltensmuster** durch Abgleich von Byte-Sequenzen, Strings und strukturellen Bedingungen innerhalb von Dateien.

PRX-SD wird mit 38.800+ YARA-Regeln aus 8 Quellen geliefert und verwendet die **YARA-X**-Engine -- die Rust-Neuentwicklung der nächsten Generation von YARA, die verbesserte Performance, Sicherheit und Kompatibilität bietet.

## YARA-X-Engine

PRX-SD verwendet [YARA-X](https://github.com/VirusTotal/yara-x) anstelle der traditionellen C-basierten YARA-Bibliothek. Wichtige Vorteile:

| Funktion | YARA (C) | YARA-X (Rust) |
|---------|----------|---------------|
| Sprache | C | Rust (speichersicher) |
| Performance | Gut | 2-5x schneller bei großen Regelsets |
| Regelkompatibilität | Basis | Vollständige Abwärtskompatibilität + neue Funktionen |
| Thread-Sicherheit | Erfordert sorgfältige Handhabung | Sicher von Grund auf |
| Modul-Unterstützung | Eingebaute Module | Modular, erweiterbar |

## Regelquellen

PRX-SD aggregiert Regeln aus 8 Quellen:

| Quelle | Regeln | Inhalt | Plattformabdeckung |
|--------|--------|--------|-------------------|
| **Eingebaute Regeln** | 64 | Ransomware, Trojaner, Backdoors, Rootkits, Miner, Webshells | Linux + macOS + Windows |
| **Yara-Rules/rules** (GitHub) | ~12.400 | Emotet, TrickBot, CobaltStrike, Mirai, LockBit | Plattformübergreifend |
| **Neo23x0/signature-base** | ~8.200 | APT29, Lazarus, Krypto-Mining, Webshells, Ransomware | Plattformübergreifend |
| **ReversingLabs YARA** | ~9.500 | Trojaner, Ransomware, Backdoors, Hack-Tools | Windows + Linux |
| **ESET IOC** | ~3.800 | Turla, Interception, fortgeschrittene anhaltende Bedrohungen | Plattformübergreifend |
| **InQuest** | ~4.836 | OLE/DDE bösartige Dokumente, Makro-Payloads | Plattformübergreifend |
| **JPCERT/CC** | ~500+ | Asien-Pazifik-gerichtete Bedrohungen | Plattformübergreifend |
| **Benutzerdefiniert/importiert** | Variabel | Benutzerdefinierte Regeln | Beliebig |

**Gesamt: 38.800+ Regeln** (nach Deduplizierung)

## Eingebaute Regeln

Die 64 eingebauten Regeln sind in die PRX-SD-Binärdatei kompiliert und immer verfügbar, auch ohne externe Regelsets herunterzuladen. Sie decken die häufigsten Bedrohungskategorien ab:

| Kategorie | Regeln | Beispiele |
|-----------|--------|----------|
| Ransomware | 12 | WannaCry, LockBit, Conti, REvil, BlackCat, Ryuk |
| Trojaner | 10 | Emotet, TrickBot, Dridex, QakBot |
| Backdoors | 8 | Cobalt Strike Beacon, Metasploit Meterpreter, Reverse Shells |
| Rootkits | 6 | Reptile, Diamorphine, Jynx2 (Linux) |
| Krypto-Miner | 6 | XMRig, CGMiner, versteckte Mining-Konfigurationen |
| Webshells | 8 | China Chopper, WSO, B374K, PHP/ASP/JSP-Shells |
| RATs | 6 | njRAT, DarkComet, AsyncRAT, Quasar |
| Exploits | 4 | EternalBlue, PrintNightmare, Log4Shell-Payloads |
| Test-Signaturen | 4 | EICAR-Testdatei-Varianten |

## Regel-Matching-Prozess

Wenn eine Datei Schicht 2 erreicht, verarbeitet YARA-X sie wie folgt:

1. **Regelkompilierung** -- Beim Start werden alle Regeln in eine optimierte interne Darstellung kompiliert. Dies geschieht einmal und wird im Arbeitsspeicher gecacht.
2. **Atom-Extraktion** -- YARA-X extrahiert kurze Byte-Sequenzen (Atome) aus Regelmustern, um einen Suchindex zu erstellen. Dies ermöglicht schnelles Vorfiltern.
3. **Scannen** -- Der Dateiinhalt wird gegen den Atom-Index gescannt. Nur Regeln mit passenden Atomen werden vollständig ausgewertet.
4. **Bedingungsauswertung** -- Für jede Kandidatenregel wird die vollständige Bedingung (boolesche Logik, String-Anzahl, Dateistruktur-Prüfungen) ausgewertet.
5. **Ergebnis** -- Passende Regeln werden gesammelt und die Datei wird als `MALICIOUS` mit den Regelnamen im Bericht markiert.

### Performance

| Metrik | Wert |
|--------|------|
| Regelkompilierung (38.800 Regeln) | ~2 Sekunden (einmalig beim Start) |
| Scan-Zeit pro Datei | ~0,3 Millisekunden Durchschnitt |
| Arbeitsspeichernutzung (kompilierte Regeln) | ~150 MB |
| Durchsatz | ~3.000 Dateien/Sekunde/Thread |

## YARA-Regeln aktualisieren

Regeln werden zusammen mit Hash-Signaturen aktualisiert:

```bash
# Alles aktualisieren (Hashes + YARA-Regeln)
sd update

# Nur YARA-Regeln aktualisieren
sd update --source yara
```

Der Update-Prozess:

1. Regel-Archive von jeder Quelle herunterladen
2. Regelsyntax mit YARA-X validieren
3. Regeln nach Name und Inhalts-Hash deduplizieren
4. Das kombinierte Regelset kompilieren
5. Das aktive Regelset atomar ersetzen

::: tip Zero-Downtime-Updates
Regel-Updates sind atomar. Das neue Regelset wird kompiliert und validiert, bevor das aktive ersetzt wird. Wenn die Kompilierung fehlschlägt (z.B. wegen eines Syntaxfehlers in einer Community-Regel), bleibt das vorhandene Regelset aktiv.
:::

## Benutzerdefinierte Regeln

Sie können eigene YARA-Regeln hinzufügen, indem Sie `.yar`- oder `.yara`-Dateien im benutzerdefinierten Regelverzeichnis ablegen:

```bash
# Standard-Verzeichnis für benutzerdefinierte Regeln
~/.config/prx-sd/rules/
```

Beispiel für eine benutzerdefinierte Regel:

```yara
rule custom_webshell_detector {
    meta:
        description = "Detects custom PHP webshell variant"
        author = "Security Team"
        severity = "high"

    strings:
        $eval = "eval(base64_decode(" ascii
        $system = "system($_" ascii
        $exec = "exec($_" ascii

    condition:
        filesize < 100KB and
        ($eval or $system or $exec)
}
```

Nach dem Hinzufügen benutzerdefinierter Regeln das Regelset neu laden:

```bash
sd reload-rules
```

Oder den Monitor-Daemon neu starten, um Änderungen automatisch zu übernehmen.

## Regelverzeichnisse

| Verzeichnis | Quelle | Update-Verhalten |
|-------------|--------|-----------------|
| `~/.local/share/prx-sd/rules/builtin/` | In Binärdatei kompiliert | Mit Releases aktualisiert |
| `~/.local/share/prx-sd/rules/community/` | Von Quellen heruntergeladen | Von `sd update` aktualisiert |
| `~/.config/prx-sd/rules/` | Benutzerdefinierte Regeln | Manuell, niemals überschrieben |

## Regeln überprüfen

Aktuelle geladene Regelanzahl und Quellen prüfen:

```bash
sd info
```

```
YARA Rules
==========
Built-in:        64
Community:       38,736
Custom:          12
Total compiled:  38,812
Rule sources:    8
Last updated:    2026-03-21 10:00:00 UTC
```

Regeln auflisten, die einem bestimmten Schlüsselwort entsprechen:

```bash
sd rules list --filter "ransomware"
```

## Nächste Schritte

- [Heuristische Analyse](./heuristics) -- Verhaltens-Erkennung für Dateien, die Signaturen umgehen
- [Hash-Matching](./hash-matching) -- Die schnellste Erkennungsschicht
- [Erkennungsengine Übersicht](./index) -- Wie alle Schichten zusammenarbeiten
- [Unterstützte Dateitypen](./file-types) -- Welche Dateiformate YARA-Regeln anvisieren
