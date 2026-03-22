---
title: კონფიგურაციის მიმოხილვა
description: "PRX-WAF-ის კონფიგურაციის მუშაობა. TOML კონფ-ფაილ-სტრუქტურა, გარემო-ცვლად-გადაფარვები და ფაილ-დაფუძნებულ-კონფ-ისა და მონაცემთა-ბაზ-შენახულ-კონფ-ის ურთიერთობა."
---

# კონფიგურაცია

PRX-WAF `-c` / `--config` ნიშნის გავლით გადაცემული TOML ფაილით კონფიგურირდება. ნაგულისხმევი გზა: `configs/default.toml`.

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## კონფ-წყაროები

PRX-WAF კონფიგურაციის ორ ფენას იყენებს:

| წყარო | სფერო | აღწერა |
|--------|-------|-------------|
| TOML ფაილი | სერვერ-სტარტი | Proxy-პორტები, მონაცემთა ბაზ-URL, ქეში, HTTP/3, უსაფრთხოება, cluster |
| მონაცემთა ბაზა | Runtime | ჰოსტები, წესები, სერთიფიკატები, plugin-ები, tunnels, შეტყობინებები |

TOML ფაილი სტარტ-დროს საჭირო პარამეტრებს შეიცავს (პორტები, მონაცემ-ბაზ-კავშირი, cluster-კონფ). Runtime-პარამეტრები, ჰოსტები და წესები PostgreSQL-ში ინახება და ადმინ UI-ის ან REST API-ის გავლით იმართება.

## კონფ-ფაილ-სტრუქტურა

TOML კონფ-ფაილს შემდეგი სექციები აქვს:

```toml
[proxy]          # Reverse proxy listener addresses
[api]            # Admin API listener address
[storage]        # PostgreSQL connection
[cache]          # Response cache settings
[http3]          # HTTP/3 QUIC settings
[security]       # Admin API security (IP allowlist, rate limit, CORS)
[rules]          # Rule engine settings (directory, hot-reload, sources)
[crowdsec]       # CrowdSec integration
[cluster]        # Cluster mode (optional)
```

### მინიმალური კონფიგურაცია

განვითარებისთვის მინიმალური კონფიგურაცია:

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### წარმოებ-კონფიგურაცია

ყველა უსაფრთხოებ-ფუნქციანი წარმოებ-კონფიგურაცია:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## ჰოსტ-კონფიგურაცია

ჰოსტები TOML ფაილში სტატიკური განასახებებისთვის შეიძლება განისაზღვროს:

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
დინამიური გარემოებისთვის ჰოსტების TOML ფაილის ნაცვლად ადმინ UI-ის ან REST API-ის გავლით მართვა. მონაცემ-ბაზ-შენახული ჰოსტები TOML-განსაზღვრულ ჰოსტებს გადაფარავს.
:::

## მონაცემ-ბაზ-მიგრაციები

PRX-WAF 8 მიგრაციის ფაილს შეიცავს, რომლებიც საჭირო მონაცემ-ბაზ-სქემას ქმნის:

```bash
# Run migrations
prx-waf -c configs/default.toml migrate

# Create default admin user
prx-waf -c configs/default.toml seed-admin
```

მიგრაციები იდემპოტენტია და მრავალჯერ გაშვება-უსაფრთხოა.

## Docker-ის გარემო

Docker-განასახებებში კონფ-მნიშვნელობები ჩვეულებრივ `docker-compose.yml`-ში ყენდება:

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## შემდეგი ნაბიჯები

- [კონფიგურაციის ცნობარი](./reference) -- ყოველი TOML გასაღები ტიპებითა და ნაგულისხმევებით
- [ინსტალაცია](../getting-started/installation) -- საწყისი გამართვა და მონაცემ-ბაზ-მიგრაციები
- [Cluster-ის რეჟიმი](../cluster/) -- cluster-სპეციფიკური კონფიგურაცია
