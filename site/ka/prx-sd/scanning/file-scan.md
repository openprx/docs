---
title: ფაილებისა და დირექტორიების სკანირება
description: "sd scan ბრძანების სრული ცნობარი. ფაილებისა და დირექტორიების სკანირება მავნე პროგრამებზე ჰეშ-შეჯამებით, YARA წესებითა და ევრისტიკული ანალიზით."
---

# ფაილებისა და დირექტორიების სკანირება

`sd scan` ბრძანება ფაილებისა და დირექტორიების მავნე პროგრამებზე შემოწმების მთავარი საშუალებაა. ის ყოველ ფაილს მრავალ შრეიანი გამოვლენის კონვეიერში -- ჰეშ-შეჯამება, YARA წესები და ევრისტიკული ანალიზი -- ატარებს და ყოველი ფაილისთვის განაჩენს ავარტა.

## საბაზისო გამოყენება

ერთი ფაილის სკანირება:

```bash
sd scan /path/to/file
```

დირექტორიის სკანირება (ნაგულისხმევად არა-რეკურსიული):

```bash
sd scan /home/user/downloads
```

დირექტორიისა და ყველა ქვე-დირექტორიის სკანირება:

```bash
sd scan /home --recursive
```

## ბრძანების პარამეტრები

| პარამეტრი | მოკლე | ნაგულისხმევი | აღწერა |
|--------|-------|---------|-------------|
| `--recursive` | `-r` | გამორთ. | ქვე-დირექტორიებში შესვლა |
| `--json` | `-j` | გამორთ. | შედეგების JSON ფორმატში გამოტანა |
| `--threads` | `-t` | CPU ბირთვები | პარალელური სკანირების ნაკადების რაოდენობა |
| `--auto-quarantine` | `-q` | გამორთ. | გამოვლენილი საფრთხეების ავტომატური კარანტინიზება |
| `--remediate` | | გამორთ. | ავტომატური remediation-ის მცდელობა (პოლიტიკის მიხედვით წაშლა/კარანტინი) |
| `--exclude` | `-e` | არცერთი | ფაილების ან დირექტორიების გამოსართავი glob შაბლონი |
| `--report` | | არცერთი | სკანირების ანგარიშის ფაილის გზაზე ჩაწერა |
| `--max-size-mb` | | 100 | ამ ზომაზე (მეგაბაიტი) დიდი ფაილების გამოტოვება |
| `--no-yara` | | გამორთ. | YARA წესების სკანირების გამოტოვება |
| `--no-heuristics` | | გამორთ. | ევრისტიკული ანალიზის გამოტოვება |
| `--min-severity` | | `suspicious` | მინიმალური სიმძიმე ანგარიშისთვის (`suspicious` ან `malicious`) |

## გამოვლენის ნაკადი

`sd scan`-ის მიერ ფაილის დამუშავებისას ის გამოვლენის კონვეიერში ამ თანმიმდევრობით გადის:

```
File → Magic Number Detection → Determine File Type
  │
  ├─ Layer 1: SHA-256 Hash Lookup (LMDB)
  │   Hit → MALICIOUS (instant, ~1μs per file)
  │
  ├─ Layer 2: YARA-X Rule Scan (38,800+ rules)
  │   Hit → MALICIOUS with rule name
  │
  ├─ Layer 3: Heuristic Analysis (file-type-aware)
  │   Score ≥ 60 → MALICIOUS
  │   Score 30-59 → SUSPICIOUS
  │   Score < 30 → CLEAN
  │
  └─ Result Aggregation → highest severity wins
```

კონვეიერი short-circuit-ს ახდენს: ჰეშ-შეჯამების პოვნისას ამ ფაილისთვის YARA და ევრისტიკული ანალიზი გამოტოვდება. ეს დიდი დირექტორიების სკანირებას სწრაფს ხდის -- ყველაზე სუფთა ფაილი ჰეშ-შრეზე მიკროწამებში გადაჭრა.

## გამოტანის ფორმატები

### ადამიანისთვის წასაკითხი (ნაგულისხმევი)

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### JSON გამოტანა

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### ანგარიშის ფაილი

შედეგების არქივირებისთვის ფაილში ჩაწერა:

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## გამორიცხვის შაბლონები

glob შაბლონების შემჯამებელი ფაილების ან დირექტორიების გამოსართავად `--exclude`-ის გამოყენება. მრავალი შაბლონის მითითება შეიძლება:

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip წარმადობა
`node_modules`, `.git` და ვირტუალური მანქანის სურათების მსგავსი დიდი დირექტორიების გამორიცხვა სკანირების სიჩქარეს მნიშვნელოვნად ზრდის.
:::

## ავტო-კარანტინიზება

`--auto-quarantine` ნიშანი სკანირებისას გამოვლენილ საფრთხეებს კარანტინის ვოლტში გადაიტანს:

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

კარანტინიზებული ფაილები AES-256-ით დაშიფრულია და `~/.local/share/prx-sd/quarantine/`-ში ინახება. მათი შემთხვევით შესრულება შეუძლებელია. დეტალებისთვის იხილეთ [კარანტინის დოკუმენტაცია](../quarantine/).

## გამოყენების სცენარები

### CI/CD კონვეიერის სკანი

Build არტეფაქტების სკანირება deploy-მდე:

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

ავტომატიზაციისთვის გასვლის კოდის გამოყენება: `0` = სუფთა, `1` = საფრთხეები ნაპოვნია, `2` = სკანირების შეცდომა.

### ვებ-სერვერის ყოველდღიური სკანი

ვებ-ხელმისაწვდომი დირექტორიების ღამის სკანირების დაგეგმვა:

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### სასამართლო გამოძიება

მხოლოდ-წასაკითხ რეჟიმში დამაგრებული disk image-ის სკანირება:

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning დიდი სკანირებები
მილიონობით ფაილის სკანირებისას `--threads`-ით რესურსების გამოყენება გააკონტროლეთ და `--max-size-mb`-ით სკანირების შენელებადი ზემოდიდი ფაილები გამოტოვეთ.
:::

### სახლის დირექტორიის სწრაფი შემოწმება

გავრცელებული საფრთხის ადგილების სწრაფი სკანი:

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## წარმადობის დარეგულირება

| ფაილები | სავარაუდო დრო | შენიშვნები |
|-------|-------------------|-------|
| 1,000 | < 1 წამი | ჰეშ-შრე უმეტეს ფაილს წყვეტს |
| 10,000 | 2-5 წამი | YARA წესები ფაილზე ~0.3 მწმ-ს ამატებს |
| 100,000 | 20-60 წამი | ფაილის ზომებსა და ტიპებზეა დამოკიდებული |
| 1,000,000+ | 5-15 წუთი | `--threads` და `--exclude`-ის გამოყენება |

სკანირების სიჩქარეზე მოქმედი ფაქტორები:

- **Disk I/O** -- SSD HDD-ზე 5-10x სწრაფია random წაკითხვებისთვის
- **ფაილის ზომების განაწილება** -- ბევრი მცირე ფაილი რამდენიმე დიდზე სწრაფია
- **გამოვლენის შრეები** -- მხოლოდ-ჰეშ სკანირებები (`--no-yara --no-heuristics`) ყველაზე სწრაფია
- **ნაკადების რაოდენობა** -- მეტი ნაკადი სწრაფ შენახვის მქონე მრავალბირთვიან სისტემებზე ეხმარება

## შემდეგი ნაბიჯები

- [მეხსიერების სკანირება](./memory-scan) -- პროცესის მეხსიერების სკანირება
- [Rootkit-ის გამოვლენა](./rootkit) -- ბირთვ-დონის საფრთხეების შემოწმება
- [USB სკანირება](./usb-scan) -- მოსახსნელი მედიის სკანირება
- [გამოვლენის ძრავა](../detection/) -- ყოველი გამოვლენის შრის მუშაობა
