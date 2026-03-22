---
title: საფრთხის ინტელექტის მიმოხილვა
description: PRX-SD-ის სიგნატურების მონაცემთა ბაზის არქიტექტურა, ჰეშ-სიგნატურების, YARA წესების, IOC feed-ებისა და ClamAV ინტეგრაციის ჩათვლით.
---

# საფრთხის ინტელექტის მიმოხილვა

PRX-SD საფრთხის ინტელექტს მრავალი ღია კოდისა და საზოგადოების წყაროდან ერთიანი ლოკალური მონაცემთა ბაზაში აგროვებს. ეს მრავალ შრეიანი მიდგომა ფართო გადაფარვას უზრუნველყოფს -- ცნობილი მავნე პროგრამის ჰეშებიდან ქცევითი შაბლონ-წესებამდე ქსელ-კომპრომისის ინდიკატორებამდე.

## სიგნატურების კატეგორიები

PRX-SD საფრთხის ინტელექტს ოთხ კატეგორიად აწყობს:

| კატეგორია | წყაროები | რაოდენობა | ძებნის სიჩქარე | შენახვა |
|----------|---------|-------|-------------|---------|
| **ჰეშ-სიგნატურები** | 7 წყარო | მილიონობით SHA-256/MD5 | O(1) LMDB-ით | ~500 MB |
| **YARA წესები** | 8 წყარო | 38,800+ წესი | შაბლონ-შეჯამება | ~15 MB |
| **IOC Feed-ები** | 5 წყარო | 585,000+ ინდიკატორი | Trie / hash map | ~25 MB |
| **ClamAV მონაცემთა ბაზა** | 1 წყარო | 11,000,000+ სიგნატურა | ClamAV ძრავა | ~300 MB |

### ჰეშ-სიგნატურები

ყველაზე სწრაფი გამოვლენის შრე. სკანირებისას ყოველი ფაილი ჰეშდება და ლოკალური LMDB მონაცემთა ბაზის ცნობილ-მავნე ჰეშებთან მოწმდება:

- **abuse.ch MalwareBazaar** -- ბოლო მავნე პროგრამის ნიმუშების SHA-256 ჰეშები (48 საათის rolling window)
- **abuse.ch URLhaus** -- მავნე URL-ებით გავრცელებული ფაილების SHA-256 ჰეშები
- **abuse.ch Feodo Tracker** -- საბანკო ტროიანების SHA-256 ჰეშები (Emotet, Dridex, TrickBot)
- **abuse.ch ThreatFox** -- საზოგადოების სუბმისიებიდან SHA-256 IOC-ები
- **abuse.ch SSL Blacklist** -- მავნე SSL სერტიფიკატების SHA-1 ანაბეჭდები
- **VirusShare** -- 20,000,000+ MD5 ჰეში (`--full` განახლებით ხელმისაწვდომი)
- **ჩაშენებული blocklist** -- EICAR ტესტ-ფაილის, WannaCry, NotPetya, Emotet-ისთვის hardcoded ჰეშები

### YARA წესები

შაბლონ-შეჯამების წესები, რომლებიც მავნე პროგრამას ზუსტი ჰეშების ნაცვლად კოდ-შაბლონებით, სტრინგებითა და სტრუქტურით ადგენს. ეს მავნე პროგრამის ვარიანტებსა და ოჯახებს იჭერს:

- **ჩაშენებული წესები** -- 64 გამოსწვრილი წესი გამოსასყიდისთვის, ტროიანებისთვის, backdoor-ებისთვის, rootkit-ებისთვის, miner-ებისთვის, webshell-ებისთვის
- **Yara-Rules/rules** -- საზოგადოების მართული წესები Emotet, TrickBot, CobaltStrike, Mirai, LockBit-ისთვის
- **Neo23x0/signature-base** -- მაღალი ხარისხის წესები APT29, Lazarus, კრიპტო-mining, webshell-ებისთვის
- **ReversingLabs YARA** -- კომერციული კლასის ღია კოდის წესები ტროიანებისთვის, გამოსასყიდისთვის, backdoor-ებისთვის
- **ESET IOC** -- APT-ის თვალთვალის წესები Turla, Interception და სხვა მაღალი დონის საფრთხეებისთვის
- **InQuest** -- სპეციალიზებული წესები მავნე დოკუმენტებისთვის (OLE, DDE exploits)
- **Elastic Security** -- Elastic-ის საფრთხეების კვლევის გუნდის გამოვლენის წესები
- **Google GCTI** -- Google Cloud Threat Intelligence-ის YARA წესები

### IOC Feed-ები

ქსელ-კომპრომისის ინდიკატორები ცნობილ-მავნე ინფრასტრუქტურასთან კავშირის გამოსავლენად:

- **IPsum** -- შეგროვებული მავნე IP-ის რეპუტაციის სია (მრავალ-წყაროიანი ქულება)
- **FireHOL** -- სხვადასხვა საფრთხის დონეზე კურირებული IP blocklist-ები
- **Emerging Threats** -- IP/დომენ IOC-ებად გადაყვანილი Suricata/Snort წესები
- **SANS ISC** -- Internet Storm Center-ის ყოველდღიური საეჭვო IP feed-ები
- **URLhaus** -- ფიშინგის, მავნე პროგრამის გავრცელებისთვის აქტიური მავნე URL-ები

### ClamAV მონაცემთა ბაზა

სურვილისამებრ ინტეგრაცია ClamAV ვირუსების მონაცემთა ბაზასთან, რომელიც ღია კოდის ყველაზე დიდ სიგნატურულ ნაკრებს გვთავაზობს:

- **main.cvd** -- ძირითადი ვირუსის სიგნატურები
- **daily.cvd** -- ყოველდღიურად განახლებული სიგნატურები
- **bytecode.cvd** -- bytecode გამოვლენის სიგნატურები

## მონაცემთა დირექტორიის სტრუქტურა

ყველა სიგნატურის მონაცემი `~/.prx-sd/signatures/`-ში ინახება:

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOCs
    virusshare.lmdb           # VirusShare MD5 (--full only)
    custom.lmdb               # User-imported hashes
  yara/
    builtin/                  # Built-in rules (shipped with binary)
    community/                # Downloaded community rules
    custom/                   # User-written custom rules
    compiled.yarc             # Pre-compiled rule cache
  ioc/
    ipsum.dat                 # IPsum IP reputation
    firehol.dat               # FireHOL blocklists
    et_compromised.dat        # Emerging Threats IPs
    sans_isc.dat              # SANS ISC suspicious IPs
    urlhaus_urls.dat          # URLhaus malicious URLs
  clamav/
    main.cvd                  # ClamAV main signatures
    daily.cvd                 # ClamAV daily updates
    bytecode.cvd              # ClamAV bytecode sigs
  metadata.json               # Update timestamps and version info
```

::: tip
ყველა სიგნატურ-მონაცემთა ბაზის მიმდინარე მდგომარეობის, წყაროების რაოდენობის, ბოლო განახლების დროებისა და disk-ის გამოყენების სანახავად `sd info`-ს გამოყენება.
:::

## სიგნატურ-სტატუსის მოთხოვნა

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

## შემდეგი ნაბიჯები

- [სიგნატურების განახლება](./update) -- მონაცემთა ბაზების სიახლის შენარჩუნება
- [სიგნატურების წყაროები](./sources) -- ყოველი წყაროს დეტალური ინფორმაცია
- [ჰეშ-იმპორტი](./import) -- საკუთარი ჰეშ-blocklist-ების დამატება
- [მომხმარებლის YARA წესები](./custom-rules) -- მომხმარებლის წესების დაწერა და deploy
