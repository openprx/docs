---
title: Rootkit-ის გამოვლენა
description: "sd check-rootkit-ის გამოყენებით Linux-ზე ბირთვ- და userspace rootkit-ების გამოვლენა. ფარული პროცესების, ბირთვის მოდულების, system call hook-ების და სხვის შემოწმება."
---

# Rootkit-ის გამოვლენა

`sd check-rootkit` ბრძანება ბირთვ-დონისა და userspace rootkit-ების გამოსავლენად სისტემის სიღრმისეულ მთლიანობის შემოწმებებს ახდენს. Rootkit-ები მავნე პროგრამის ყველაზე საშიში სახეობებს შორისაა, რადგან თავიანთ არსებობას სტანდარტული სისტემის ინსტრუმენტებისგან მალავს და ამ გზით ჩვეულებრივი ფაილ-სკანერებისთვის უხილავი ხდება.

::: warning მოთხოვნები
- **Root პრივილეგიები საჭიროა** -- rootkit-ის გამოვლენა ბირთვის მონაცემ-სტრუქტურებსა და სისტემის შიდა ნაწილებს კითხულობს.
- **მხოლოდ Linux** -- ეს მახასიათებელი `/proc`-ზე, `/sys`-ზე და Linux-სპეციფიკურ ბირთვის ინტერფეისებზეა დამოკიდებული.
:::

## რას ადგენს

PRX-SD rootkit-ის არსებობას მრავალ ვექტორს ამოწმებს:

### ბირთვ-დონის შემოწმებები

| შემოწმება | აღწერა |
|-------|-------------|
| ფარული ბირთვის მოდულები | `/proc/modules`-დან ჩატვირთული მოდულების `sysfs` ჩანაწერებთან შედარება შეუსაბამობების საპოვნელად |
| System call ცხრილის hook-ები | syscall ცხრილის ჩანაწერების ცნობილ-კარგი ბირთვის სიმბოლოებთან შედარება |
| `/proc`-ის შეუსაბამობები | `/proc`-ს ფარული, მაგრამ სხვა ინტერფეისებიდან ხილული პროცესების გამოვლენა |
| ბირთვის სიმბოლოს დამახინჯება | ძირითადი ბირთვის სტრუქტურებში შეცვლილი ფუნქციის მაჩვენებლების შემოწმება |
| Interrupt descriptor table | IDT ჩანაწერების მოულოდნელი ცვლილებების შემოწმება |

### Userspace შემოწმებები

| შემოწმება | აღწერა |
|-------|-------------|
| ფარული პროცესები | `readdir(/proc)` შედეგების brute-force PID ჩამოთვლასთან შეჯვარება |
| LD_PRELOAD ინჟექცია | `LD_PRELOAD`-ით ან `/etc/ld.so.preload`-ით ჩატვირთული მავნე shared ბიბლიოთეკების შემოწმება |
| Binary-ის ჩანაცვლება | კრიტიკული სისტემური binary-ების მთლიანობის შედარება (`ls`, `ps`, `netstat`, `ss`, `lsof`) |
| ფარული ფაილები | `getdents` syscall-ის ინტერცეფციით დამალული ფაილების გამოვლენა |
| საეჭვო cron ჩანაწერები | ობფუსცირებული ან კოდირებული ბრძანებების crontab-ის სკანირება |
| Systemd სერვისის დამახინჯება | არაავტორიზებული ან შეცვლილი systemd unit-ების შემოწმება |
| SSH backdoor-ები | არაავტორიზებული SSH გასაღებების, შეცვლილი `sshd_config`-ის ან backdoor-ებიანი `sshd` binary-ების ძებნა |
| ქსელის მსმენელები | `ss`/`netstat`-ით ჩვენების გარეშე ფარული ქსელის socket-ების იდენტიფიცირება |

## საბაზისო გამოყენება

სრული rootkit-ის შემოწმება:

```bash
sudo sd check-rootkit
```

გამოტანის მაგალითი:

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## ბრძანების პარამეტრები

| პარამეტრი | მოკლე | ნაგულისხმევი | აღწერა |
|--------|-------|---------|-------------|
| `--json` | `-j` | გამორთ. | შედეგების JSON ფორმატში გამოტანა |
| `--kernel-only` | | გამორთ. | მხოლოდ ბირთვ-დონის შემოწმებების გაშვება |
| `--userspace-only` | | გამორთ. | მხოლოდ userspace შემოწმებების გაშვება |
| `--baseline` | | არცერთი | შედარებისთვის baseline ფაილის გზა |
| `--save-baseline` | | არცერთი | მიმდინარე მდგომარეობის baseline-ად შენახვა |

## Baseline-ის შედარება

მიმდინარე მონიტორინგისთვის ცნობილ-სუფთა სისტემის მდგომარეობის baseline შექმენით და მომავალ შემოწმებებთან შეადარეთ:

```bash
# ცნობილ-სუფთა სისტემაზე baseline-ის შექმნა
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# მომავალი შემოწმებები baseline-თან შეადარებს
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

Baseline ბირთვის მოდულების ჩამონათვალს, syscall ცხრილის ჰეშებს, კრიტიკული binary-ების checksums-ს და ქსელის მსმენელების მდგომარეობებს ინახავს. ნებისმიერი გადახვევა alert-ს გამოიწვევს.

## JSON გამოტანა

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## მაგალითი: ბირთვის მოდულის Rootkit-ის გამოვლენა

Rootkit-ის მიერ ბირთვის მოდულის დამალვისას `sd check-rootkit` შეუსაბამობას ადგენს:

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning კრიტიკული დასკვნები
rootkit-ის შემოწმებიდან `CRITICAL` დასკვნა სერიოზულ უსაფრთხოების ინციდენტად უნდა მოეპყრათ. კომპრომეტირებულ შეიძლება სისტემაზე remediation-ის მცდელობა ნუ მოხდება. სამაგიეროდ, მანქანა იზოლირეთ და სანდო მედიიდან გამოიძიეთ.
:::

## რეგულარული შემოწმებების დაგეგმვა

rootkit-ის შემოწმებები მონიტორინგის რუტინაში შეიყვანეთ:

```bash
# Cron: ყოველ 4 საათში შემოწმება
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## შემდეგი ნაბიჯები

- [მეხსიერების სკანირება](./memory-scan) -- გაშვებული პროცესებში in-memory საფრთხეების გამოვლენა
- [ფაილებისა და დირექტორიების სკანირება](./file-scan) -- ტრადიციული ფაილ-ზე დაფუძნებული სკანირება
- [USB სკანირება](./usb-scan) -- დაკავშირებისას მოსახსნელი მედიის სკანირება
- [გამოვლენის ძრავა](../detection/) -- ყველა გამოვლენის შრის მიმოხილვა
