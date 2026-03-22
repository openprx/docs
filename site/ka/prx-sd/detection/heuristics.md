---
title: ევრისტიკული ანალიზი
description: PRX-SD-ის ევრისტიკული ძრავა PE, ELF, Mach-O, Office და PDF ფაილებზე ფაილის ტიპის მიხედვით ქცევის ანალიზს ახორციელებს უცნობი საფრთხეების გამოსავლენად.
---

# ევრისტიკული ანალიზი

ევრისტიკული ანალიზი PRX-SD-ის გამოვლენის კონვეიერის მესამე შრეა. ჰეშ-შეჯამება და YARA წესები ცნობილ სიგნატურებსა და შაბლონებს ეყრდნობა, ხოლო ევრისტიკა ფაილის **სტრუქტურულ და ქცევით თვისებებს** აანალიზებს, რათა გამოავლინოს საფრთხეები, რომლებიც არასდროს ყოფილა ნანახი -- ნულოვანი-დღის მავნე პროგრამის, მომხმარებლის implant-ებისა და ძლიერ ობფუსცირებული ნიმუშების ჩათვლით.

## როგორ მუშაობს

PRX-SD ჯერ ფაილის ტიპს მაგიური ნომრის გამოვლენის გამოყენებით ადგენს, შემდეგ კი ევრისტიკული შემოწმებების სერიას ახორციელებს, ამ ფაილის ფორმატისთვის სპეციფიურს. ყოველი ჩართული შემოწმება კუმულატიური ქულისთვის ქულებს ამატებს. საბოლოო ქულა განაჩენს განსაზღვრავს.

### ქულათა მექანიზმი

| ქულის დიაპაზონი | განაჩენი | მნიშვნელობა |
|-------------|---------|---------|
| 0 - 29 | **სუფთა** | მნიშვნელოვანი საეჭვო ინდიკატორები არ არის |
| 30 - 59 | **საეჭვო** | ანომალიები გამოვლინდა; ხელით გადამოწმება რეკომენდებულია |
| 60 - 100 | **მავნე** | მაღალი სიზუსტის საფრთხე; მრავლობითი ძლიერი ინდიკატორები |

ქულები ადიტიურია. ფაილს ერთი მცირე ანომალიით (მაგ., ოდნავ მაღალი ენტროპია) შეიძლება 15 ქულა ჰქონდეს, ხოლო მაღალი ენტროპიის, საეჭვო API import-ებისა და შეფუთვის სიგნატურების კომბინაციის ფაილს 75+ ქულა ჰქონდეს.

## PE (Windows-ის შესასრულებელი) ანალიზი

PE ევრისტიკა Windows-ის შესასრულებლებს (.exe, .dll, .scr, .sys) მიზნად ისახავს:

| შემოწმება | ქულები | აღწერა |
|-------|--------|-------------|
| მაღალი განყოფილების ენტროპია | 10-25 | >7.0 ენტროპიის განყოფილებები შეფუთვას ან დაშიფვრას მიუთითებს |
| საეჭვო API import-ები | 5-20 | `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread` მსგავსი API-ები |
| ცნობილი შეფუთვის სიგნატურები | 15-25 | UPX, Themida, VMProtect, ASPack, PECompact header-ები გამოვლინდა |
| Timestamp-ის ანომალია | 5-10 | სამომავლო ან 2000-მდე კომპილაციის timestamp |
| განყოფილების სახელის ანომალია | 5-10 | არასტანდარტული განყოფილების სახელები (`.rsrc` შეცვლილი, შემთხვევითი სტრინგები) |
| რესურსის ანომალია | 5-15 | PE ფაილები, ჩაშენებული რესურსებში, დაშიფრული რესურსების განყოფილებები |
| Import ცხრილის ანომალია | 10-15 | ძალიან ცოტა import-ი (შეფუთული), ან საეჭვო import-ის კომბინაციები |
| ციფრული სიგნატურა | -10 | სწორი Authenticode სიგნატურა ქულას ამცირებს |
| TLS callback-ები | 10 | Anti-debug TLS callback ჩანაწერები |
| Overlay მონაცემები | 5-10 | PE სტრუქტურის შემდეგ დამატებული მნიშვნელოვანი მონაცემები |

### PE-ის შედეგების მაგალითი

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

## ELF (Linux-ის შესასრულებელი) ანალიზი

ELF ევრისტიკა Linux-ის ბინარებსა და shared object-ებს მიზნად ისახავს:

| შემოწმება | ქულები | აღწერა |
|-------|--------|-------------|
| მაღალი განყოფილების ენტროპია | 10-25 | >7.0 ენტროპიის განყოფილებები |
| LD_PRELOAD მინიშნებები | 15-20 | `LD_PRELOAD`-ზე ან `/etc/ld.so.preload`-ზე მიმართული სტრინგები |
| Cron persistence | 10-15 | `/etc/crontab`-ზე, `/var/spool/cron`-ზე, cron დირექტორიებზე მინიშნებები |
| Systemd persistence | 10-15 | systemd unit-ის გზებზე, `systemctl enable`-ზე მინიშნებები |
| SSH backdoor ინდიკატორები | 15-20 | შეცვლილი `authorized_keys` გზები, `sshd` კონფიგ-სტრინგები |
| Anti-debugging | 10-15 | `ptrace(PTRACE_TRACEME)`, `/proc/self/status` შემოწმებები |
| ქსელური ოპერაციები | 5-10 | Raw socket შექმნა, საეჭვო პორტ-ბაინდინგები |
| Self-deletion | 10 | საკუთარი ბინარის გზის შესრულების შემდეგ `unlink` |
| Stripped + მაღალი ენტროპია | 10 | Stripped ბინარი მაღალი ენტროპიით შეფუთულ მავნე პროგრამას მიუთითებს |
| `/dev/null` redirect | 5 | `/dev/null`-ზე გამოტანის გადამისამართება (daemon ქცევა) |

### ELF-ის შედეგების მაგალითი

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

## Mach-O (macOS შესასრულებელი) ანალიზი

Mach-O ევრისტიკა macOS-ის ბინარებს, bundle-ებსა და universal binary-ებს მიზნად ისახავს:

| შემოწმება | ქულები | აღწერა |
|-------|--------|-------------|
| მაღალი განყოფილების ენტროპია | 10-25 | >7.0 ენტროპიის განყოფილებები |
| Dylib ინექცია | 15-20 | `DYLD_INSERT_LIBRARIES` მინიშნებები, საეჭვო dylib ჩატვირთვა |
| LaunchAgent/Daemon persistence | 10-15 | `~/Library/LaunchAgents`-ზე, `/Library/LaunchDaemons`-ზე მინიშნებები |
| Keychain წვდომა | 10-15 | Keychain API გამოძახებები, `security` ბრძანების გამოყენება |
| Gatekeeper bypass | 10-15 | `xattr -d com.apple.quarantine` სტრინგები |
| Privacy TCC bypass | 10-15 | TCC მონაცემთა ბაზაზე, accessibility API ბოროტად გამოყენებაზე მინიშნებები |
| Anti-analysis | 10 | debugger-ების `sysctl` შემოწმებები, VM-ის გამოვლენის სტრინგები |
| კოდ-სიგნინგის ანომალია | 5-10 | Ad-hoc signed ან unsigned ბინარი |

### Mach-O-ს შედეგების მაგალითი

```
Heuristic Analysis: com.apple.helper
Score: 55/100 [SUSPICIOUS]

Findings:
  [+20] Dylib injection: DYLD_INSERT_LIBRARIES manipulation
  [+15] LaunchAgent persistence: writes to ~/Library/LaunchAgents/
  [+10] Keychain access: SecKeychainFindGenericPassword calls
  [+10] Unsigned binary: no code signature present
```

## Office დოკუმენტის ანალიზი

Office ევრისტიკა Microsoft Office ფორმატებს (.doc, .docx, .xls, .xlsx, .ppt) მიზნად ისახავს:

| შემოწმება | ქულები | აღწერა |
|-------|--------|-------------|
| VBA macro-ების არსებობა | 10-15 | ავტო-შესრულების macro-ები (`AutoOpen`, `Document_Open`, `Workbook_Open`) |
| Shell შესრულების Macro | 20-30 | macro-ებში `Shell()`, `WScript.Shell`, `PowerShell`-ის გამოძახება |
| DDE ველები | 15-20 | ბრძანებების შემსრულებელი Dynamic Data Exchange ველები |
| გარე შაბლონის ბმული | 10-15 | `attachedTemplate`-ის საშუალებით დამფ-ის remote template ინექცია |
| ობფუსცირებული VBA | 10-20 | ძლიერ ობფუსცირებული macro კოდი (Chr(), სტრინგის კონკატენაციის ბოროტად გამოყენება) |
| ჩაშენებული OLE ობიექტები | 5-10 | OLE ობიექტების სახით ჩაშენებული შესასრულებლები ან სკრიპტები |
| საეჭვო მეტამონაცემები | 5 | base64 სტრინგებით ან უჩვეულო შაბლონებით ავტორის ველები |

### Office-ის შედეგების მაგალითი

```
Heuristic Analysis: Q3_Report.xlsm
Score: 60/100 [MALICIOUS]

Findings:
  [+15] VBA macro with AutoOpen trigger
  [+25] Macro executes: Shell("powershell -enc JABjAGwA...")
  [+10] Obfuscated VBA: 47 Chr() calls, string concatenation abuse
  [+10] External template: https://evil.example.com/template.dotm
```

## PDF ანალიზი

PDF ევრისტიკა PDF დოკუმენტებს მიზნად ისახავს:

| შემოწმება | ქულები | აღწერა |
|-------|--------|-------------|
| ჩაშენებული JavaScript | 15-25 | JavaScript `/JS` ან `/JavaScript` ქმედებებში |
| Launch ქმედება | 20-25 | სისტემური ბრძანებების შემსრულებელი `/Launch` ქმედება |
| URI ქმედება | 5-10 | ცნობილ მავნე შაბლონებზე მიმართული საეჭვო URI ქმედებები |
| ობფუსცირებული ნაკადები | 10-15 | მრავლობითი encoding შრეები (FlateDecode + ASCII85 + hex) |
| ჩაშენებული ფაილები | 5-10 | დანართებად ჩაშენებული შესასრულებელი ფაილები |
| ფორმის გაგზავნა | 5-10 | გარე URL-ებზე მონაცემების გამაგზავნელი ფორმები |
| AcroForm JavaScript-ით | 15 | ჩაშენებული JavaScript-ით ინტერაქტიული ფორმები |

### PDF-ის შედეგების მაგალითი

```
Heuristic Analysis: shipping_label.pdf
Score: 45/100 [SUSPICIOUS]

Findings:
  [+20] Embedded JavaScript: 3 /JS actions found
  [+15] Obfuscated stream: triple-encoded FlateDecode chain
  [+10] Embedded file: invoice.exe (PE executable)
```

## გავრცელებული შედეგების ცნობარი

შემდეგი ცხრილი ყველა ფაილის ტიპზე ყველაზე ხშირად გამოვლინებული ევრისტიკული შედეგების სიას წარმოადგენს:

| შედეგი | სიმძიმე | ფაილის ტიპები | False Positive-ების კოეფიციენტი |
|---------|----------|------------|---------------------|
| მაღალი ენტროპიის განყოფილება | საშუალო | PE, ELF, Mach-O | დაბალი-საშუალო (თამაშის asset-ები, კომპრესირებული მონაცემები) |
| შეფუთვის გამოვლენა | მაღალი | PE | ძალიან დაბალი |
| ავტო-შესრულების macro | მაღალი | Office | დაბალი (ზოგი ლეგიტიმური macro) |
| LD_PRELOAD მანიპულაცია | მაღალი | ELF | ძალიან დაბალი |
| ჩაშენებული JavaScript | საშუალო-მაღალი | PDF | დაბალი |
| საეჭვო API import-ები | საშუალო | PE | საშუალო (უსაფრთხოების ხელსაწყოები ამ შეჯამებას ახდენს) |
| Self-deletion | მაღალი | ELF | ძალიან დაბალი |

::: tip False Positive-ების შემცირება
თუ ლეგიტიმური ფაილი ევრისტიკულ გაფრთხილებებს ააქტიურებს, SHA-256 ჰეშით allowlist-ში შეგიძლიათ დაამატოთ:
```bash
sd allowlist add /path/to/legitimate/file
```
Allowlist-ში ჩართული ფაილები ევრისტიკულ ანალიზს გამოტოვებს, მაგრამ ჰეშ- და YARA მონაცემთა ბაზებისთვის მაინც შემოწმდება.
:::

## შემდეგი ნაბიჯები

- [მხარდაჭერილი ფაილის ტიპები](./file-types) -- ფაილის ფორმატის სრული მატრიცა და მაგიური გამოვლენის დეტალები
- [YARA წესები](./yara-rules) -- ევრისტიკის შემავსებელი შაბლონ-ზე დაფუძნებული გამოვლენა
- [ჰეშ-შეჯამება](./hash-matching) -- ყველაზე სწრაფი გამოვლენის შრე
- [გამოვლენის ძრავის მიმოხილვა](./index) -- ყველა შრის ერთობლივი მუშაობა
