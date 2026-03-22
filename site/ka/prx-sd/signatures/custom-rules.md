---
title: მომხმარებლის YARA წესები
description: PRX-SD-ისთვის თქვენს გარემოში სპეციფიკური საფრთხეების გამოსავლენი მომხმარებლის YARA წესების დაწერა, ტესტირება და deploy.
---

# მომხმარებლის YARA წესები

YARA არის მავნე პროგრამის გამოვლენისთვის შემუშავებული შაბლონ-შეჯამების ენა. PRX-SD მომხმარებლის YARA წესების ჩაშენებულ და საზოგადოების წესებთან ერთად ჩატვირთვას მხარს უჭერს, რაც გაძლევს საშუალებას, შენი კონკრეტული საფრთხის ლანდშაფტის მორგებული გამოვლენის ლოგიკა შექმნა.

## წესის ფაილ-ადგილმდებარეობა

მომხმარებლის YARA წესები `~/.prx-sd/yara/` დირექტორიაში მოათავსეთ:

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SD გაშვებისას და სიგნატურ-განახლებებისას ამ დირექტორიიდან ყველა `.yar` და `.yara` ფაილს ტვირთავს. წესები სწრაფი სკანირებისთვის ოპტიმიზებული ქეშში (`compiled.yarc`) კომპილირდება.

::: tip
ქვე-დირექტორიები მხარდაჭერილია. უფრო ადვილი მართვისთვის წესები კატეგორიის მიხედვით დაალაგეთ:
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

## YARA წესის სინტაქსი

YARA წესი სამი სექციისგან შედგება: **meta**, **strings** და **condition**.

### წესის საბაზისო სტრუქტურა

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

### ძირითადი სინტაქსის ელემენტები

| ელემენტი | სინტაქსი | აღწერა |
|---------|--------|-------------|
| Hex სტრინგები | `{ 4D 5A ?? 00 }` | ბაიტ-შაბლონები wildcard-ებით (`??`) |
| ტექსტ-სტრინგები | `"text" ascii` | Plain ASCII სტრინგები |
| Wide სტრინგები | `"text" wide` | UTF-16LE კოდირებული სტრინგები |
| Case-insensitive | `"text" nocase` | შეჯამება კეისის მიუხედავად |
| Regex | `/pattern/` | Regular expression შაბლონები |
| ტეგები | `rule Name : tag1 tag2` | კატეგორიზაციის ტეგები |
| ფაილ-ზომა | `filesize < 1MB` | ფაილ-ზომაზე პირობა |
| Entry point | `entrypoint` | PE/ELF entry point offset |
| Offset-ზე | `$str at 0x100` | კონკრეტულ offset-ზე სტრინგი |
| დიაპაზონში | `$str in (0..1024)` | ბაიტ-დიაპაზონში სტრინგი |
| რაოდენობა | `#str > 3` | სტრინგის გამოჩენების რაოდენობა |

### სიმძიმის დონეები

PRX-SD საფრთხის კლასიფიკაციის დასადგენად `severity` meta ველს კითხულობს:

| სიმძიმე | PRX-SD განაჩენი |
|----------|---------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| (არ არის დაყენებული) | SUSPICIOUS |

## წესების მაგალითები

### საეჭვო სკრიპტის გამოვლენა

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

### კრიპტო-miner-ების გამოვლენა

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

### Webshell-ების გამოვლენა

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

## წესების ტესტირება

deploy-მდე წესების ვალიდაცია:

```bash
# წესის ფაილ-სინტაქსის დადასტურება (სინტაქსის შემოწმება)
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# წესის კონკრეტულ ფაილზე ტესტირება
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# ნიმუშების დირექტორიაში ყველა მომხმარებლის წესის ტესტირება
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# მხოლოდ მომხმარებლის წესებით Dry-run სკანი
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
ყოველთვის ახალი წესები ცნობილ-სუფთა ფაილების ნაკრებზე წარმოებრივ მონიტორინგში deploy-მდე ატესტეთ false positive-ების შესამოწმებლად.
:::

## წესების გადატვირთვა

წესების დამატების ან შეცვლის შემდეგ დემონის გადაშვების გარეშე გადატვირთვა:

```bash
# წესების ხელახლა-კომპილაცია და გადატვირთვა
sd yara reload

# დემონად გაშვებისას SIGHUP-ის გაგზავნა
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## წესების საზოგადოებასთან გაზიარება

PRX-SD საზოგადოებასთან გაზიარება:

1. [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures) რეპოზიტორიის fork
2. წესის შესაბამის კატეგორია-დირექტორიაში დამატება
3. ყოვლისმომცველი `meta` ველების ჩათვლა (author, description, severity, reference)
4. მავნე ნიმუშებსა და სუფთა ფაილებზე ტესტირება
5. ვალიდაციისთვის ნიმუშის ჰეშებიანი pull request სუბმიტი

## შემდეგი ნაბიჯები

- [სიგნატურების წყაროები](./sources) -- საზოგადოებისა და მესამე-მხარის YARA წესების წყაროები
- [ჰეშ-იმპორტი](./import) -- ჰეშ-ზე დაფუძნებული blocklist-ების დამატება
- [სიგნატურების განახლება](./update) -- ყველა წესის სიახლის შენარჩუნება
- [საფრთხის ინტელექტის მიმოხილვა](./index) -- სიგნატურის სრული არქიტექტურა
