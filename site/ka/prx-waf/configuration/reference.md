---
title: კონფიგურაციის ცნობარი
description: "PRX-WAF-ის TOML კონფ-ფაილ-ყოველი გასაღების სრული ცნობარი, ტიპებით, ნაგულისხმევი მნიშვნელობებითა და დეტალური აღწერებით."
---

# კონფიგურაციის ცნობარი

ეს გვერდი PRX-WAF-ის TOML კონფ-ფაილ-ყოველ კონფ-გასაღებს დოკუმენტირებს. ნაგულისხმევი კონფ-ფაილი `configs/default.toml`.

## Proxy-ის პარამეტრები (`[proxy]`)

Reverse proxy listener-ის მართვის პარამეტრები.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `listen_addr` | `string` | `"0.0.0.0:80"` | HTTP listener-ის მისამართი |
| `listen_addr_tls` | `string` | `"0.0.0.0:443"` | HTTPS listener-ის მისამართი |
| `worker_threads` | `integer \| null` | `null` (CPU-ის რაოდენობა) | Proxy worker thread-ების რაოდენობა. null-ის შემთხვევაში ლოგიკური CPU-ის ბირთვების რაოდენობა. |

## API-ის პარამეტრები (`[api]`)

მართვ-API-სა და ადმინ UI-ის პარამეტრები.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `listen_addr` | `string` | `"127.0.0.1:9527"` | ადმინ API + UI listener-ის მისამართი. წარმოებაში localhost-ზე შეზღუდვისთვის `127.0.0.1`-ზე მიბმა. |

## საცავის პარამეტრები (`[storage]`)

PostgreSQL მონაცემ-ბაზ-კავშირი.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `database_url` | `string` | `"postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"` | PostgreSQL კავშირ-URL |
| `max_connections` | `integer` | `20` | pool-ში მონაცემ-ბაზ-კავშირების მაქსიმალური რაოდენობა |

## ქეშ-პარამეტრები (`[cache]`)

in-memory moka LRU ქეშის გამოყენებით პასუხ-ქეშირების კონფიგურაცია.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `true` | პასუხ-ქეშირების ჩართვა |
| `max_size_mb` | `integer` | `256` | მაქსიმალური ქეშ-ზომა მეგაბაიტებში |
| `default_ttl_secs` | `integer` | `60` | ქეშ-პასუხების ნაგულისხმევი სიცოცხლის-ხანგრძლივობა (წამებში) |
| `max_ttl_secs` | `integer` | `3600` | მაქსიმალური TTL ზღვარი (წამებში). პასუხები upstream header-ების მიუხედავად ამაზე მეტ ხანს ვერ ქეშდება. |

## HTTP/3-ის პარამეტრები (`[http3]`)

HTTP/3 QUIC-ის (Quinn ბიბლიოთეკა) გავლით.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | HTTP/3 მხარდაჭერის ჩართვა |
| `listen_addr` | `string` | `"0.0.0.0:443"` | QUIC listener-ის მისამართი (UDP) |
| `cert_pem` | `string` | -- | TLS სერთიფიკატის გზა (PEM ფორმატი) |
| `key_pem` | `string` | -- | TLS პირადი გასაღების გზა (PEM ფორმატი) |

::: warning
HTTP/3-ს სწორი TLS სერთიფიკატები სჭირდება. `enabled = true`-ის შემთხვევაში `cert_pem` და `key_pem` ორივე დაყენებული უნდა იყოს.
:::

## უსაფრთხოების პარამეტრები (`[security]`)

ადმინ API-ისა და proxy-ის უსაფრთხოების კონფიგურაცია.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `admin_ip_allowlist` | `string[]` | `[]` | ადმინ API-ზე წვდომის IP/CIDR-ების სია. ცარიელი ყველას ნებას რთავს. |
| `max_request_body_bytes` | `integer` | `10485760` (10 MB) | მოთხოვნ-body-ის მაქსიმალური ზომა ბაიტებში. ლიმიტ-გამდინარე მოთხოვნები 413-ით უარიყოფა. |
| `api_rate_limit_rps` | `integer` | `0` | ადმინ API-ის IP-მიხედვით rate limit (მოთხოვნა წამში). `0` გამორთვას ნიშნავს. |
| `cors_origins` | `string[]` | `[]` | ადმინ API-ის CORS-ის დაშვებული origin-ები. ცარიელი ყველა origin-ს ნებას რთავს. |

## წეს-პარამეტრები (`[rules]`)

წეს-ძრავის კონფიგურაცია.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `dir` | `string` | `"rules/"` | წეს-ფაილების შემცველი დირექტორია |
| `hot_reload` | `boolean` | `true` | წეს-ავტო-reload-ისთვის ფაილ-სისტემ-მდევარი |
| `reload_debounce_ms` | `integer` | `500` | ფაილ-ცვლილებ-მოვლენების debounce ფანჯარა (ms) |
| `enable_builtin_owasp` | `boolean` | `true` | ჩაშენებული OWASP CRS წესების ჩართვა |
| `enable_builtin_bot` | `boolean` | `true` | ჩაშენებული ბოტ-გამოვლენ-წესების ჩართვა |
| `enable_builtin_scanner` | `boolean` | `true` | ჩაშენებული სკანერ-გამოვლენ-წესების ჩართვა |

### წეს-წყაროები (`[[rules.sources]]`)

მრავალი წეს-წყაროს (ლოკალური დირექტორიები ან დისტანციური URL-ები) კონფიგურაცია:

| გასაღები | ტიპი | საჭირო | აღწერა |
|-----|------|----------|-------------|
| `name` | `string` | კი | წყარო-სახელი (მაგ. `"custom"`, `"owasp-crs"`) |
| `path` | `string` | არა | ლოკალური დირექტორიის გზა |
| `url` | `string` | არა | წეს-ამოღებისთვის დისტანციური URL |
| `format` | `string` | კი | წეს-ფორმატი: `"yaml"`, `"json"` ან `"modsec"` |
| `update_interval` | `integer` | არა | ავტო-განახლების ინტერვალი წამებში (მხოლოდ დისტანციური წყაროებისთვის) |

```toml
[[rules.sources]]
name   = "custom"
path   = "rules/custom/"
format = "yaml"

[[rules.sources]]
name            = "owasp-crs"
url             = "https://example.com/rules/owasp.yaml"
format          = "yaml"
update_interval = 86400
```

## CrowdSec-ის პარამეტრები (`[crowdsec]`)

CrowdSec-ის საფრთხ-ინტელ-ინტეგრაცია.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | CrowdSec ინტეგრაციის ჩართვა |
| `mode` | `string` | `"bouncer"` | ინტეგრ-რეჟიმი: `"bouncer"`, `"appsec"` ან `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | CrowdSec LAPI URL |
| `api_key` | `string` | `""` | Bouncer API გასაღები |
| `update_frequency_secs` | `integer` | `10` | გადაწყვეტილებ-ქეშ-განახლებ-ინტერვალი (წამებში) |
| `fallback_action` | `string` | `"allow"` | LAPI-ის მიუწვდომლობისას ქმედება: `"allow"`, `"block"` ან `"log"` |
| `appsec_endpoint` | `string` | -- | AppSec HTTP ინსპექტ-endpoint-ის URL (სურვილისამებრ) |
| `appsec_key` | `string` | -- | AppSec API გასაღები (სურვილისამებრ) |

## ჰოსტ-კონფიგურაცია (`[[hosts]]`)

სტატიკური ჰოსტ-ჩანაწერები (ადმინ UI/API-ის გავლითაც შეიძლება იმართოს):

| გასაღები | ტიპი | საჭირო | აღწერა |
|-----|------|----------|-------------|
| `host` | `string` | კი | შესაბამობის დომენ-სახელი |
| `port` | `integer` | კი | მოსასმენი პორტი (ჩვეულებრივ 80 ან 443) |
| `remote_host` | `string` | კი | Upstream backend-ის IP ან hostname |
| `remote_port` | `integer` | კი | Upstream backend-ის პორტი |
| `ssl` | `boolean` | არა | upstream-ზე HTTPS-ის გამოყენება (ნაგულისხმევი: false) |
| `guard_status` | `boolean` | არა | WAF-ის დაცვის ჩართვა (ნაგულისხმევი: true) |

## Cluster-ის პარამეტრები (`[cluster]`)

მრავალ-კვანძი cluster-კონფიგურაცია. დეტალებისთვის [Cluster-ის რეჟიმს](../cluster/) ნახე.

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | Cluster-ის რეჟიმის ჩართვა |
| `node_id` | `string` | `""` (ავტო) | კვანძის უნიკალური იდენტიფიკატორი. ცარიელის შემთხვევაში ავტო-გენერირდება. |
| `role` | `string` | `"auto"` | კვანძ-როლი: `"auto"`, `"main"` ან `"worker"` |
| `listen_addr` | `string` | `"0.0.0.0:16851"` | კვანძ-კომუნიკაციისთვის QUIC-მოსასმენი |
| `seeds` | `string[]` | `[]` | Cluster-ის join-ისთვის seed კვანძ-მისამართები |

### Cluster-ის Crypto (`[cluster.crypto]`)

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `ca_cert` | `string` | -- | CA სერთიფიკატის გზა (PEM) |
| `ca_key` | `string` | -- | CA პირადი გასაღების გზა (მხოლოდ main კვანძი) |
| `node_cert` | `string` | -- | კვანძ-სერთიფიკატის გზა (PEM) |
| `node_key` | `string` | -- | კვანძ-პირადი გასაღების გზა (PEM) |
| `auto_generate` | `boolean` | `true` | პირველ სტარტზე სერთიფიკატების ავტო-გენერება |
| `ca_validity_days` | `integer` | `3650` | CA სერთიფიკატ-ვადა (დღეები) |
| `node_validity_days` | `integer` | `365` | კვანძ-სერთიფიკატ-ვადა (დღეები) |
| `renewal_before_days` | `integer` | `7` | ვადის გასვლამდე ამ დღეებით ადრე ავტო-განახლება |

### Cluster-ის Sync (`[cluster.sync]`)

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `rules_interval_secs` | `integer` | `10` | წეს-ვერსი-შემოწმების ინტერვალი |
| `config_interval_secs` | `integer` | `30` | კონფ-სინქრ-ინტერვალი |
| `events_batch_size` | `integer` | `100` | ამ რაოდენობისას მოვლენ-ჯგუფ-ბარება |
| `events_flush_interval_secs` | `integer` | `5` | ჯგუფ-გამოუვსებლობის შემთხვევაშიც მოვლენ-ბარება |
| `stats_interval_secs` | `integer` | `10` | სტატისტ-ანგარიშ-ინტერვალი |
| `events_queue_size` | `integer` | `10000` | მოვლენ-რიგ-ზომა (სავსეობისას უძველესი ეცლება) |

### Cluster-ის Election (`[cluster.election]`)

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `timeout_min_ms` | `integer` | `150` | მინიმალური election timeout (ms) |
| `timeout_max_ms` | `integer` | `300` | მაქსიმალური election timeout (ms) |
| `heartbeat_interval_ms` | `integer` | `50` | Main-დან worker-ზე heartbeat ინტერვალი (ms) |
| `phi_suspect` | `float` | `8.0` | Phi accrual საეჭვო ბარიერი |
| `phi_dead` | `float` | `12.0` | Phi accrual მკვდარი ბარიერი |

### Cluster-ის Health (`[cluster.health]`)

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|-----|------|---------|-------------|
| `check_interval_secs` | `integer` | `5` | Health check-ის სიხშირე |
| `max_missed_heartbeats` | `integer` | `3` | N-ის შემდეგ peer-ის არაჯანსაღად ნიშვნა |

## ნაგულისხმევი კონფ-ფაილი

ცნობარისთვის საცავში [default.toml](https://github.com/openprx/prx-waf/blob/main/configs/default.toml) ფაილი ნახე.

## შემდეგი ნაბიჯები

- [კონფ-მიმოხილვა](./index) -- კონფ-ფენების ურთიერთმუშაობა
- [Cluster-ის განასახება](../cluster/deployment) -- cluster-სპეციფ-კონფ
- [წეს-ძრავა](../rules/) -- წეს-ძრავ-პარამეტრები დეტალურად
