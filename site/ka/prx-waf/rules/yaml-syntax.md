---
title: YAML წეს-სინტაქსი
description: "PRX-WAF-ის YAML წეს-ფორმატის სრული ცნობარი. სქემა, ველის ცნობარი, ოპერატორის ცნობარი, ქმედების ცნობარი და ანოტირებული მაგალითები."
---

# YAML წეს-სინტაქსი

ეს გვერდი PRX-WAF-ის მიერ გამოყენებულ YAML წეს-სქემას სრულად დოკუმენტირებს. ყოველი წეს-ფაილი ამ სტრუქტურას მიჰყვება.

## ფაილის სტრუქტურა

ყოველ YAML წეს-ფაილს აქვს ზედა-დონის მეტადატ-სექცია, შემდეგ წესების სია:

```yaml
version: "1.0"                     # Schema version (required)
description: "Short description"   # Human-readable label (required)
source: "OWASP CRS v4.25.0"       # Origin of the rules (optional)
license: "Apache-2.0"             # SPDX license identifier (optional)

rules:
  - <rule>
  - <rule>
```

## წეს-სქემა

`rules` სიაში ყოველ წეს-ს შემდეგი ველები აქვს:

```yaml
- id: "CRS-942100"              # Unique string ID (REQUIRED)
  name: "SQL injection attack"  # Short description (REQUIRED)
  category: "sqli"              # Category tag (REQUIRED)
  severity: "critical"          # Severity level (REQUIRED)
  paranoia: 1                   # Paranoia level 1-4 (optional, default: 1)
  field: "all"                  # Request field to inspect (REQUIRED)
  operator: "regex"             # Match operator (REQUIRED)
  value: "(?i)select.+from"     # Pattern or threshold (REQUIRED)
  action: "block"               # Action on match (REQUIRED)
  tags:                         # String tags (optional)
    - "owasp-crs"
    - "sqli"
  crs_id: 942100                # Original CRS numeric ID (optional)
  reference: "https://..."      # CVE or documentation link (optional)
```

### სავალდებულო ველები

| ველი | ტიპი | აღწერა |
|-------|------|-------------|
| `id` | `string` | უნიკალური იდენტიფიკატორი ყველა წეს-ფაილში. ფორმატი: `<PREFIX>-<CATEGORY>-<NNN>` |
| `name` | `string` | მოკლე ადამიანისთვის-წასაკითხი აღწერა (მაქს. ~120 სიმბოლო) |
| `category` | `string` | კატეგორია-ტეგი ფილტრაციისა და ანგარიშებისთვის |
| `severity` | `string` | ერთ-ერთი: `critical`, `high`, `medium`, `low`, `info`, `notice`, `warning`, `error`, `unknown` |
| `field` | `string` | მოთხოვნის რომელი ნაწილი შეამოწმოს (ველის ცნობარი იხ.) |
| `operator` | `string` | მნიშვნელობის შემჯამების გზა (ოპერატორის ცნობარი იხ.) |
| `value` | `string` | შაბლონი, ბარიერი ან სიტყვ-სიის ფაილ-სახელი |
| `action` | `string` | წეს-შემჯამებისას ქმედება (ქმედებ-ცნობარი იხ.) |

### სურვილისამებრ ველები

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `paranoia` | `integer` | `1` | Paranoia დონე 1-4 |
| `tags` | `string[]` | `[]` | ტეგები ფილტრაციისა და dashboard-ის ჩვენებისთვის |
| `crs_id` | `integer` | -- | OWASP CRS-ის ორიგინალი რიცხვითი ID |
| `reference` | `string` | -- | URL CVE-ზე, OWASP-ის სტატიაზე ან დასაბუთებაზე |

## ველის ცნობარი

`field` მნიშვნელობა განსაზღვრავს HTTP მოთხოვნის რომელი ნაწილი შემოწმდება:

| ველი | ამოწმებს |
|-------|----------|
| `path` | მოთხოვნის URI path (query string-ის გარეშე) |
| `query` | Query string (ყველა პარამეტრი, გაშიფრული) |
| `body` | მოთხოვნის body (გაშიფრული) |
| `headers` | ყველა მოთხოვნის header (სახელი: მნიშვნელობა) |
| `user_agent` | მხოლოდ User-Agent header |
| `cookies` | მოთხოვნის cookies |
| `method` | HTTP მეთოდი (GET, POST, PUT და სხვ.) |
| `content_type` | Content-Type header |
| `content_length` | Content-Length მნიშვნელობა (რიცხვით შედარებისთვის) |
| `path_length` | URI path-ის სიგრძე (რიცხვით შედარებისთვის) |
| `query_arg_count` | query პარამეტრების რაოდენობა (რიცხვით შედარებისთვის) |
| `all` | ყველა ზემოხსენებული ველი გაერთიანებული |

## ოპერატორის ცნობარი

`operator` მნიშვნელობა განსაზღვრავს `value`-ის შემოწმებულ ველთან შემჯამების გზას:

| ოპერატორი | აღწერა | მნიშვნელობის ფორმატი |
|----------|-------------|--------------|
| `regex` | PCRE-თავსებადი regular expression | Regex შაბლონი |
| `contains` | ველი შეიცავს ლიტერალ სტრიქონს | ლიტერალი სტრიქონი |
| `equals` | ველი ზუსტად უდრის მნიშვნელობას (case-sensitive) | ლიტერალი სტრიქონი |
| `not_in` | ველის მნიშვნელობა სიაში არ არის | მძიმ-გამოყოფილი სია |
| `gt` | ველის მნიშვნელობა (რიცხვი) მეტია | რიცხვ-სტრიქონი |
| `lt` | ველის მნიშვნელობა (რიცხვი) ნაკლებია | რიცხვ-სტრიქონი |
| `ge` | ველის მნიშვნელობა (რიცხვი) მეტი ან ტოლია | რიცხვ-სტრიქონი |
| `le` | ველის მნიშვნელობა (რიცხვი) ნაკლები ან ტოლია | რიცხვ-სტრიქონი |
| `detect_sqli` | SQL injection-ის გამოვლენა libinjection-ის გავლით | `"true"` ან `""` |
| `detect_xss` | XSS-ის გამოვლენა libinjection-ის გავლით | `"true"` ან `""` |
| `pm_from_file` | სიტყვ-სია-ფაილთან ფრაზ-შემჯამება | ფაილ-სახელი `owasp-crs/data/`-ში |
| `pm` | შიდა სიასთან ფრაზ-შემჯამება | მძიმ-გამოყოფილი ფრაზები |

## ქმედებ-ცნობარი

`action` მნიშვნელობა განსაზღვრავს წეს-შემჯამებისას ქმედებას:

| ქმედება | აღწერა |
|--------|-------------|
| `block` | მოთხოვნის 403 Forbidden პასუხით უარყოფა |
| `log` | მოთხოვნის გაშვება, მაგრამ შემჯამების ჟურნალირება (მონიტორინგის რეჟიმი) |
| `allow` | მოთხოვნის ცალსახა გაშვება (სხვა წესებს გადაფარავს) |
| `deny` | `block`-ის ალიასი |
| `redirect` | მოთხოვნის გადამისამართება (ძრავ-სპეციფიკური კონფიგურაცია) |
| `drop` | კავშირის ჩუმ-ჩუმად გაწყვეტა |

::: tip
ახალი წესები `action: log`-ით დაიწყე `action: block`-ზე გადასვლამდე მცდარ-დადებითებისთვის სამონიტორინგოდ.
:::

## ID-ის სახელ-სივრცის კონვენცია

წეს-ID-ები დადგენილ prefix-კონვენციას უნდა მიჰყვეს:

| დირექტორია | ID prefix | მაგალითი |
|-----------|-----------|---------|
| `owasp-crs/` | `CRS-<number>` | `CRS-942100` |
| `modsecurity/` | `MODSEC-<CATEGORY>-<NNN>` | `MODSEC-IP-001` |
| `cve-patches/` | `CVE-<YEAR>-<SHORT>-<NNN>` | `CVE-2021-LOG4J-001` |
| `custom/` | `CUSTOM-<CATEGORY>-<NNN>` | `CUSTOM-API-001` |

## სრული მაგალითი

```yaml
version: "1.0"
description: "Application-specific access control rules"
source: "custom"
license: "Apache-2.0"

rules:
  - id: "CUSTOM-API-001"
    name: "Block access to internal admin API"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/internal/"
    action: "block"
    tags: ["custom", "access-control"]

  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client)"
    action: "log"
    tags: ["custom", "bot", "scanner"]

  - id: "CUSTOM-RATE-001"
    name: "Block requests with excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## წეს-ვალიდაცია

წეს-ფაილების განასახებამდე ვალიდაცია:

```bash
# Validate all rules
python rules/tools/validate.py rules/

# Validate a specific file
python rules/tools/validate.py rules/custom/myapp.yaml
```

ვალიდატორი ამოწმებს:
- სავალდებულო ველები მოიძებნება
- ყველა ფაილში წეს-ID-ის დუბლიკატები არ არის
- სიმძიმისა და ქმედების მნიშვნელობები სწორია
- Paranoia დონეები 1-4 დიაპაზონში მოიძებნება
- Regex-ები სწორად კომპილირდება
- რიცხვითი ოპერატორები სტრიქონ-მნიშვნელობებთან არ გამოიყენება

## შემდეგი ნაბიჯები

- [ჩაშენებული წესები](./builtin-rules) -- OWASP CRS-ისა და CVE პაჩ-წესების კვლევა
- [მომხმარებლის წესები](./custom-rules) -- საკუთარი წესების ნაბიჯ-ნაბიჯ დაწერა
- [წეს-ძრავის მიმოხილვა](./index) -- გამოვლენის პაიფლაინის წეს-დამუშავება
