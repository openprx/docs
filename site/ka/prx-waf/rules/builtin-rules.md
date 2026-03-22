---
title: ჩაშენებული წესები
description: "PRX-WAF 398 YAML წეს-ს მოიცავს OWASP CRS, ModSecurity საზოგადოებრივი წესებისა და სამიზნე CVE ვირტუალური პაჩების გადაფარვით. სრული ინვენტარი და კატეგორი-დაყოფა."
---

# ჩაშენებული წესები

PRX-WAF სამ კატეგორიაში 398 წინასწარ-შემუშავებულ წეს-ს მოიცავს, პლუს 10+ გამოვლენის შემოწმება ბინარაში კომპილირებული. ერთად, ისინი OWASP Top 10-ისა და ცნობილი CVE exploit-ების ყოვლისმომცველ გადაფარვას გვაძლევს.

## OWASP Core Rule Set (310 წესი)

OWASP CRS წესები [OWASP ModSecurity Core Rule Set v4](https://github.com/coreruleset/coreruleset)-დან PRX-WAF-ის native YAML ფორმატში გადაყვანილია. ისინი ვებ-შეტევების ყველაზე გავრცელებულ ვექტორებს მოიცავს:

| ფაილი | CRS ID-ები | წესები | კატეგორია |
|------|---------|-------|----------|
| `sqli.yaml` | 942xxx | ~87 | SQL injection |
| `xss.yaml` | 941xxx | ~41 | Cross-site scripting |
| `rce.yaml` | 932xxx | ~30 | Remote code execution |
| `lfi.yaml` | 930xxx | ~20 | Local file inclusion |
| `rfi.yaml` | 931xxx | ~12 | Remote file inclusion |
| `php-injection.yaml` | 933xxx | ~18 | PHP injection |
| `java-injection.yaml` | 944xxx | ~15 | Java / Expression Language injection |
| `generic-attack.yaml` | 934xxx | ~12 | Node.js, SSI, HTTP splitting |
| `scanner-detection.yaml` | 913xxx | ~10 | Security scanner UA გამოვლენა |
| `protocol-enforcement.yaml` | 920xxx | ~15 | HTTP პროტოკოლ-შესაბამისობა |
| `protocol-attack.yaml` | 921xxx | ~10 | Request smuggling, CRLF injection |
| `multipart-attack.yaml` | 922xxx | ~8 | Multipart bypass |
| `method-enforcement.yaml` | 911xxx | ~5 | HTTP მეთოდ-allowlist |
| `session-fixation.yaml` | 943xxx | ~6 | Session fixation |
| `web-shells.yaml` | 955xxx | ~8 | Web shell გამოვლენა |
| `response-*.yaml` | 950-956xxx | ~13 | პასუხ-ინსპექტირება |

### სიტყვ-სია მონაცემ-ფაილები

OWASP CRS წესები `rules/owasp-crs/data/`-ში შენახული 20+ სიტყვ-სია-ფაილის წინააღმდეგ ფრაზ-შემჯამებას (`pm_from_file`) იყენებს:

- `scanners-user-agents.data` -- ცნობილი სკანერ-user-agent სტრიქონები
- `lfi-os-files.data` -- სენსიტიური OS-ის ფაილ-გზები
- `sql-errors.data` -- მონაცემთა ბაზის შეცდომა-შეტყობინების შაბლონები
- და სხვ.

## ModSecurity საზოგადოებრივი წესები (46 წესი)

ხელ-ნაწერი წესები OWASP CRS-ის მიერ სრულად მოუცველი საფრთხის კატეგორიებისთვის:

| ფაილი | წესები | კატეგორია |
|------|-------|----------|
| `ip-reputation.yaml` | ~15 | ბოტ/სკანერ/proxy IP-ის გამოვლენა |
| `dos-protection.yaml` | ~12 | DoS-ი და არანორმალური მოთხოვნ-შაბლონები |
| `data-leakage.yaml` | ~10 | PII-სა და სერთიფიკატ-გაჟონვის გამოვლენა |
| `response-checks.yaml` | ~9 | პასუხ-body-ის ინსპექტირება |

## CVE ვირტუალური პაჩები (39 წესი)

მაღალ-პროფილიანი CVE-ებისთვის სამიზნე გამოვლენის წესები. ეს ვირტუალური პაჩებად მოქმედებს, exploit-მცდელობებს დაუცველ პროგრამებამდე მისვლამდე ბლოკავს:

| ფაილი | CVE(ები) | აღწერა |
|------|--------|-------------|
| `2021-log4shell.yaml` | CVE-2021-44228, CVE-2021-45046 | Apache Log4j RCE JNDI-ის ძებნის გავლით |
| `2022-spring4shell.yaml` | CVE-2022-22965, CVE-2022-22963 | Spring Framework RCE |
| `2022-text4shell.yaml` | CVE-2022-42889 | Apache Commons Text RCE |
| `2023-moveit.yaml` | CVE-2023-34362, CVE-2023-36934 | MOVEit Transfer SQL injection |
| `2024-xz-backdoor.yaml` | CVE-2024-3094 | XZ Utils backdoor-ის გამოვლენა |
| `2024-recent.yaml` | სხვადასხვა | 2024 მაღალ-პროფილიანი CVE-ები |
| `2025-recent.yaml` | სხვადასხვა | 2025 მაღალ-პროფილიანი CVE-ები |

::: tip
CVE პაჩ-წესები ნაგულისხმევად paranoia დონე 1-ზე დაყენებულია, ანუ ყველა კონფიგურაციაში აქტიურია. მათთვის მცდარ-დადებითების ძალიან დაბალი მაჩვენებელია, რადგან სპეციფიკური exploit payload-ებს სამიზნედ ისახავს.
:::

## ჩაშენებული გამოვლენის შემოწმებები

YAML წესებთან ერთად PRX-WAF ბინარაში კომპილირებულ გამოვლენის შემოწმებებს შეიცავს. ეს გამოვლენის პაიფლაინის სპეციალურ ფაზებში სრულდება:

| ფაზა | შემოწმება | აღწერა |
|-------|---------|-------------|
| 1-4 | IP Allowlist/Blocklist | CIDR-ზე დაფუძნებული IP-ის ფილტრაცია |
| 5 | CC/DDoS Rate Limiter | IP-ის მიხედვით სრიალ-ფანჯრის rate limiting |
| 6 | სკანერ-გამოვლენა | დაუცველობ-სკანერ-fingerprints (Nmap, Nikto და სხვ.) |
| 7 | ბოტ-გამოვლენა | მავნე ბოტები, AI crawlers, headless ბრაუზერები |
| 8 | SQL Injection | libinjection + regex შაბლონები |
| 9 | XSS | libinjection + regex შაბლონები |
| 10 | RCE / ბრძანებ-ინექცია | OS ბრძანებ-ინექციის შაბლონები |
| 11 | Directory Traversal | Path traversal (`../`) გამოვლენა |
| 14 | სენსიტიური მონაცემი | Aho-Corasick მრავალ-შაბლონ PII/სერთიფიკატ-გამოვლენა |
| 15 | ანტი-Hotlinking | ჰოსტ-მიხედვით Referer-ზე დაფუძნებული ვალიდაცია |
| 16 | CrowdSec | Bouncer გადაწყვეტილებები + AppSec ინსპექტირება |

## წესების განახლება

წესები შეტანილი ხელსაწყოებით upstream-წყაროებიდან სინქრონიზებული შეიძლება:

```bash
# Check for updates
python rules/tools/sync.py --check

# Sync OWASP CRS to a specific release
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/ --tag v4.10.0

# Sync to latest
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/

# Hot-reload after updating
prx-waf rules reload
```

## წეს-სტატისტიკა

მიმდინარე წეს-სტატისტიკის CLI-ის გავლით ნახვა:

```bash
prx-waf rules stats
```

მაგალითი-გამოტანა:

```
Rule Statistics
===============
  OWASP CRS:    310 rules (21 files)
  ModSecurity:   46 rules (4 files)
  CVE Patches:   39 rules (7 files)
  Custom:         3 rules (1 file)
  ─────────────────────────
  Total:        398 rules (33 files)

  Enabled:      395
  Disabled:       3
  Paranoia 1:   280
  Paranoia 2:    78
  Paranoia 3:    30
  Paranoia 4:    10
```

## შემდეგი ნაბიჯები

- [მომხმარებლის წესები](./custom-rules) -- საკუთარი წესების დაწერა
- [YAML სინტაქსი](./yaml-syntax) -- წეს-სქემის სრული ცნობარი
- [წეს-ძრავის მიმოხილვა](./index) -- პაიფლაინის წეს-შეფასება
