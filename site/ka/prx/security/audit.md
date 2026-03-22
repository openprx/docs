---
title: აუდიტის ჟურნალი
description: უსაფრთხოების აუდიტის ჟურნალირების სისტემა PRX-ში ყველა უსაფრთხოებასთან დაკავშირებული ოპერაციის თვალყურისდევნებისთვის.
---

# აუდიტის ჟურნალი

PRX მოიცავს ჩაშენებულ აუდიტის ჟურნალირების სისტემას, რომელიც ყველა უსაფრთხოებასთან დაკავშირებულ ოპერაციას აღრიცხავს. `AuditLogger` თვალყურს ადევნებს ვინ რა გააკეთა, როდის და წარმატებით თუ არა -- რაც ხელშეუხებლობის დამადასტურებელ კვალს უზრუნველყოფს შესაბამისობის, ინციდენტებზე რეაგირებისა და სასამართლო-ტექნიკური ანალიზისთვის.

## მიმოხილვა

აუდიტის სისტემა სტრუქტურირებულ მოვლენებს იჭერს ყოველი უსაფრთხოებისთვის მგრძნობიარე მოქმედებისთვის:

- ავთენტიფიკაციის მცდელობები (წარმატებული და წარუმატებელი)
- ავტორიზაციის გადაწყვეტილებები (ნებართვა და უარყოფა)
- კონფიგურაციის ცვლილებები
- ინსტრუმენტების შესრულებები და სენდბოქსის მოვლენები
- მეხსიერებაზე წვდომა და მოდიფიკაცია
- არხების დაკავშირება და გათიშვა
- ევოლუციის წინადადებები და გამოყენებები
- დანამატების სიცოცხლის ციკლის მოვლენები

ყოველი აუდიტის მოვლენა შეიცავს დროის ნიშანს, მოქმედი პირის იდენტობას, მოქმედების აღწერას, სამიზნე რესურსსა და შედეგს.

## აუდიტის მოვლენის სტრუქტურა

ყოველი აუდიტის მოვლენა სტრუქტურირებული ჩანაწერია შემდეგი ველებით:

| ველი | ტიპი | აღწერა |
|------|------|--------|
| `timestamp` | `DateTime<Utc>` | მოვლენის დრო (UTC, ნანოწამის სიზუსტით) |
| `event_id` | `String` | მოვლენის უნიკალური იდენტიფიკატორი (UUIDv7, დროით დალაგებული) |
| `actor` | `Actor` | ვინ შეასრულა მოქმედება (მომხმარებელი, აგენტი, სისტემა ან დანამატი) |
| `action` | `String` | რა შესრულდა (მაგ., `auth.login`, `tool.execute`, `config.update`) |
| `target` | `String` | რესურსი, რომელზეც იმოქმედეს (მაგ., სესიის ID, კონფიგურაციის გასაღები, ფაილის ბილიკი) |
| `outcome` | `Outcome` | შედეგი: `success`, `failure` ან `denied` |
| `metadata` | `Map<String, Value>` | დამატებითი კონტექსტი (IP მისამართი, უარყოფის მიზეზი და სხვ.) |
| `session_id` | `Option<String>` | ასოცირებული აგენტის სესია, ასეთის არსებობისას |
| `severity` | `Severity` | მოვლენის სიმწვავე: `info`, `warning`, `critical` |

### მოქმედი პირის ტიპები

| მოქმედი პირის ტიპი | აღწერა | მაგალითი |
|---------------------|--------|----------|
| `user` | ადამიანი მომხმარებელი, იდენტიფიცირებული არხით ან API ავთენტიფიკაციით | `user:telegram:123456789` |
| `agent` | თავად PRX აგენტი | `agent:default` |
| `system` | შიდა სისტემური პროცესები (cron, ევოლუცია) | `system:evolution` |
| `plugin` | WASM დანამატი | `plugin:my-plugin:v1.2.0` |

### მოქმედების კატეგორიები

მოქმედებები წერტილით გამოყოფილი სახელთა სივრცის კონვენციას მიჰყვება:

| კატეგორია | მოქმედებები | სიმწვავე |
|-----------|------------|----------|
| `auth.*` | `auth.login`, `auth.logout`, `auth.token_refresh`, `auth.pairing` | info / warning |
| `authz.*` | `authz.allow`, `authz.deny`, `authz.policy_check` | info / warning |
| `config.*` | `config.update`, `config.reload`, `config.hot_reload` | warning |
| `tool.*` | `tool.execute`, `tool.sandbox_escape_attempt`, `tool.timeout` | info / critical |
| `memory.*` | `memory.store`, `memory.recall`, `memory.delete`, `memory.compact` | info |
| `channel.*` | `channel.connect`, `channel.disconnect`, `channel.error` | info / warning |
| `evolution.*` | `evolution.propose`, `evolution.apply`, `evolution.rollback` | warning / critical |
| `plugin.*` | `plugin.load`, `plugin.unload`, `plugin.error`, `plugin.permission_denied` | info / warning |
| `session.*` | `session.create`, `session.terminate`, `session.timeout` | info |

## კონფიგურაცია

```toml
[security.audit]
enabled = true
min_severity = "info"           # ჟურნალირების მინიმალური სიმწვავე: "info", "warning", "critical"

[security.audit.file]
enabled = true
path = "~/.local/share/openprx/audit.log"
format = "jsonl"                # "jsonl" ან "csv"
max_size_mb = 100               # როტაცია ფაილის ამ ზომის გადაჭარბებისას
max_files = 10                  # 10-მდე როტაციული ფაილის შენახვა
compress_rotated = true         # როტაციული ფაილების gzip კომპრესია

[security.audit.database]
enabled = false
backend = "sqlite"              # "sqlite" ან "postgres"
path = "~/.local/share/openprx/audit.db"
retention_days = 90             # 90 დღეზე ძველი მოვლენების ავტო-წაშლა
```

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `true` | აუდიტის ჟურნალირების გლობალური ჩართვა ან გამორთვა |
| `min_severity` | `String` | `"info"` | ჩაწერის მინიმალური სიმწვავის დონე |
| `file.enabled` | `bool` | `true` | აუდიტის მოვლენების ჟურნალის ფაილში ჩაწერა |
| `file.path` | `String` | `"~/.local/share/openprx/audit.log"` | აუდიტის ჟურნალის ფაილის ბილიკი |
| `file.format` | `String` | `"jsonl"` | ჟურნალის ფორმატი: `"jsonl"` (ერთი JSON ობიექტი თითო ხაზზე) ან `"csv"` |
| `file.max_size_mb` | `u64` | `100` | მაქსიმალური ფაილის ზომა როტაციამდე (MB) |
| `file.max_files` | `u32` | `10` | შესანახი როტაციული ფაილების რაოდენობა |
| `file.compress_rotated` | `bool` | `true` | როტაციული ჟურნალის ფაილების gzip კომპრესია |
| `database.enabled` | `bool` | `false` | აუდიტის მოვლენების მონაცემთა ბაზაში ჩაწერა |
| `database.backend` | `String` | `"sqlite"` | მონაცემთა ბაზის ბექენდი: `"sqlite"` ან `"postgres"` |
| `database.path` | `String` | `""` | მონაცემთა ბაზის ბილიკი (SQLite) ან კავშირის URL (PostgreSQL) |
| `database.retention_days` | `u64` | `90` | N დღეზე ძველი მოვლენების ავტო-წაშლა. 0 = სამუდამოდ შენახვა |

## შენახვის ბექენდები

### ფაილი (JSONL)

ნაგულისხმევი ბექენდი ერთ JSON ობიექტს წერს თითო ხაზზე ჟურნალის ფაილში. ეს ფორმატი თავსებადია სტანდარტულ ჟურნალის ანალიზის ინსტრუმენტებთან (jq, grep, Elasticsearch ingest).

ჟურნალის ჩანაწერის მაგალითი:

```json
{
  "timestamp": "2026-03-21T10:15:30.123456789Z",
  "event_id": "019520a8-1234-7000-8000-000000000001",
  "actor": {"type": "user", "id": "user:telegram:123456789"},
  "action": "tool.execute",
  "target": "shell:ls -la /tmp",
  "outcome": "success",
  "metadata": {"sandbox": "bubblewrap", "duration_ms": 45},
  "session_id": "sess_abc123",
  "severity": "info"
}
```

### მონაცემთა ბაზა (SQLite / PostgreSQL)

მონაცემთა ბაზის ბექენდი მოვლენებს სტრუქტურირებულ ცხრილში ინახავს ინდექსებით `timestamp`, `actor`, `action` და `severity` ველებზე ეფექტური მოთხოვნებისთვის.

## აუდიტის კვალის მოთხოვნები

### CLI მოთხოვნები

```bash
# ბოლო აუდიტის მოვლენების ნახვა
prx audit log --tail 50

# მოქმედების კატეგორიით ფილტრაცია
prx audit log --action "auth.*" --last 24h

# სიმწვავით ფილტრაცია
prx audit log --severity critical --last 7d

# მოქმედი პირით ფილტრაცია
prx audit log --actor "user:telegram:123456789"

# JSON-ში ექსპორტი
prx audit log --last 30d --format json > audit_export.json
```

### მონაცემთა ბაზის მოთხოვნები

მონაცემთა ბაზის ბექენდის გამოყენებისას, SQL-ით პირდაპირ მოთხოვნა შეგიძლიათ:

```sql
-- წარუმატებელი ავთენტიფიკაციის მცდელობები ბოლო 24 საათში
SELECT * FROM audit_events
WHERE action LIKE 'auth.%'
  AND outcome = 'failure'
  AND timestamp > datetime('now', '-24 hours')
ORDER BY timestamp DESC;

-- კონკრეტული მომხმარებლის ინსტრუმენტის შესრულებები
SELECT action, target, outcome, timestamp
FROM audit_events
WHERE actor_id = 'user:telegram:123456789'
  AND action LIKE 'tool.%'
ORDER BY timestamp DESC
LIMIT 100;

-- კრიტიკული მოვლენების შეჯამება
SELECT action, COUNT(*) as count
FROM audit_events
WHERE severity = 'critical'
  AND timestamp > datetime('now', '-7 days')
GROUP BY action
ORDER BY count DESC;
```

## შესაბამისობა

აუდიტის ჟურნალირების სისტემა შესაბამისობის მოთხოვნების მხარდასაჭერადაა შექმნილი:

- **უცვლელობა** -- ჟურნალის ფაილები მხოლოდ-მიმატების რეჟიმშია; როტაციული ფაილების მთლიანობა საკონტროლო ჯამებით მოწმდება
- **სრულყოფილება** -- ყველა უსაფრთხოებასთან დაკავშირებული ოპერაცია ნაგულისხმევად `info` დონეზე აღირიცხება
- **შენარჩუნება** -- კონფიგურირებადი შენახვის ვადები ავტომატური როტაციითა და წაშლით
- **უარყოფის შეუძლებლობა** -- ყოველი მოვლენა მოქმედი პირის იდენტობასა და დროის ნიშანს შეიცავს
- **ხელმისაწვდომობა** -- ორმაგი გამოტანა (ფაილი + მონაცემთა ბაზა) მოვლენების დაკარგვას გამორიცხავს ერთი ბექენდის წარუმატებლობისას

### რეკომენდებული პარამეტრები შესაბამისობისთვის

```toml
[security.audit]
enabled = true
min_severity = "info"

[security.audit.file]
enabled = true
format = "jsonl"
max_size_mb = 500
max_files = 50
compress_rotated = true

[security.audit.database]
enabled = true
backend = "postgres"
path = "postgresql://audit_user:password@localhost/prx_audit"
retention_days = 365
```

## წარმადობა

აუდიტის ჟურნალი მინიმალური ზედნადებისთვისაა შექმნილი:

- მოვლენები ასინქრონულად იწერება შემოსაზღვრული არხის მეშვეობით (ნაგულისხმევი ტევადობა: 10,000 მოვლენა)
- ფაილში ჩაწერა ბუფერირებულია და პერიოდულად იფლაშება (ყოველ 1 წამში ან ყოველ 100 მოვლენაზე)
- მონაცემთა ბაზაში ჩაწერა ჯგუფურადაა (ნაგულისხმევი ჯგუფის ზომა: 50 მოვლენა)
- თუ მოვლენების არხი სავსეა, მოვლენები გაფრთხილების მთვლელით იგდება (აგენტის ძირითად ციკლს არასდროს ბლოკავს)

## შეზღუდვები

- ფაილის ბექენდი ჩაშენებულ ხელყოფის აღმოჩენას არ უზრუნველყოფს (მაღალი უსაფრთხოების განთავსებებისთვის გარე მთლიანობის მონიტორინგი განიხილეთ)
- დანამატის კოდის აუდიტის მოვლენები ჰოსტის მიერ აღირიცხება; დანამატებს აუდიტის სისტემის გვერდის ავლა არ შეუძლიათ
- CSV ფორმატი ჩადგმულ მეტამონაცემთა ველებს არ უჭერს მხარს (სრული სიზუსტისთვის JSONL გამოიყენეთ)
- მონაცემთა ბაზის შენახვის გასუფთავება საათში ერთხელ სრულდება; მოვლენები კონფიგურირებული შენახვის ვადაზე ოდნავ მეტხანს შეიძლება შენარჩუნდეს

## დაკავშირებული გვერდები

- [უსაფრთხოების მიმოხილვა](./)
- [პოლიტიკის ძრავა](./policy-engine) -- ავტორიზაციის გადაწყვეტილებები, რომლებიც აუდიტის მოვლენებს წარმოქმნის
- [სენდბოქსი](./sandbox) -- ინსტრუმენტის შესრულების იზოლაცია
- [საფრთხის მოდელი](./threat-model) -- უსაფრთხოების არქიტექტურა და ნდობის საზღვრები
