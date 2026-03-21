---
title: კონფიგურაციის მითითება
description: PRX კონფიგურაციის ყველა სექციისა და ვარიანტის სრული ველ-ველზე მითითება.
---

# კონფიგურაციის მითითება

ეს გვერდი დოკუმენტირებს PRX-ის `config.toml`-ის ყველა კონფიგურაციის სექციასა და ველს. ნაგულისხმევი მნიშვნელობით აღნიშნული ველები შეიძლება გამოტოვდეს -- PRX გამოიყენებს ნაგულისხმევ მნიშვნელობას.

## ზედა დონე (ნაგულისხმევი პარამეტრები)

ეს ველები `config.toml`-ის ძირითად დონეზე ჩნდება, ნებისმიერი სექციის სათაურის გარეთ.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `default_provider` | `string` | `"openrouter"` | პროვაიდერის ID ან მეტსახელი (მაგ., `"anthropic"`, `"openai"`, `"ollama"`) |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | მოდელის იდენტიფიკატორი, რომელიც მარშრუტიზირდება არჩეული პროვაიდერის მეშვეობით |
| `default_temperature` | `float` | `0.7` | სემპლინგის ტემპერატურა (0.0--2.0). დაბალი = უფრო დეტერმინისტული |
| `api_key` | `string?` | `null` | API გასაღები არჩეული პროვაიდერისთვის. ჩანაცვლებულია პროვაიდერის სპეციფიკური გარემოს ცვლადებით |
| `api_url` | `string?` | `null` | პროვაიდერის API-ის საბაზისო URL-ის ჩანაცვლება (მაგ., დისტანციური Ollama ენდფოინთი) |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

HTTP გეითვეი სერვერი webhook ენდფოინთებისთვის, დაწყვილებისა და ვებ API-სთვის.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `host` | `string` | `"127.0.0.1"` | მიბმის მისამართი. გამოიყენეთ `"0.0.0.0"` საჯარო წვდომისთვის |
| `port` | `u16` | `16830` | მოსმენის პორტი |
| `require_pairing` | `bool` | `true` | მოწყობილობის დაწყვილების მოთხოვნა API მოთხოვნების მიღებამდე |
| `allow_public_bind` | `bool` | `false` | არა-localhost-ზე მიბმის ნებართვა გვირაბის გარეშე |
| `pair_rate_limit_per_minute` | `u32` | `5` | მაქსიმალური დაწყვილების მოთხოვნები წუთში კლიენტზე |
| `webhook_rate_limit_per_minute` | `u32` | `60` | მაქსიმალური webhook მოთხოვნები წუთში კლიენტზე |
| `api_rate_limit_per_minute` | `u32` | `120` | მაქსიმალური API მოთხოვნები წუთში ავთენტიფიცირებულ ტოკენზე |
| `trust_forwarded_headers` | `bool` | `false` | `X-Forwarded-For` / `X-Real-IP` სათაურებისადმი ნდობა (ჩართეთ მხოლოდ რევერს პროქსის უკან) |
| `request_timeout_secs` | `u64` | `300` | HTTP მამუშავებლის ლიმიტი წამებში |
| `idempotency_ttl_secs` | `u64` | `300` | TTL webhook იდემპოტენტურობის გასაღებებისთვის |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
`host` ან `port`-ის შეცვლა მოითხოვს სრულ გადატვირთვას. ეს მნიშვნელობები მიბმულია სერვერის გაშვებისას და ვერ გადატვირთდება ცხლად.
:::

## `[channels_config]`

ზედა დონის არხის კონფიგურაცია. ცალკეული არხები ჩადგმული ქვესექციებია.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `cli` | `bool` | `true` | ინტერაქტიული CLI არხის ჩართვა |
| `message_timeout_secs` | `u64` | `300` | შეტყობინების დამუშავების ლიმიტი (LLM + ინსტრუმენტები) |

### `[channels_config.telegram]`

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `bot_token` | `string` | *(აუცილებელი)* | Telegram Bot API ტოკენი @BotFather-იდან |
| `allowed_users` | `string[]` | `[]` | ნებადართული Telegram მომხმარებლის ID-ები ან სახელები. ცარიელი = ყველას აკრძალვა |
| `mention_only` | `bool` | `false` | ჯგუფებში მხოლოდ @-მოხსენიების შეტყობინებებზე პასუხი |
| `stream_mode` | `"off" \| "partial"` | `"off"` | სტრიმინგის რეჟიმი: `off` აგზავნის სრულ პასუხს, `partial` პროგრესულად არედაქტირებს მონახაზს |
| `draft_update_interval_ms` | `u64` | `1000` | მონახაზის რედაქტირებებს შორის მინიმალური ინტერვალი (რეიტ ლიმიტის დაცვა) |
| `interrupt_on_new_message` | `bool` | `false` | მიმდინარე მოთხოვნის გაუქმება, როდესაც იგივე მომხმარებელი ახალ შეტყობინებას აგზავნის |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `bot_token` | `string` | *(აუცილებელი)* | Discord ბოტის ტოკენი Developer Portal-იდან |
| `guild_id` | `string?` | `null` | შეზღუდვა ერთ guild-ზე (სერვერი) |
| `allowed_users` | `string[]` | `[]` | ნებადართული Discord მომხმარებლის ID-ები. ცარიელი = ყველას აკრძალვა |
| `listen_to_bots` | `bool` | `false` | სხვა ბოტების შეტყობინებების დამუშავება (საკუთარი შეტყობინებები ყოველთვის იგნორირდება) |
| `mention_only` | `bool` | `false` | მხოლოდ @-მოხსენიებებზე პასუხი |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `bot_token` | `string` | *(აუცილებელი)* | Slack ბოტის OAuth ტოკენი (`xoxb-...`) |
| `app_token` | `string?` | `null` | აპლიკაციის დონის ტოკენი Socket Mode-ისთვის (`xapp-...`) |
| `channel_id` | `string?` | `null` | შეზღუდვა ერთ არხზე |
| `allowed_users` | `string[]` | `[]` | ნებადართული Slack მომხმარებლის ID-ები. ცარიელი = ყველას აკრძალვა |
| `mention_only` | `bool` | `false` | ჯგუფებში მხოლოდ @-მოხსენიებებზე პასუხი |

### `[channels_config.lark]`

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `app_id` | `string` | *(აუცილებელი)* | Lark/Feishu App ID |
| `app_secret` | `string` | *(აუცილებელი)* | Lark/Feishu App Secret |
| `encrypt_key` | `string?` | `null` | მოვლენის დაშიფვრის გასაღები |
| `verification_token` | `string?` | `null` | მოვლენის ვერიფიკაციის ტოკენი |
| `allowed_users` | `string[]` | `[]` | ნებადართული მომხმარებლის ID-ები. ცარიელი = ყველას აკრძალვა |
| `use_feishu` | `bool` | `false` | Feishu (ჩინეთი) API ენდფოინთების გამოყენება Lark-ის (საერთაშორისო) ნაცვლად |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | შეტყობინების მიღების რეჟიმი |
| `port` | `u16?` | `null` | Webhook მოსმენის პორტი (მხოლოდ webhook რეჟიმისთვის) |
| `mention_only` | `bool` | `false` | მხოლოდ @-მოხსენიებებზე პასუხი |

PRX ასევე მხარს უჭერს ამ დამატებით არხებს (კონფიგურირდება `[channels_config.*]`-ში):

- **Matrix** -- `homeserver`, `access_token`, ოთახის ნებართვების სიები
- **Signal** -- signal-cli REST API-ის მეშვეობით
- **WhatsApp** -- Cloud API ან Web რეჟიმი
- **iMessage** -- მხოლოდ macOS, კონტაქტების ნებართვების სიები
- **DingTalk** -- Stream Mode `client_id` / `client_secret`-ით
- **QQ** -- ოფიციალური Bot SDK `app_id` / `app_secret`-ით
- **Email** -- IMAP/SMTP
- **IRC** -- სერვერი, არხი, მეტსახელი
- **Mattermost** -- URL + ბოტის ტოკენი
- **Nextcloud Talk** -- საბაზისო URL + აპლიკაციის ტოკენი
- **Webhook** -- ზოგადი შემომავალი webhook-ები

## `[memory]`

მეხსიერების ბექენდი საუბრის ისტორიისთვის, ცოდნისა და ემბედინგებისთვის.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `backend` | `string` | `"sqlite"` | ბექენდის ტიპი: `"sqlite"`, `"lucid"`, `"postgres"`, `"markdown"`, `"none"` |
| `auto_save` | `bool` | `true` | მომხმარებლის საუბრის შეტანის ავტომატური შენახვა მეხსიერებაში |
| `acl_enabled` | `bool` | `false` | მეხსიერების წვდომის კონტროლის სიების ჩართვა |
| `hygiene_enabled` | `bool` | `true` | პერიოდული არქივაციისა და შენარჩუნების გაწმენდის გაშვება |
| `archive_after_days` | `u32` | `7` | ყოველდღიური/სესიის ფაილების არქივაცია ამ ვადის შემდეგ |
| `purge_after_days` | `u32` | `30` | არქივირებული ფაილების წაშლა ამ ვადის შემდეგ |
| `conversation_retention_days` | `u32` | `3` | SQLite: საუბრის სტრიქონების წაშლა ამ ვადის შემდეგ |
| `daily_retention_days` | `u32` | `7` | SQLite: ყოველდღიური სტრიქონების წაშლა ამ ვადის შემდეგ |
| `embedding_provider` | `string` | `"none"` | ემბედინგის პროვაიდერი: `"none"`, `"openai"`, `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | ემბედინგის მოდელის სახელი |
| `embedding_dimensions` | `usize` | `1536` | ემბედინგის ვექტორის განზომილებები |
| `vector_weight` | `f64` | `0.7` | ვექტორის მსგავსების წონა ჰიბრიდულ ძიებაში (0.0--1.0) |
| `keyword_weight` | `f64` | `0.3` | BM25 საკვანძო სიტყვების ძიების წონა (0.0--1.0) |
| `min_relevance_score` | `f64` | `0.4` | მინიმალური ჰიბრიდული ქულა მეხსიერების კონტექსტში ჩართვისთვის |
| `embedding_cache_size` | `usize` | `10000` | მაქსიმალური ემბედინგის ქეშის ჩანაწერები LRU წაშლამდე |
| `snapshot_enabled` | `bool` | `false` | ბირთვული მეხსიერებების ექსპორტი `MEMORY_SNAPSHOT.md`-ში |
| `snapshot_on_hygiene` | `bool` | `false` | სნეფშოთის გაშვება ჰიგიენის პასების დროს |
| `auto_hydrate` | `bool` | `true` | ავტომატური ჩატვირთვა სნეფშოთიდან, როდესაც `brain.db` აკლია |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

ევრისტიკული LLM მარშრუტიზატორი მრავალ-მოდელიანი განთავსებებისთვის. კანდიდატ მოდელებს აფასებს წონიანი ფორმულით, რომელიც აერთიანებს შესაძლებლობას, Elo რეიტინგს, ღირებულებას და ლატენტურობას.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `false` | ევრისტიკული მარშრუტიზაციის ჩართვა |
| `alpha` | `f32` | `0.0` | მსგავსების ქულის წონა |
| `beta` | `f32` | `0.5` | შესაძლებლობის ქულის წონა |
| `gamma` | `f32` | `0.3` | Elo ქულის წონა |
| `delta` | `f32` | `0.1` | ღირებულების ჯარიმის კოეფიციენტი |
| `epsilon` | `f32` | `0.1` | ლატენტურობის ჯარიმის კოეფიციენტი |
| `knn_enabled` | `bool` | `false` | KNN სემანტიკური მარშრუტიზაციის ჩართვა ისტორიიდან |
| `knn_min_records` | `usize` | `10` | მინიმალური ისტორიის ჩანაწერები, სანამ KNN იმოქმედებს მარშრუტიზაციაზე |
| `knn_k` | `usize` | `7` | უახლოესი მეზობლების რაოდენობა ხმის მიცემისთვის |

### `[router.automix]`

ადაპტური ესკალაციის პოლიტიკა: იწყება იაფი მოდელით, ესკალირდება პრემიუმზე, როდესაც ნდობა ვარდება.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `false` | Automix ესკალაციის ჩართვა |
| `confidence_threshold` | `f32` | `0.7` | ესკალაცია, როდესაც ნდობა ვარდება ამ ზღვრის ქვემოთ (0.0--1.0) |
| `cheap_model_tiers` | `string[]` | `[]` | მოდელის საფეხურები, რომლებიც "იაფ-ჯერ" განიხილება |
| `premium_model_id` | `string` | `""` | ესკალაციისთვის გამოყენებული მოდელი |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

ოპერაციული სისტემის დონის უსაფრთხოება: სენდბოქსინგი, რესურსის ლიმიტები და აუდიტის ლოგირება.

### `[security.sandbox]`

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool?` | `null` (ავტომატური აღმოჩენა) | სენდბოქსის იზოლაციის ჩართვა |
| `backend` | `string` | `"auto"` | ბექენდი: `"auto"`, `"landlock"`, `"firejail"`, `"bubblewrap"`, `"docker"`, `"none"` |
| `firejail_args` | `string[]` | `[]` | მორგებული Firejail არგუმენტები |

### `[security.resources]`

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `max_memory_mb` | `u32` | `512` | მაქსიმალური მეხსიერება ბრძანებაზე (MB) |
| `max_cpu_time_seconds` | `u64` | `60` | მაქსიმალური CPU დრო ბრძანებაზე |
| `max_subprocesses` | `u32` | `10` | ქვეპროცესების მაქსიმალური რაოდენობა |
| `memory_monitoring` | `bool` | `true` | მეხსიერების გამოყენების მონიტორინგის ჩართვა |

### `[security.audit]`

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `true` | აუდიტის ლოგირების ჩართვა |
| `log_path` | `string` | `"audit.log"` | აუდიტის ლოგის ფაილის გზა (კონფიგურაციის დირექტორიასთან შედარებით) |
| `max_size_mb` | `u32` | `100` | ლოგის მაქსიმალური ზომა როტაციამდე |
| `sign_events` | `bool` | `false` | მოვლენების ხელმოწერა HMAC-ით ხელშეუხებლობის მტკიცებულებისთვის |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

მეტრიკებისა და განაწილებული ტრეისინგის ბექენდი.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `backend` | `string` | `"none"` | ბექენდი: `"none"`, `"log"`, `"prometheus"`, `"otel"` |
| `otel_endpoint` | `string?` | `null` | OTLP ენდფოინთის URL (მაგ., `"http://localhost:4318"`) |
| `otel_service_name` | `string?` | `null` | სერვისის სახელი OTel კოლექტორისთვის (ნაგულისხმევი `"prx"`) |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

[Model Context Protocol](https://modelcontextprotocol.io/) სერვერის ინტეგრაცია. PRX მოქმედებს როგორც MCP კლიენტი, უკავშირდება გარე MCP სერვერებს დამატებითი ინსტრუმენტებისთვის.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `false` | MCP კლიენტის ინტეგრაციის ჩართვა |

### `[mcp.servers.<name>]`

თითოეული დასახელებული სერვერი არის ქვესექცია `[mcp.servers]`-ის ქვეშ.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `true` | სერვერის ჩართვის გადამრთველი |
| `transport` | `"stdio" \| "http"` | `"stdio"` | ტრანსპორტის ტიპი |
| `command` | `string?` | `null` | ბრძანება stdio რეჟიმისთვის |
| `args` | `string[]` | `[]` | ბრძანების არგუმენტები stdio რეჟიმისთვის |
| `url` | `string?` | `null` | URL HTTP ტრანსპორტისთვის |
| `env` | `map<string, string>` | `{}` | გარემოს ცვლადები stdio რეჟიმისთვის |
| `startup_timeout_ms` | `u64` | `10000` | გაშვების ლიმიტი |
| `request_timeout_ms` | `u64` | `30000` | მოთხოვნის ლიმიტი |
| `tool_name_prefix` | `string` | `"mcp"` | გამოქვეყნებული ინსტრუმენტის სახელების პრეფიქსი |
| `allow_tools` | `string[]` | `[]` | ინსტრუმენტების ნებართვების სია (ცარიელი = ყველა) |
| `deny_tools` | `string[]` | `[]` | ინსტრუმენტების აკრძალვის სია |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

ბრაუზერის ავტომატიზაციის ინსტრუმენტის კონფიგურაცია.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `false` | `browser_open` ინსტრუმენტის ჩართვა |
| `allowed_domains` | `string[]` | `[]` | ნებადართული დომენები (ზუსტი ან ქვედომენის დამთხვევა) |
| `session_name` | `string?` | `null` | დასახელებული ბრაუზერის სესია ავტომატიზაციისთვის |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

ვებ ძიებისა და URL-ის მოხელთების ინსტრუმენტის კონფიგურაცია.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `false` | `web_search` ინსტრუმენტის ჩართვა |
| `provider` | `string` | `"duckduckgo"` | ძიების პროვაიდერი: `"duckduckgo"` (უფასო) ან `"brave"` (მოითხოვს API გასაღებს) |
| `brave_api_key` | `string?` | `null` | Brave Search API გასაღები |
| `max_results` | `usize` | `5` | მაქსიმალური შედეგები ძიებაზე (1--10) |
| `timeout_secs` | `u64` | `15` | მოთხოვნის ლიმიტი |
| `fetch_enabled` | `bool` | `true` | `web_fetch` ინსტრუმენტის ჩართვა |
| `fetch_max_chars` | `usize` | `10000` | `web_fetch`-ის მიერ დაბრუნებული მაქსიმალური სიმბოლოები |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

Xin ავტონომიური ამოცანების ძრავა -- დაგეგმავს და ასრულებს ფონურ ამოცანებს, მათ შორის ევოლუციას, ფიტნეს შემოწმებებსა და ჰიგიენის ოპერაციებს.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `false` | Xin ამოცანების ძრავის ჩართვა |
| `interval_minutes` | `u32` | `5` | ტიკის ინტერვალი წუთებში (მინიმუმ 1) |
| `max_concurrent` | `usize` | `4` | მაქსიმალური ერთდროული ამოცანების შესრულება ტიკზე |
| `max_tasks` | `usize` | `128` | საცავში მაქსიმალური ამოცანების რაოდენობა |
| `stale_timeout_minutes` | `u32` | `60` | წუთები, სანამ გაშვებული ამოცანა მოძველებულად აღინიშნება |
| `builtin_tasks` | `bool` | `true` | ჩაშენებული სისტემური ამოცანების ავტომატური რეგისტრაცია |
| `evolution_integration` | `bool` | `false` | Xin-ს ევოლუციის/ფიტნესის დაგეგმვის მართვის ნებართვა |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

ხარჯვის ლიმიტები და მოდელის ფასი ხარჯების თვალყურის დევნებისთვის.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `false` | ხარჯების თვალყურის დევნების ჩართვა |
| `daily_limit_usd` | `f64` | `10.0` | ყოველდღიური ხარჯვის ლიმიტი USD-ში |
| `monthly_limit_usd` | `f64` | `100.0` | ყოველთვიური ხარჯვის ლიმიტი USD-ში |
| `warn_at_percent` | `u8` | `80` | გაფრთხილება, როდესაც ხარჯვა ლიმიტის ამ პროცენტს მიაღწევს |
| `allow_override` | `bool` | `false` | მოთხოვნების ნებართვა ბიუჯეტის გადაჭარბებისთვის `--override` ფლაგით |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

ხელახალი მცდელობისა და სარეზერვო ჯაჭვის კონფიგურაცია პროვაიდერთან გამძლე წვდომისთვის.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `max_retries` | `u32` | `3` | ხელახალი მცდელობების მაქსიმალური რაოდენობა გარდამავალი წარუმატებლობებისთვის |
| `fallback_providers` | `string[]` | `[]` | სარეზერვო პროვაიდერის სახელების რიგითი სია |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

დაშიფრული რწმუნებათა სიგელების საცავი ChaCha20-Poly1305-ის გამოყენებით.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `encrypt` | `bool` | `true` | კონფიგურაციაში API გასაღებებისა და ტოკენების დაშიფვრის ჩართვა |

## `[auth]`

გარე რწმუნებათა სიგელების იმპორტის პარამეტრები.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `codex_auth_json_auto_import` | `bool` | `true` | OAuth რწმუნებათა სიგელების ავტომატური იმპორტი Codex CLI `auth.json`-იდან |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | Codex CLI ავთენტიფიკაციის ფაილის გზა |

## `[proxy]`

გამავალი HTTP/HTTPS/SOCKS5 პროქსის კონფიგურაცია.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | `false` | პროქსის ჩართვა |
| `http_proxy` | `string?` | `null` | HTTP პროქსის URL |
| `https_proxy` | `string?` | `null` | HTTPS პროქსის URL |
| `all_proxy` | `string?` | `null` | ყველა სქემისთვის სარეზერვო პროქსი |
| `no_proxy` | `string[]` | `[]` | გვერდის ავლის სია (`NO_PROXY`-ის იგივე ფორმატი) |
| `scope` | `string` | `"zeroclaw"` | მოქმედების სფერო: `"environment"`, `"zeroclaw"`, `"services"` |
| `services` | `string[]` | `[]` | სერვისის სელექტორები, როდესაც მოქმედების სფეროა `"services"` |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```
