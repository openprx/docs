---
title: Hash-Matching
description: "Wie PRX-SD LMDB für O(1)-Hash-Lookups gegen SHA-256- und MD5-Datenbanken von abuse.ch, VirusShare und eingebauten Blocklists verwendet."
---

# Hash-Matching

Hash-Matching ist die erste und schnellste Schicht in der PRX-SD-Erkennungspipeline. Für jede gescannte Datei berechnet PRX-SD einen kryptografischen Hash und sucht ihn in einer lokalen Datenbank bekannter Malware-Hashes. Ein Treffer bedeutet, dass die Datei eine exakte, byte-für-byte Kopie eines bekannten Malware-Samples ist.

## Funktionsweise

1. **Hash-Berechnung** -- PRX-SD berechnet den SHA-256-Hash der Datei. Für VirusShare-Lookups wird auch der MD5-Hash berechnet.
2. **LMDB-Lookup** -- Der Hash wird gegen die LMDB-Datenbank mit einem speichergemappten B+-Baum geprüft. Dies bietet O(1) durchschnittliche Lookup-Zeit.
3. **Metadaten-Abruf** -- Wenn ein Treffer gefunden wird, werden zugehörige Metadaten (Quelle, Malware-Familie, Erstentdeckungsdatum) zurückgegeben.
4. **Urteil** -- Ein Hash-Treffer erzeugt sofort ein `MALICIOUS`-Urteil, und die verbleibenden Erkennungsschichten werden übersprungen.

### Performance

| Operation | Zeit |
|-----------|------|
| SHA-256-Berechnung (1 KB-Datei) | ~2 Mikrosekunden |
| SHA-256-Berechnung (10 MB-Datei) | ~15 Millisekunden |
| LMDB-Lookup | ~0,5 Mikrosekunden |
| Gesamt pro Datei (kleine Datei, Hash-Treffer) | ~3 Mikrosekunden |

LMDB verwendet speichergemappte Dateien, sodass der Page-Cache des Betriebssystems häufig genutzte Teile der Datenbank im RAM hält. Bei einem System mit ausreichend Speicher sind Lookups praktisch kostenlos.

## Unterstützte Hash-Typen

| Hash-Typ | Größe | Verwendung |
|----------|-------|-----------|
| **SHA-256** | 256-Bit (64 Hex-Zeichen) | Primärer Hash für alle Lookups. Wird von abuse.ch-Feeds und eingebauter Blocklist verwendet. |
| **MD5** | 128-Bit (32 Hex-Zeichen) | Wird für VirusShare-Datenbankkompatibilität verwendet. Nur berechnet, wenn VirusShare-Daten vorhanden sind. |

::: warning MD5-Einschränkungen
MD5 ist kryptografisch gebrochen und anfällig für Kollisionsangriffe. PRX-SD verwendet MD5 nur aus Abwärtskompatibilitätsgründen mit der VirusShare-Datenbank. SHA-256 ist der primäre Hash für alle anderen Quellen.
:::

## Datenquellen

PRX-SD aggregiert Hash-Signaturen aus mehreren Bedrohungsgeheimdienst-Feeds:

| Quelle | Hash-Typ | Kostenlos | Inhalt | Update-Frequenz |
|--------|----------|-----------|--------|-----------------|
| abuse.ch MalwareBazaar | SHA-256 | Ja | Aktuelle 48-Stunden-Malware-Samples | Alle 5 Minuten |
| abuse.ch URLhaus | SHA-256 | Ja | Malware-Dateien von bösartigen URLs | Stündlich |
| abuse.ch Feodo Tracker | SHA-256 | Ja | Banking-Trojaner (Emotet, Dridex, TrickBot) | Alle 5 Minuten |
| abuse.ch ThreatFox | SHA-256 | Ja | Community-IOC-Sharing-Plattform | Stündlich |
| VirusShare | MD5 | Ja | 20M+ Malware-Hashes (historisch) | Periodisch |
| Eingebaute Blocklist | SHA-256 | Enthalten | EICAR, WannaCry, NotPetya, Emotet usw. | Mit Releases |

### Gesamte Hash-Abdeckung

| Update-Modus | Hashes | Datenbankgröße |
|-------------|--------|----------------|
| Standard (`sd update`) | ~28.000 SHA-256 | ~5 MB |
| Vollständig (`sd update --full`) | ~28.000 SHA-256 + 20M+ MD5 | ~800 MB |

## Hash-Datenbank aktualisieren

### Standard-Update

Holt die neuesten SHA-256-Hashes von allen abuse.ch-Feeds:

```bash
sd update
```

Dies läuft automatisch, wenn PRX-SD zum ersten Mal installiert wird, und kann mit Cron oder `sd service` für kontinuierliche Updates geplant werden.

### Vollständiges Update

Enthält die vollständige VirusShare-MD5-Datenbank:

```bash
sd update --full
```

::: tip Wann den vollständigen Modus verwenden
Die VirusShare-Datenbank enthält 20M+ historische MD5-Hashes, die Jahre zurückreichen. Sie ist nützlich für forensische Untersuchungen und umfassendes Scannen, fügt aber ~800 MB zur Datenbank hinzu. Für den täglichen Schutz ist das Standard-Update ausreichend.
:::

### Manueller Hash-Import

Benutzerdefinierte Hash-Listen aus Textdateien importieren (ein Hash pro Zeile):

```bash
sd import my_hashes.txt
```

Der Import-Befehl erkennt den Hash-Typ automatisch (SHA-256 oder MD5) anhand der String-Länge. Sie können auch Metadaten angeben:

```bash
sd import my_hashes.txt --source "internal-ir" --family "custom-trojan"
```

## LMDB-Datenbank

PRX-SD speichert Hashes in [LMDB](http://www.lmdb.tech/doc/) (Lightning Memory-Mapped Database), ausgewählt für seine Eigenschaften:

| Eigenschaft | Vorteil |
|-------------|---------|
| Speichergemapptes I/O | Zero-Copy-Lesevorgänge, kein Serialisierungs-Overhead |
| B+-Baum-Struktur | O(1) amortisierte Lookups |
| ACID-Transaktionen | Sichere gleichzeitige Lesevorgänge während Updates |
| Absturzsicher | Copy-on-Write verhindert Korruption |
| Kompakte Größe | Effiziente Speicherung von Hash-Schlüsseln |

Die Datenbank wird standardmäßig unter `~/.local/share/prx-sd/signatures.lmdb` gespeichert. Der Pfad kann angepasst werden:

```toml
# ~/.config/prx-sd/config.toml
[database]
path = "/opt/prx-sd/signatures.lmdb"
```

## Datenbankstatus prüfen

Aktuelle Hash-Datenbankstatistiken anzeigen:

```bash
sd info
```

```
PRX-SD Signature Database
=========================
SHA-256 hashes:  28,428
MD5 hashes:      0 (run 'sd update --full' for VirusShare)
YARA rules:      38,800
Database path:   /home/user/.local/share/prx-sd/signatures.lmdb
Database size:   4.8 MB
Last updated:    2026-03-21 10:00:00 UTC
```

## Wie Hash-Matching in die Pipeline passt

Hash-Matching ist als erste Verteidigungslinie konzipiert, weil:

- **Geschwindigkeit** -- Bei ~3 Mikrosekunden pro Datei fügt es vernachlässigbaren Overhead hinzu. Eine Million sauberer Dateien kann in unter 3 Sekunden geprüft werden.
- **Keine Fehlalarme** -- Ein SHA-256-Treffer ist eine kryptografische Garantie, dass die Datei identisch mit einem bekannten Malware-Sample ist.
- **Kurzschluss** -- Wenn ein Hash-Treffer gefunden wird, werden YARA- und heuristische Analyse vollständig übersprungen, was erhebliche Verarbeitungszeit spart.

Die Einschränkung des Hash-Matchings ist, dass es nur **exakte Kopien** bekannter Samples erkennt. Eine Ein-Byte-Änderung produziert einen anderen Hash und umgeht diese Schicht. Deshalb existieren die YARA- und heuristischen Schichten als nachfolgende Abwehrmaßnahmen.

## Nächste Schritte

- [YARA-Regeln](./yara-rules) -- Musterbasierte Erkennung für Varianten und Familien
- [Heuristische Analyse](./heuristics) -- Verhaltens-Erkennung für unbekannte Bedrohungen
- [Erkennungsengine Übersicht](./index) -- Wie alle Schichten zusammenarbeiten
- [Datei- und Verzeichnisscan](../scanning/file-scan) -- Hash-Matching in der Praxis
