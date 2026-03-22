---
title: CLI ბრძანებ-ცნობარი
description: "PRX-WAF-ის ყველა CLI ბრძანებისა და ქვე-ბრძანების სრული ცნობარი. სერვერ-მართვა, წეს-ოპერაციები, CrowdSec ინტეგრაცია და ბოტ-გამოვლენა."
---

# CLI ბრძანებ-ცნობარი

`prx-waf` ბრძანებ-ხაზ-ინტერფეისი სერვერ-მართვის, წეს-ოპერაციების, CrowdSec ინტეგრაციისა და ბოტ-გამოვლენის ბრძანებებს გვაძლევს.

## გლობალური პარამეტრები

| ნიშანი | ნაგულისხმევი | აღწერა |
|------|---------|-------------|
| `-c, --config <FILE>` | `configs/default.toml` | TOML კონფ-ფაილის გზა |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## სერვერ-ბრძანებები

| ბრძანება | აღწერა |
|---------|-------------|
| `prx-waf run` | Reverse proxy + მართვ-API-ის გაშვება (გამუდმებით ბლოკავს) |
| `prx-waf migrate` | მხოლოდ მონაცემ-ბაზ-მიგრაციების გაშვება |
| `prx-waf seed-admin` | ნაგულისხმევი ადმინ-მომხმარებლის შექმნა (admin/admin) |

```bash
# Start the server
prx-waf -c configs/default.toml run

# Run migrations before first start
prx-waf -c configs/default.toml migrate

# Create admin user
prx-waf -c configs/default.toml seed-admin
```

::: tip
პირველ-ჯერადი გამართვისთვის `run`-მდე `migrate` და `seed-admin` გაუშვი. შემდეგი სტარტები მხოლოდ `run`-ს საჭიროებს -- მიგრაციები ავტომატურად მოწმდება.
:::

## წეს-მართვა

გამოვლენ-წეს-მართვის ბრძანებები. ყველა წეს-ბრძანება კონფიგურირებულ წეს-დირექტორიაზე ოპერირებს.

| ბრძანება | აღწერა |
|---------|-------------|
| `prx-waf rules list` | ყველა ჩატვირთული წეს-ის ჩამოთვლა |
| `prx-waf rules list --category <CAT>` | კატეგორიის მიხედვით ფილტრაცია |
| `prx-waf rules list --source <SRC>` | წყაროს მიხედვით ფილტრაცია |
| `prx-waf rules info <RULE-ID>` | წეს-ის შესახებ დეტალური ინფო |
| `prx-waf rules enable <RULE-ID>` | გამორთული წეს-ის ჩართვა |
| `prx-waf rules disable <RULE-ID>` | წეს-ის გამორთვა |
| `prx-waf rules reload` | ყველა წეს-ის დისკიდან hot-reload |
| `prx-waf rules validate <PATH>` | წეს-ფაილ-სისწორის ვალიდაცია |
| `prx-waf rules import <PATH\|URL>` | ფაილიდან ან URL-იდან წეს-ის იმპორტი |
| `prx-waf rules export [--format yaml]` | მიმდინარე წეს-ნაკრების ექსპორტი |
| `prx-waf rules update` | დისტ-წყაროებიდან უახლესი წეს-ების ამოღება |
| `prx-waf rules search <QUERY>` | სახელის ან აღწერის მიხედვით ძებნა |
| `prx-waf rules stats` | წეს-სტატისტიკის ჩვენება |

### მაგალითები

```bash
# List all SQL injection rules
prx-waf rules list --category sqli

# List OWASP CRS rules
prx-waf rules list --source owasp

# Show details for a specific rule
prx-waf rules info CRS-942100

# Disable a rule causing false positives
prx-waf rules disable CRS-942100

# Hot-reload after editing rules
prx-waf rules reload

# Validate custom rules before deploying
prx-waf rules validate rules/custom/myapp.yaml

# Import rules from a URL
prx-waf rules import https://example.com/rules/custom.yaml

# Export all rules as YAML
prx-waf rules export --format yaml > all-rules.yaml

# View statistics
prx-waf rules stats
```

## წეს-წყარო-მართვა

დისტ-წეს-წყაროების მართვის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `prx-waf sources list` | კონფ-წეს-წყაროების ჩამოთვლა |
| `prx-waf sources add <NAME> <URL>` | დისტ-წეს-წყაროს დამატება |
| `prx-waf sources remove <NAME>` | წეს-წყაროს ამოღება |
| `prx-waf sources update [NAME]` | კონკრ-წყაროდან (ან ყველაიდან) უახლესის ამოღება |
| `prx-waf sources sync` | ყველა დისტ-წყაროს სინქრონიზება |

### მაგალითები

```bash
# List all sources
prx-waf sources list

# Add a custom source
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# Sync all sources
prx-waf sources sync

# Update a specific source
prx-waf sources update owasp-crs
```

## CrowdSec ინტეგრაცია

CrowdSec-ის საფრთხ-ინტელ-ინტეგრ-მართვის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `prx-waf crowdsec status` | CrowdSec ინტეგრ-სტატუსის ჩვენება |
| `prx-waf crowdsec decisions` | LAPI-ის აქტიური გადაწყვეტილებების ჩამოთვლა |
| `prx-waf crowdsec test` | LAPI-კავშირ-ტესტი |
| `prx-waf crowdsec setup` | ინტერაქტიული CrowdSec-გამართვ-wizard |

### მაგალითები

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

## ბოტ-გამოვლენა

ბოტ-გამოვლენ-წეს-მართვის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `prx-waf bot list` | ცნობილი ბოტ-სიგნატურების ჩამოთვლა |
| `prx-waf bot add <PATTERN> [--action ACTION]` | ბოტ-გამოვლენ-შაბლონის დამატება |
| `prx-waf bot remove <PATTERN>` | ბოტ-გამოვლენ-შაბლონის ამოღება |
| `prx-waf bot test <USER-AGENT>` | user-agent-ის ბოტ-წეს-ებთან ტესტი |

### მაგალითები

```bash
# List all bot signatures
prx-waf bot list

# Add a new bot pattern
prx-waf bot add "(?i)my-bad-bot" --action block

# Add a bot pattern in log-only mode
prx-waf bot add "(?i)suspicious-crawler" --action log

# Test a user-agent string
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# Remove a bot pattern
prx-waf bot remove "(?i)my-bad-bot"
```

## გამოყენების შაბლონები

### პირველ-ჯერადი გამართვა

```bash
# 1. Run migrations
prx-waf -c configs/default.toml migrate

# 2. Create admin user
prx-waf -c configs/default.toml seed-admin

# 3. Start the server
prx-waf -c configs/default.toml run
```

### წეს-მოვლის სამუშაო ნაკადი

```bash
# 1. Check for upstream rule updates
prx-waf rules update

# 2. Validate after update
prx-waf rules validate rules/

# 3. Review changes
prx-waf rules stats

# 4. Hot-reload
prx-waf rules reload
```

### CrowdSec ინტეგრ-გამართვა

```bash
# 1. Run the setup wizard
prx-waf crowdsec setup

# 2. Test connectivity
prx-waf crowdsec test

# 3. Verify decisions are flowing
prx-waf crowdsec decisions
```

## შემდეგი ნაბიჯები

- [სწრაფი დაწყება](../getting-started/quickstart) -- PRX-WAF-ის დაწყება
- [წეს-ძრავა](../rules/) -- გამოვლენის პაიფლაინის გაგება
- [კონფ-ცნობარი](../configuration/reference) -- ყველა კონფ-გასაღები
