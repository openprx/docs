---
title: Heuristic Analysis
description: PRX-SD heuristic engine performs file-type-aware behavioral analysis on PE, ELF, Mach-O, Office, and PDF files to detect unknown threats.
---

# Heuristic Analysis

Heuristic analysis is the third layer in the PRX-SD detection pipeline. While hash matching and YARA rules rely on known signatures and patterns, heuristics analyze the **structural and behavioral properties** of a file to detect threats that have never been seen before -- including zero-day malware, custom implants, and heavily obfuscated samples.

## How It Works

PRX-SD first identifies the file type using magic number detection, then applies a set of targeted heuristic checks specific to that file format. Each check that triggers adds points to a cumulative score. The final score determines the verdict.

### Scoring Mechanism

| Score Range | Verdict | Meaning |
|-------------|---------|---------|
| 0 - 29 | **Clean** | No significant suspicious indicators |
| 30 - 59 | **Suspicious** | Some anomalies detected; manual review recommended |
| 60 - 100 | **Malicious** | High confidence threat; multiple strong indicators |

Scores are additive. A file with one minor anomaly (e.g., slightly high entropy) might score 15, while a file combining high entropy, suspicious API imports, and packer signatures would score 75+.

## PE (Windows Executable) Analysis

PE heuristics target Windows executables (.exe, .dll, .scr, .sys):

| Check | Points | Description |
|-------|--------|-------------|
| High section entropy | 10-25 | Sections with entropy > 7.0 indicate packing or encryption |
| Suspicious API imports | 5-20 | APIs like `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread` |
| Known packer signatures | 15-25 | UPX, Themida, VMProtect, ASPack, PECompact headers detected |
| Timestamp anomaly | 5-10 | Compilation timestamp in the future or before 2000 |
| Section name anomaly | 5-10 | Non-standard section names (`.rsrc` replaced, random strings) |
| Resource anomaly | 5-15 | Embedded PE files in resources, encrypted resource sections |
| Import table anomaly | 10-15 | Very few imports (packed), or suspicious import combinations |
| Digital signature | -10 | Valid Authenticode signature reduces score |
| TLS callbacks | 10 | Anti-debug TLS callback entries |
| Overlay data | 5-10 | Significant data appended after the PE structure |

### Example PE Findings

```
Heuristic Analysis: updater.exe
Score: 72/100 [MALICIOUS]

Findings:
  [+25] Section '.text' entropy: 7.91 (likely packed or encrypted)
  [+15] Packer detected: UPX 3.96
  [+12] Suspicious API imports: VirtualAllocEx, WriteProcessMemory,
        CreateRemoteThread, NtUnmapViewOfSection
  [+10] Section name anomaly: '.UPX0', '.UPX1' (non-standard)
  [+10] Compilation timestamp: 2089-01-01 (future date)
```

## ELF (Linux Executable) Analysis

ELF heuristics target Linux binaries and shared objects:

| Check | Points | Description |
|-------|--------|-------------|
| High section entropy | 10-25 | Sections with entropy > 7.0 |
| LD_PRELOAD references | 15-20 | Strings referencing `LD_PRELOAD` or `/etc/ld.so.preload` |
| Cron persistence | 10-15 | References to `/etc/crontab`, `/var/spool/cron`, cron directories |
| Systemd persistence | 10-15 | References to systemd unit paths, `systemctl enable` |
| SSH backdoor indicators | 15-20 | Modified `authorized_keys` paths, `sshd` config strings |
| Anti-debugging | 10-15 | `ptrace(PTRACE_TRACEME)`, `/proc/self/status` checks |
| Network operations | 5-10 | Raw socket creation, suspicious port bindings |
| Self-deletion | 10 | `unlink` of own binary path after execution |
| Stripped + high entropy | 10 | Stripped binary with high entropy suggests packed malware |
| `/dev/null` redirect | 5 | Redirecting output to `/dev/null` (daemon behavior) |

### Example ELF Findings

```
Heuristic Analysis: .cache/systemd-helper
Score: 65/100 [MALICIOUS]

Findings:
  [+20] LD_PRELOAD reference: /etc/ld.so.preload manipulation
  [+15] Cron persistence: writes to /var/spool/cron/root
  [+15] SSH backdoor: modifies /root/.ssh/authorized_keys
  [+10] Self-deletion: unlinks /tmp/.cache/systemd-helper
  [+5]  Network: creates raw socket
```

## Mach-O (macOS Executable) Analysis

Mach-O heuristics target macOS binaries, bundles, and universal binaries:

| Check | Points | Description |
|-------|--------|-------------|
| High section entropy | 10-25 | Sections with entropy > 7.0 |
| Dylib injection | 15-20 | `DYLD_INSERT_LIBRARIES` references, suspicious dylib loading |
| LaunchAgent/Daemon persistence | 10-15 | References to `~/Library/LaunchAgents`, `/Library/LaunchDaemons` |
| Keychain access | 10-15 | Keychain API calls, `security` command usage |
| Gatekeeper bypass | 10-15 | `xattr -d com.apple.quarantine` strings |
| Privacy TCC bypass | 10-15 | References to TCC database, accessibility API abuse |
| Anti-analysis | 10 | `sysctl` checks for debuggers, VM detection strings |
| Code signing anomaly | 5-10 | Ad-hoc signed or unsigned binary |

### Example Mach-O Findings

```
Heuristic Analysis: com.apple.helper
Score: 55/100 [SUSPICIOUS]

Findings:
  [+20] Dylib injection: DYLD_INSERT_LIBRARIES manipulation
  [+15] LaunchAgent persistence: writes to ~/Library/LaunchAgents/
  [+10] Keychain access: SecKeychainFindGenericPassword calls
  [+10] Unsigned binary: no code signature present
```

## Office Document Analysis

Office heuristics target Microsoft Office formats (.doc, .docx, .xls, .xlsx, .ppt):

| Check | Points | Description |
|-------|--------|-------------|
| VBA macros present | 10-15 | Auto-execute macros (`AutoOpen`, `Document_Open`, `Workbook_Open`) |
| Macro with shell execution | 20-30 | `Shell()`, `WScript.Shell`, `PowerShell` invocation in macros |
| DDE fields | 15-20 | Dynamic Data Exchange fields that execute commands |
| External template link | 10-15 | Remote template injection via `attachedTemplate` |
| Obfuscated VBA | 10-20 | Heavily obfuscated macro code (Chr(), string concatenation abuse) |
| Embedded OLE objects | 5-10 | Embedded executables or scripts as OLE objects |
| Suspicious metadata | 5 | Author fields with base64 strings or unusual patterns |

### Example Office Findings

```
Heuristic Analysis: Q3_Report.xlsm
Score: 60/100 [MALICIOUS]

Findings:
  [+15] VBA macro with AutoOpen trigger
  [+25] Macro executes: Shell("powershell -enc JABjAGwA...")
  [+10] Obfuscated VBA: 47 Chr() calls, string concatenation abuse
  [+10] External template: https://evil.example.com/template.dotm
```

## PDF Analysis

PDF heuristics target PDF documents:

| Check | Points | Description |
|-------|--------|-------------|
| Embedded JavaScript | 15-25 | JavaScript in `/JS` or `/JavaScript` actions |
| Launch action | 20-25 | `/Launch` action that executes system commands |
| URI action | 5-10 | Suspicious URI actions pointing to known bad patterns |
| Obfuscated streams | 10-15 | Multiple encoding layers (FlateDecode + ASCII85 + hex) |
| Embedded files | 5-10 | Executable files embedded as attachments |
| Form submission | 5-10 | Forms that submit data to external URLs |
| AcroForm with JavaScript | 15 | Interactive forms with embedded JavaScript |

### Example PDF Findings

```
Heuristic Analysis: shipping_label.pdf
Score: 45/100 [SUSPICIOUS]

Findings:
  [+20] Embedded JavaScript: 3 /JS actions found
  [+15] Obfuscated stream: triple-encoded FlateDecode chain
  [+10] Embedded file: invoice.exe (PE executable)
```

## Common Findings Reference

The following table lists the most frequently triggered heuristic findings across all file types:

| Finding | Severity | File Types | False Positive Rate |
|---------|----------|------------|---------------------|
| High entropy section | Medium | PE, ELF, Mach-O | Low-Medium (game assets, compressed data) |
| Packer detection | High | PE | Very Low |
| Auto-execute macro | High | Office | Low (some legitimate macros) |
| LD_PRELOAD manipulation | High | ELF | Very Low |
| Embedded JavaScript | Medium-High | PDF | Low |
| Suspicious API imports | Medium | PE | Medium (security tools trigger this) |
| Self-deletion | High | ELF | Very Low |

::: tip Reducing False Positives
If a legitimate file triggers heuristic alerts, you can add it to the allowlist by SHA-256 hash:
```bash
sd allowlist add /path/to/legitimate/file
```
Allowlisted files skip heuristic analysis but are still checked against hash and YARA databases.
:::

## Next Steps

- [Supported File Types](./file-types) -- Full file type matrix and magic detection details
- [YARA Rules](./yara-rules) -- Pattern-based detection that complements heuristics
- [Hash Matching](./hash-matching) -- The fastest detection layer
- [Detection Engine Overview](./index) -- How all layers work together
