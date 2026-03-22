---
title: რეკლამა და მავნე დომენების ბლოკვა
description: "DNS დონეზე რეკლამების, tracker-ებისა და მავნე დომენების ბლოკვა sd adblock ბრძანების გამოყენებით. მხარს უჭერს მრავალ filter სიას, მომხმარებლის წესებსა და მდგრად ჟურნალირებას."
---

# რეკლამა და მავნე დომენების ბლოკვა

PRX-SD შეიცავს ჩაშენებულ adblock ძრავას, რომელიც DNS დონეზე სისტემის hosts ფაილში (`/etc/hosts` Linux/macOS-ზე, `C:\Windows\System32\drivers\etc\hosts` Windows-ზე) ჩანაწერების ჩაწერით რეკლამებს, tracker-ებსა და ცნობილ მავნე დომენებს ბლოკავს. Filter სიები ლოკალურად `~/.prx-sd/adblock/`-ში ინახება და Adblock Plus (ABP) სინტაქსსა და hosts-ფაილ-ფორმატს მხარს უჭერს.

## როგორ მუშაობს

adblock-ის ჩართვისას PRX-SD:

1. კონფიგურირებული filter სიების ჩამოტვირთვა (EasyList, abuse.ch URLhaus და სხვ.)
2. ABP წესების (`||domain.com^`) და hosts ჩანაწერების (`0.0.0.0 domain.com`) პარსინგი
3. ყველა დაბლოკილი დომენის `0.0.0.0`-ზე გამიზნულად სისტემის hosts ფაილში ჩაწერა
4. ყოველი დაბლოკილი დომენ-ძებნის `~/.prx-sd/adblock/blocked_log.jsonl`-ში ჟურნალირება

::: tip
upstream forwarding-ით DNS-დონის სრული ფილტრაციისთვის adblock-ი [DNS proxy](./dns-proxy)-თან კომბინირება. Proxy adblock წესებს, IOC დომენ feed-ებსა და მომხმარებლის blocklist-ებს ერთ resolver-ში ინტეგრირებს.
:::

## ბრძანებები

### დაცვის ჩართვა

Filter სიების ჩამოტვირთვა და hosts ფაილის გზით DNS ბლოკვის ინსტალაცია. Root/administrator პრივილეგიებს საჭიროებს.

```bash
sudo sd adblock enable
```

გამოტანა:

```
>>> Enabling adblock protection...
  Loaded 4 lists (128432 rules)
success: Adblock enabled: 95211 domains blocked via /etc/hosts
  Lists: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  Log: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### დაცვის გამორთვა

hosts ფაილიდან ყველა PRX-SD ჩანაწერის ამოღება. სერთიფიკატები და ქეშ-სიები ინახება.

```bash
sudo sd adblock disable
```

### Filter სიების სინქრონიზება

ყველა კონფიგურირებული filter სიის ხელახლა-ჩამოტვირთვის გაძალება. adblock-ის ამჟამინდელ ჩართვისას hosts ფაილი ახალი წესებით ავტომატურად განახლდება.

```bash
sudo sd adblock sync
```

### სტატისტიკის ნახვა

მიმდინარე სტატუსის, ჩატვირთული სიების, წესების რაოდენობისა და ბლოკ-ჟურნალის ზომის ჩვენება.

```bash
sd adblock stats
```

გამოტანა:

```
Adblock Engine Statistics
  Status:        ENABLED
  Lists loaded:  4
  Total rules:   128432
  Cache dir:     /home/user/.prx-sd/adblock
  Last sync:     2026-03-20T14:30:00Z
  Blocked log:   1842 entries

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### URL ან დომენის შემოწმება

კონკრეტული URL ან დომენი მიმდინარე filter სიებით დაბლოკილია თუ არა ამოწმება.

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

დომენი scheme-ით სრულად მითითებული არ არის, PRX-SD ავტომატურად `https://`-ს წინ დაამატებს.

გამოტანა:

```
BLOCKED ads.example.com -> Ads
```

ან:

```
ALLOWED docs.example.com
```

### ბლოკ-ჟურნალის ნახვა

მდგრადი JSONL ჟურნალიდან ბოლო დაბლოკილი ჩანაწერების ჩვენება. `--count` ნიშანი ჩვენებადი ჩანაწერების რაოდენობას აკონტროლებს (ნაგულისხმევი: 50).

```bash
sd adblock log
sd adblock log --count 100
```

ყოველი ჟურნალ-ჩანაწერი timestamp-ს, დომენს, URL-ს, კატეგორიასა და წყაროს შეიცავს.

### მომხმარებლის Filter სიის დამატება

მესამე-მხარის ან მომხმარებლის filter სიის სახელითა და URL-ით დამატება. `--category` ნიშანი სიას კლასიფიცირებს (ნაგულისხმევი: `unknown`).

ხელმისაწვდომი კატეგორიები: `ads`, `tracking`, `malware`, `social`.

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### Filter სიის ამოღება

ადრე დამატებული filter სიის სახელის მიხედვით ამოღება.

```bash
sd adblock remove my-blocklist
```

## ნაგულისხმევი Filter სიები

PRX-SD გამოტანილია შემდეგი ჩაშენებული filter წყაროებით:

| სია | კატეგორია | აღწერა |
|------|----------|-------------|
| EasyList | რეკლამა | საზოგადოების მართული რეკლამ-filter-სია |
| EasyPrivacy | Tracking | Tracker-ისა და fingerprinting-ის დაცვა |
| URLhaus Domains | მავნე პროგრამა | abuse.ch-ის მავნე URL დომენები |
| Malware Domains | მავნე პროგრამა | ცნობილი მავნე-პროგრამ-გავრცელების დომენები |

## Filter სიის ფორმატი

მომხმარებლის სიებს Adblock Plus (ABP) სინტაქსი ან hosts-ფაილ-ფორმატი შეუძლიათ:

**ABP ფორმატი:**

```
||ads.example.com^
||tracker.analytics.io^
```

**Hosts ფორმატი:**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

`!`, `#` ან `[`-ით დაწყებული სტრიქონები კომენტარებად ითვლება და იგნორირდება.

## მონაცემთა დირექტორიის სტრუქტურა

```
~/.prx-sd/adblock/
  enabled           # Flag file (present when adblock is active)
  config.json       # Source list configuration
  blocked_log.jsonl # Persistent block log
  lists/            # Cached filter list files
```

::: warning
adblock-ის ჩართვა და გამორთვა სისტემის hosts ფაილს ცვლის. hosts ფაილის ხელით რედაქტირების ნაცვლად ჩანაწერების სუფთად ამოსაღებად ყოველთვის `sd adblock disable`-ის გამოყენება. ბრძანება root/administrator პრივილეგიებს საჭიროებს.
:::

## მაგალითები

**სრული კონფიგურაციის ნაკადი:**

```bash
# ნაგულისხმევი სიებით ჩართვა
sudo sd adblock enable

# მომხმარებლის მავნე-პროგრამ-blocklist-ის დამატება
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# ახალი სიის ჩამოსატვირთად ხელახლა-სინქრონიზება
sudo sd adblock sync

# ცნობილი მავნე დომენის დაბლოკვის შემოწმება
sd adblock check malware-c2.example.com

# სტატისტიკის შემოწმება
sd adblock stats

# ბოლო ბლოკების ნახვა
sd adblock log --count 20
```

**გამორთვა და გასუფთავება:**

```bash
sudo sd adblock disable
```

## შემდეგი ნაბიჯები

- upstream forwarding-ით DNS-დონის სრული ფილტრაციისთვის [DNS Proxy](./dns-proxy)-ის დაყენება
- [Webhook Alert-ების](../alerts/) კონფიგურაცია დომენების ბლოკვის შეტყობინებისთვის
- სრული ბრძანებების სანახავად [CLI ცნობარის](../cli/) შესწავლა
