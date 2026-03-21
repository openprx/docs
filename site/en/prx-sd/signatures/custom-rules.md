---
title: Custom YARA Rules
description: Write, test, and deploy custom YARA rules for PRX-SD to detect threats specific to your environment.
---

# Custom YARA Rules

YARA is a pattern-matching language designed for malware detection. PRX-SD supports loading custom YARA rules alongside its built-in and community rules, allowing you to create detection logic tailored to your specific threat landscape.

## Rule File Location

Place custom YARA rules in the `~/.prx-sd/yara/` directory:

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SD loads all `.yar` and `.yara` files from this directory on startup and during signature updates. Rules are compiled into an optimized cache (`compiled.yarc`) for fast scanning.

::: tip
Subdirectories are supported. Organize rules by category for easier management:
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

## YARA Rule Syntax

A YARA rule consists of three sections: **meta**, **strings**, and **condition**.

### Basic Rule Structure

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

### Key Syntax Elements

| Element | Syntax | Description |
|---------|--------|-------------|
| Hex strings | `{ 4D 5A ?? 00 }` | Byte patterns with wildcards (`??`) |
| Text strings | `"text" ascii` | Plain ASCII strings |
| Wide strings | `"text" wide` | UTF-16LE encoded strings |
| Case-insensitive | `"text" nocase` | Match regardless of case |
| Regex | `/pattern/` | Regular expression patterns |
| Tags | `rule Name : tag1 tag2` | Categorization tags |
| File size | `filesize < 1MB` | Condition on file size |
| Entry point | `entrypoint` | PE/ELF entry point offset |
| At offset | `$str at 0x100` | String at specific offset |
| In range | `$str in (0..1024)` | String within byte range |
| Count | `#str > 3` | Number of string occurrences |

### Severity Levels

PRX-SD reads the `severity` meta field to determine threat classification:

| Severity | PRX-SD Verdict |
|----------|---------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| (not set) | SUSPICIOUS |

## Example Rules

### Detecting a Suspicious Script

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

### Detecting Cryptocurrency Miners

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

### Detecting Webshells

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

## Testing Rules

Validate your rules before deploying:

```bash
# Compile-check a rule file (syntax validation)
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# Test a rule against a specific file
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# Test all custom rules against a directory of samples
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# Dry-run scan using only custom rules
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
Always test new rules against a set of known-clean files to check for false positives before deploying to production monitoring.
:::

## Reloading Rules

After adding or modifying rules, reload without restarting the daemon:

```bash
# Recompile and reload rules
sd yara reload

# If running as daemon, send SIGHUP
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## Contributing Rules

Share your rules with the PRX-SD community:

1. Fork the [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures) repository
2. Add your rule to the appropriate category directory
3. Include comprehensive `meta` fields (author, description, severity, reference)
4. Test against both malicious samples and clean files
5. Submit a pull request with sample hashes for validation

## Next Steps

- [Signature Sources](./sources) -- community and third-party YARA rule sources
- [Import Hashes](./import) -- add hash-based blocklists
- [Update Signatures](./update) -- keep all rules current
- [Threat Intelligence Overview](./index) -- full signature architecture
