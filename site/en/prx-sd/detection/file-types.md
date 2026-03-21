---
title: Supported File Types
description: PRX-SD supported file types matrix. Magic number detection for PE, ELF, Mach-O, PDF, Office, archives, and scripts with recursive archive scanning.
---

# Supported File Types

PRX-SD identifies file types using magic number detection (examining the first bytes of a file) rather than relying on file extensions. This ensures accurate identification even when files are renamed or have missing extensions.

## File Type Matrix

The following table shows all supported file types and which detection layers apply to each:

| File Type | Extensions | Magic Bytes | Hash | YARA | Heuristics | Archive Recursion |
|-----------|------------|-------------|------|------|------------|-------------------|
| **PE (Windows)** | .exe, .dll, .sys, .scr, .ocx | `4D 5A` (MZ) | Yes | Yes | Yes | -- |
| **ELF (Linux)** | .so, .o, (no ext) | `7F 45 4C 46` | Yes | Yes | Yes | -- |
| **Mach-O (macOS)** | .dylib, .bundle, (no ext) | `FE ED FA CE/CF` or `CE FA ED FE/CF` | Yes | Yes | Yes | -- |
| **Universal Binary** | (no ext) | `CA FE BA BE` | Yes | Yes | Yes | -- |
| **PDF** | .pdf | `25 50 44 46` (%PDF) | Yes | Yes | Yes | -- |
| **Office (OLE)** | .doc, .xls, .ppt | `D0 CF 11 E0` | Yes | Yes | Yes | -- |
| **Office (OOXML)** | .docx, .xlsx, .pptx | `50 4B 03 04` (ZIP) + `[Content_Types].xml` | Yes | Yes | Yes | Extracted |
| **ZIP** | .zip | `50 4B 03 04` | Yes | Yes | Limited | Recursive |
| **7-Zip** | .7z | `37 7A BC AF 27 1C` | Yes | Yes | Limited | Recursive |
| **tar** | .tar | `75 73 74 61 72` at offset 257 | Yes | Yes | Limited | Recursive |
| **gzip** | .gz, .tgz | `1F 8B` | Yes | Yes | Limited | Recursive |
| **bzip2** | .bz2 | `42 5A 68` (BZh) | Yes | Yes | Limited | Recursive |
| **xz** | .xz | `FD 37 7A 58 5A 00` | Yes | Yes | Limited | Recursive |
| **RAR** | .rar | `52 61 72 21` (Rar!) | Yes | Yes | Limited | Recursive |
| **CAB** | .cab | `4D 53 43 46` (MSCF) | Yes | Yes | Limited | Recursive |
| **ISO** | .iso | `43 44 30 30 31` at offset 32769 | Yes | Yes | Limited | Recursive |
| **Shell script** | .sh, .bash | `23 21` (#!) | Yes | Yes | Pattern | -- |
| **Python** | .py, .pyc | Text / `42 0D 0D 0A` | Yes | Yes | Pattern | -- |
| **JavaScript** | .js, .mjs | Text detection | Yes | Yes | Pattern | -- |
| **PowerShell** | .ps1, .psm1 | Text detection | Yes | Yes | Pattern | -- |
| **VBScript** | .vbs, .vbe | Text detection | Yes | Yes | Pattern | -- |
| **Batch** | .bat, .cmd | Text detection | Yes | Yes | Pattern | -- |
| **Java** | .class, .jar | `CA FE BA BE` / ZIP | Yes | Yes | Limited | .jar recursive |
| **WebAssembly** | .wasm | `00 61 73 6D` | Yes | Yes | Limited | -- |
| **DEX (Android)** | .dex | `64 65 78 0A` (dex\n) | Yes | Yes | Limited | -- |
| **APK (Android)** | .apk | ZIP + `AndroidManifest.xml` | Yes | Yes | Limited | Recursive |

### Detection Layer Legend

| Layer | Meaning |
|-------|---------|
| **Hash** | SHA-256/MD5 hash checked against signature database |
| **YARA** | Full YARA rule set applied to file contents |
| **Heuristics: Yes** | Full file-type-specific heuristic analysis (see [Heuristics](./heuristics)) |
| **Heuristics: Limited** | Basic entropy and structure checks only |
| **Heuristics: Pattern** | Text-based pattern matching for suspicious commands and obfuscation |
| **Archive Recursion** | Contents are extracted and each file is scanned individually |

## Magic Number Detection

PRX-SD reads the first 8192 bytes of each file to determine its type. This approach is more reliable than extension-based detection:

```
File: invoice.pdf.exe
Extension suggests: PDF
Magic bytes: 4D 5A → PE executable
PRX-SD identifies: PE (correct)
```

::: warning Extension Mismatch
When the file extension does not match the detected magic number, PRX-SD adds a note to the scan report. Extension mismatches are a common social engineering technique (e.g., `photo.jpg.exe`).
:::

### Magic Detection Priority

When multiple signatures could match (e.g., ZIP magic for both .zip and .docx), PRX-SD uses deeper inspection:

1. Read magic bytes at offset 0
2. If ambiguous (e.g., ZIP), inspect internal structure
3. For ZIP-based formats, check for `[Content_Types].xml` (OOXML), `META-INF/MANIFEST.MF` (JAR), `AndroidManifest.xml` (APK)
4. Fall back to the generic container type

## Archive Recursive Scanning

When PRX-SD encounters an archive (ZIP, 7z, tar, gzip, RAR, etc.), it extracts the contents to a temporary directory and scans each file individually through the full detection pipeline.

### Recursion Depth

| Setting | Default | Description |
|---------|---------|-------------|
| `max_archive_depth` | 5 | Maximum nesting levels for archives within archives |
| `max_archive_files` | 10,000 | Maximum files to extract from a single archive |
| `max_archive_size_mb` | 500 | Maximum total extracted size before stopping |

These limits prevent resource exhaustion from zip bombs and deeply nested archives.

```toml
# ~/.config/prx-sd/config.toml
[scanning]
max_archive_depth = 5
max_archive_files = 10000
max_archive_size_mb = 500
```

::: warning Zip Bombs
PRX-SD detects zip bombs (archives with extreme compression ratios) and stops extraction before consuming excessive disk space or memory. A zip bomb detection is reported as `SUSPICIOUS` in the scan results.
:::

### Password-Protected Archives

PRX-SD cannot extract password-protected archives. These are reported as `skipped` in the scan results with a note about the encryption. The archive file itself is still checked against hash and YARA databases.

## Script Detection

For text-based script files (shell, Python, JavaScript, PowerShell, VBScript, batch), PRX-SD applies pattern-based heuristics:

| Pattern | Points | Description |
|---------|--------|-------------|
| Obfuscated strings | 10-20 | Base64-encoded commands, excessive string concatenation |
| Download + execute | 15-25 | `curl/wget` piped to `bash/sh`, `Invoke-WebRequest` + `Invoke-Expression` |
| Reverse shell | 20-30 | Known reverse shell patterns (`/dev/tcp`, `nc -e`, `bash -i`) |
| Credential access | 10-15 | Reading `/etc/shadow`, browser credential stores, keychain |
| Persistence mechanisms | 10-15 | Adding cron jobs, systemd services, registry keys |

## Unsupported Files

Files that do not match any known magic number are still checked against hash and YARA databases. Heuristic analysis is not applied to unknown file types. Common examples:

- Raw binary data
- Proprietary formats without public magic numbers
- Encrypted files (unless the container format is recognized)

These files appear as `type: unknown` in scan reports and receive hash + YARA scanning only.

## Next Steps

- [Heuristic Analysis](./heuristics) -- Detailed heuristic checks per file type
- [YARA Rules](./yara-rules) -- Rules that target specific file format structures
- [File & Directory Scanning](../scanning/file-scan) -- Scanning files in practice
- [Detection Engine Overview](./index) -- How all layers work together
