---
title: CrowdSec ინტეგრაცია
description: "PRX-WAF CrowdSec ინტეგრაცია კოლაბორატიული საფრთხის ინტელექტისთვის. Bouncer რეჟიმი in-memory გადაწყვეტილებ-ქეშით, AppSec რეჟიმი HTTP-ის რეალურ დროში ანალიზისთვის და log pusher საზოგადოებრივი გაზიარებისთვის."
---

# CrowdSec ინტეგრაცია

PRX-WAF [CrowdSec](https://www.crowdsec.net/)-თან ინტეგრირდება, კოლაბორატიული, საზოგადოებრივ-მართული საფრთხის ინტელექტი პირდაპირ WAF-ის გამოვლენის პაიფლაინში შეაქვს. მხოლოდ ლოკალურ წესებსა და ევრისტიკაზე დამოკიდებულების ნაცვლად PRX-WAF-ს შეუძლია CrowdSec ქსელის გამოყენება -- სადაც ათასობით მანქანა შეტევ-სიგნალებს რეალურ დროში იზიარებს -- ცნობილი მავნე IP-ების დასაბლოკად, პროგრამ-ფენ-შეტევების გამოსავლენად და WAF-ის მოვლენების საზოგადოებაზე გასაყვანად.

ინტეგრაცია **სამ რეჟიმში** მუშაობს, რომლებიც დამოუკიდებლად ან ერთად შეიძლება გამოვიყენოთ:

| რეჟიმი | მიზანი | Latency | პაიფლაინ-ფაზა |
|------|---------|---------|----------------|
| **Bouncer** | ქეშ-LAPI გადაწყვეტილებებიანი IP-ების ბლოკვა | მიკროწამები (in-memory) | ფაზა 16a |
| **AppSec** | სრული HTTP მოთხოვნების CrowdSec AppSec-ის გავლით ანალიზი | მილიწამები (HTTP გამოძახება) | ფაზა 16b |
| **Log Pusher** | WAF-ის მოვლენების LAPI-ზე ანგარიშდება | ასინქრონული (ჯგუფებად) | ფონი |

## მუშაობა

### Bouncer რეჟიმი

Bouncer რეჟიმი CrowdSec Local API-სთან (LAPI) სინქრონიზებულ **in-memory გადაწყვეტილებ-ქეშს** ინახავს. გამოვლენის პაიფლაინის ფაზა 16a-ზე მოთხოვნის მოსვლისას PRX-WAF ქეშის O(1) ძებნას ახდენს:

```
Request IP ──> DashMap (exact IP match) ──> Hit? ──> Apply decision (ban/captcha/throttle)
                     │
                     └──> Miss ──> RwLock<Vec> (CIDR range scan) ──> Hit? ──> Apply decision
                                          │
                                          └──> Miss ──> Allow (proceed to next phase)
```

ქეში კონფიგურირებადი ინტერვალით (ნაგულისხმევი: ყოველ 10 წამში) LAPI-ს `/v1/decisions` endpoint-ის polling-ის გავლით განახლდება. ეს დიზაინი IP-ის ძებნის ქსელ-I/O-ზე ბლოკვის თავიდან ასაცილებლად უზრუნველყოფს -- სინქრონიზაცია ფონ-ამოცანაში ხდება.

**მონაცემ-სტრუქტურები:**

- **DashMap** ზუსტი IP მისამართებისთვის -- lock-free concurrent hashmap, O(1) ძებნა
- **RwLock\<Vec\>** CIDR დიაპაზონებისთვის -- ქეშ-miss-ზე თანმიმდევრულად სკანდება, ჩვეულებრივ მცირე ნაკრები

**სცენარ-ფილტრაცია** სცენარ-სახელების მიხედვით გადაწყვეტილებების ჩართვა-გამოსართავ საშუალებას გვაძლევს:

```toml
# Only act on SSH brute-force and HTTP scanning scenarios
scenarios_containing = ["ssh-bf", "http-scan"]

# Ignore decisions from these scenarios
scenarios_not_containing = ["manual"]
```

### AppSec რეჟიმი

AppSec რეჟიმი HTTP მოთხოვნ-დეტალებს სრულად CrowdSec AppSec კომპონენტზე გზავნის რეალურ დროში ანალიზისთვის. IP-ების მხოლოდ-შემოწმების Bouncer რეჟიმისგან განსხვავებით AppSec მოთხოვნ-header-ებს, body-ს, URI-ს და მეთოდს SQL injection-ის, XSS-ისა და path traversal-ის გამოსავლენად ინსპექტირებს.

```
Request ──> Phase 16b ──> POST http://appsec:7422/
                           Body: { method, uri, headers, body }
                           ──> CrowdSec AppSec engine
                           ──> Response: allow / block (with details)
```

AppSec შემოწმება **ასინქრონულია** -- PRX-WAF მოთხოვნას კონფიგურირებადი timeout-ით (ნაგულისხმევი: 500ms) გზავნის. AppSec endpoint-ის მიუწვდომლობის ან timeout-ის შემთხვევაში `fallback_action` განსაზღვრავს, გაუშვას, დაბლოკოს ან ჟურნალაქციოს.

### Log Pusher

Log pusher WAF-ის უსაფრთხოების მოვლენებს CrowdSec LAPI-ზე აანგარიშებს, საზოგადოებრივ საფრთხის ინტელექტ-ქსელს წვლილს უკეთებს. LAPI-ს დატვირთვის მინიმიზაციისთვის მოვლენები ჯგუფდება და პერიოდულად იბარება.

**ჯგუფ-პარამეტრები:**

| პარამეტრი | მნიშვნელობა | აღწერა |
|-----------|-------|-------------|
| ჯგუფის ზომა | 50 მოვლენა | ბუფერის 50 მოვლენამდე შევსებისას ბარება |
| ბარება-ინტერვალი | 30 წამი | ბუფერ-გამოუვსებლობის შემთხვევაშიც ბარება |
| ავთენტიფიკაცია | Machine JWT | მანქან-ავთენტიფიკაციისთვის `pusher_login` / `pusher_password` |
| გამორთვა | საბოლოო ბარება | გამორთვამდე ყველა ბუფერ-მოვლენა ვიბარებთ |

## კონფიგურაცია

TOML კონფ-ფაილში `[crowdsec]` სექციის დამატება:

```toml
[crowdsec]
# Master switch
enabled = true

# Integration mode: "bouncer", "appsec", or "both"
mode = "both"

# --- Bouncer settings ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = use LAPI-provided duration
fallback_action = "allow"    # "allow" | "block" | "log"

# Scenario filtering (optional)
scenarios_containing = []
scenarios_not_containing = []

# --- AppSec settings ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- Log Pusher settings ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### კონფ-ცნობარი

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | CrowdSec ინტეგრაციის ჩართვა |
| `mode` | `string` | `"bouncer"` | ინტეგრ-რეჟიმი: `"bouncer"`, `"appsec"` ან `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI-ის base URL |
| `api_key` | `string` | `""` | Bouncer API გასაღები |
| `update_frequency_secs` | `integer` | `10` | LAPI-ისგან გადაწყვეტილებ-ქეშ-განახლების სიხშირე |
| `cache_ttl_secs` | `integer` | `0` | გადაწყვეტილებ-TTL-ის გადაფარვა. `0` LAPI-ის მიწოდებულ ხანგრძლივობას ნიშნავს. |
| `fallback_action` | `string` | `"allow"` | LAPI-ის ან AppSec-ის მიუწვდომლობისას ქმედება |
| `appsec_endpoint` | `string` | -- | CrowdSec AppSec endpoint-ის URL |
| `appsec_key` | `string` | -- | AppSec API გასაღები |
| `appsec_timeout_ms` | `integer` | `500` | AppSec HTTP მოთხოვნ-timeout (ms) |
| `pusher_login` | `string` | -- | LAPI ავთენტიფიკაციისთვის მანქან-login (log pusher) |
| `pusher_password` | `string` | -- | LAPI ავთენტიფიკაციისთვის მანქან-პაროლი (log pusher) |

## გამართვის სახელმძღვანელო

### წინაპირობები

1. PRX-WAF ჰოსტიდან ხელმისაწვდომი LAPI-ის მქონე მუშა CrowdSec ინსტანცია
2. Bouncer API გასაღები (Bouncer რეჟიმისთვის)
3. CrowdSec AppSec კომპონენტი (AppSec რეჟიმისთვის, სურვილისამებრ)
4. მანქან-სერთიფიკატები (Log Pusher-ისთვის, სურვილისამებრ)

### ნაბიჯი 1: CrowdSec-ის ინსტალაცია

CrowdSec-ის ჯერ არარსებობის შემთხვევაში:

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# Verify LAPI is running
sudo cscli metrics
```

### ნაბიჯი 2: Bouncer-ის რეგისტრაცია

```bash
# Create a bouncer API key for PRX-WAF
sudo cscli bouncers add prx-waf-bouncer

# Output:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# Copy this key -- it is only shown once.
```

### ნაბიჯი 3: PRX-WAF-ის კონფიგურაცია

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### ნაბიჯი 4: კავშირ-გადამოწმება

```bash
# Using the CLI
prx-waf crowdsec test

# Or via the API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### ნაბიჯი 5 (სურვილისამებრ): AppSec-ის ჩართვა

CrowdSec AppSec კომპონენტის გაშვებისას:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### ნაბიჯი 6 (სურვილისამებრ): Log Pusher-ის ჩართვა

CrowdSec-ზე WAF-ის მოვლენების გასაყვანად:

```bash
# Register a machine on the CrowdSec LAPI
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### ინტერაქტიული გამართვა

გამართვ-გამოცდილებისთვის CLI wizard-ის გამოყენება:

```bash
prx-waf crowdsec setup
```

Wizard LAPI URL-კონფ, API გასაღებ-შეყვანის, რეჟიმ-შერჩევისა და კავშირ-ტესტირების გავლით გგვიყვანს.

## CLI ბრძანებები

```bash
# Check integration status
prx-waf crowdsec status

# List active block/captcha decisions
prx-waf crowdsec decisions

# Test connectivity to CrowdSec LAPI
prx-waf crowdsec test

# Run the setup wizard
prx-waf crowdsec setup
```

## განასახების შაბლონები

### მხოლოდ-Bouncer (რეკომენდებული საწყისი წერტილი)

ყველაზე მარტივი განასახება. PRX-WAF CrowdSec LAPI-ისგან გადაწყვეტილებებს polling-ავს და ცნობილ მავნე IP-ებს ბლოკავს:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "allow"
```

### სრული ინტეგრაცია (Bouncer + AppSec + Pusher)

ორმხრივი საფრთხის ინტელექტით მაქსიმალური დაცვა:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "log"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
pusher_login = "prx-waf-machine"
pusher_password = "secure-password"
```

## პრობლემების მოგვარება

### LAPI კავშირი უარყოფილია

```bash
# Check CrowdSec status
sudo systemctl status crowdsec

# Verify LAPI is listening
sudo ss -tlnp | grep 8080
```

### არასწორი API გასაღები

```bash
# List existing bouncers
sudo cscli bouncers list

# Create a new bouncer key
sudo cscli bouncers add prx-waf-bouncer
```

## შემდეგი ნაბიჯები

- [კონფიგურაციის ცნობარი](../configuration/reference) -- TOML კონფ-სრული ცნობარი
- [CLI ცნობარი](../cli/) -- ყველა CLI ბრძანება CrowdSec ქვე-ბრძანებების ჩათვლით
- [წეს-ძრავა](../rules/) -- გამოვლენის პაიფლაინში CrowdSec-ის ადგილი
- [ადმინ UI](../admin-ui/) -- Dashboard-ისგან CrowdSec-ის მართვა
