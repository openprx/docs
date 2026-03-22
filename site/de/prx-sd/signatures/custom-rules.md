---
title: Benutzerdefinierte YARA-Regeln
description: "Benutzerdefinierte YARA-Regeln für PRX-SD schreiben, testen und einsetzen, um Bedrohungen spezifisch für Ihre Umgebung zu erkennen."
---

# Benutzerdefinierte YARA-Regeln

YARA ist eine Muster-Matching-Sprache, die für die Malware-Erkennung entwickelt wurde. PRX-SD unterstützt das Laden benutzerdefinierter YARA-Regeln neben seinen eingebauten und Community-Regeln, sodass Sie Erkennungslogik erstellen können, die auf Ihre spezifische Bedrohungslandschaft zugeschnitten ist.

## Regeldatei-Speicherort

Benutzerdefinierte YARA-Regeln im Verzeichnis `~/.prx-sd/yara/` ablegen:

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SD lädt alle `.yar`- und `.yara`-Dateien aus diesem Verzeichnis beim Start und während Signatur-Updates. Regeln werden in einem optimierten Cache (`compiled.yarc`) für schnelles Scannen kompiliert.

::: tip
Unterverzeichnisse werden unterstützt. Regeln nach Kategorie organisieren für einfachere Verwaltung:
```
~/.prx-sd/yara/
  ransomware/
    lockbit_variant.yar
    custom_encryptor.yar
  webshells/
    internal_webshell.yar
  compliance/
    pii_detection.yar
```
:::

## YARA-Regelsyntax

Eine YARA-Regel besteht aus drei Abschnitten: **meta**, **strings** und **condition**.

### Grundlegende Regelstruktur

```yara
rule Detect_CustomMalware : trojan
{
    meta:
        author = "Security Team"
        description = "Detects custom trojan used in targeted attack"
        severity = "high"
        date = "2026-03-21"
        reference = "https://internal.wiki/incident-2026-042"

    strings:
        $magic = { 4D 5A 90 00 }              // PE header (hex bytes)
        $str1 = "cmd.exe /c" ascii nocase      // ASCII string, case-insensitive
        $str2 = "powershell -enc" ascii nocase
        $str3 = "C:\\Users\\Public\\payload" wide  // UTF-16 string
        $mutex = "Global\\CustomMutex_12345"
        $regex = /https?:\/\/[a-z0-9]{8,12}\.onion/ // Regex pattern

    condition:
        $magic at 0 and
        (2 of ($str*)) and
        ($mutex or $regex)
}
```

### Wichtige Syntaxelemente

| Element | Syntax | Beschreibung |
|---------|--------|-------------|
| Hex-Strings | `{ 4D 5A ?? 00 }` | Byte-Muster mit Wildcards (`??`) |
| Text-Strings | `"text" ascii` | Einfache ASCII-Strings |
| Wide-Strings | `"text" wide` | UTF-16LE-kodierte Strings |
| Groß-/Kleinschreibung | `"text" nocase` | Übereinstimmung unabhängig von Groß-/Kleinschreibung |
| Regex | `/pattern/` | Reguläre Ausdrucksmuster |
| Tags | `rule Name : tag1 tag2` | Kategorisierungs-Tags |
| Dateigröße | `filesize < 1MB` | Bedingung auf Dateigröße |
| Einstiegspunkt | `entrypoint` | PE/ELF-Einstiegspunkt-Offset |
| An Offset | `$str at 0x100` | String an bestimmtem Offset |
| In Bereich | `$str in (0..1024)` | String innerhalb eines Byte-Bereichs |
| Anzahl | `#str > 3` | Anzahl der String-Vorkommen |

### Schweregrade

PRX-SD liest das `severity`-Meta-Feld, um die Bedrohungsklassifizierung zu bestimmen:

| Schweregrad | PRX-SD-Urteil |
|-------------|---------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| (nicht gesetzt) | SUSPICIOUS |

## Beispielregeln

### Verdächtiges Skript erkennen

```yara
rule Suspicious_PowerShell_Download : script
{
    meta:
        author = "Security Team"
        description = "PowerShell script downloading and executing remote content"
        severity = "high"

    strings:
        $dl1 = "Invoke-WebRequest" ascii nocase
        $dl2 = "Net.WebClient" ascii nocase
        $dl3 = "DownloadString" ascii nocase
        $dl4 = "DownloadFile" ascii nocase
        $exec1 = "Invoke-Expression" ascii nocase
        $exec2 = "iex(" ascii nocase
        $exec3 = "Start-Process" ascii nocase
        $enc = "-EncodedCommand" ascii nocase
        $bypass = "-ExecutionPolicy Bypass" ascii nocase

    condition:
        filesize < 5MB and
        (any of ($dl*)) and
        (any of ($exec*) or $enc or $bypass)
}
```

### Kryptowährungs-Miner erkennen

```yara
rule Crypto_Miner_Strings : miner
{
    meta:
        author = "Security Team"
        description = "Detects cryptocurrency mining software"
        severity = "medium"

    strings:
        $pool1 = "stratum+tcp://" ascii
        $pool2 = "stratum+ssl://" ascii
        $pool3 = "pool.minexmr.com" ascii
        $pool4 = "xmrpool.eu" ascii
        $algo1 = "cryptonight" ascii nocase
        $algo2 = "randomx" ascii nocase
        $algo3 = "ethash" ascii nocase
        $wallet = /[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}/ ascii  // Monero address

    condition:
        (any of ($pool*)) or
        ((any of ($algo*)) and $wallet)
}
```

### Webshells erkennen

```yara
rule PHP_Webshell_Generic : webshell
{
    meta:
        author = "Security Team"
        description = "Generic PHP webshell detection"
        severity = "critical"

    strings:
        $php = "<?php" ascii nocase
        $eval1 = "eval(" ascii nocase
        $eval2 = "assert(" ascii nocase
        $eval3 = "preg_replace" ascii nocase
        $input1 = "$_GET[" ascii
        $input2 = "$_POST[" ascii
        $input3 = "$_REQUEST[" ascii
        $input4 = "$_COOKIE[" ascii
        $cmd1 = "system(" ascii nocase
        $cmd2 = "passthru(" ascii nocase
        $cmd3 = "shell_exec(" ascii nocase
        $cmd4 = "exec(" ascii nocase
        $obf1 = "base64_decode" ascii nocase
        $obf2 = "str_rot13" ascii nocase
        $obf3 = "gzinflate" ascii nocase

    condition:
        $php and
        (any of ($eval*)) and
        (any of ($input*)) and
        (any of ($cmd*) or any of ($obf*))
}
```

## Regeln testen

Regeln vor der Bereitstellung validieren:

```bash
# Regeldatei auf Syntax prüfen (Syntaxvalidierung)
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# Regel gegen eine bestimmte Datei testen
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# Alle benutzerdefinierten Regeln gegen ein Verzeichnis von Samples testen
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# Trockenlauf-Scan mit nur benutzerdefinierten Regeln
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
Neue Regeln immer gegen eine Reihe bekannter sauberer Dateien testen, um auf falsch-positive Ergebnisse zu prüfen, bevor sie in der Produktionsüberwachung eingesetzt werden.
:::

## Regeln neu laden

Nach dem Hinzufügen oder Ändern von Regeln ohne Neustart des Daemons neu laden:

```bash
# Regeln neu kompilieren und neu laden
sd yara reload

# Wenn als Daemon ausgeführt, SIGHUP senden
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## Regeln beitragen

Regeln mit der PRX-SD-Community teilen:

1. Das Repository [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures) forken
2. Regel zum entsprechenden Kategorieverzeichnis hinzufügen
3. Umfassende `meta`-Felder einschließen (author, description, severity, reference)
4. Gegen sowohl bösartige Samples als auch saubere Dateien testen
5. Pull-Request mit Sample-Hashes zur Validierung einreichen

## Nächste Schritte

- [Signaturquellen](./sources) -- Community- und Drittanbieter-YARA-Regelquellen
- [Hashes importieren](./import) -- Hash-basierte Blocklists hinzufügen
- [Signaturen aktualisieren](./update) -- alle Regeln aktuell halten
- [Bedrohungsgeheimdienst Übersicht](./index) -- vollständige Signaturarchitektur
