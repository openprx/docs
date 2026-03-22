---
title: Reverse Proxy-ის კონფიგურაცია
description: "PRX-WAF-ის reverse proxy-ად კონფიგურაცია. ჰოსტ-მარშრუტიზება, upstream backend-ები, დატვირთვის განაწილება, მოთხოვნა/პასუხ-header-ები და health check-ები."
---

# Reverse Proxy-ის კონფიგურაცია

PRX-WAF reverse proxy-ად მოქმედებს, კლიენტ-მოთხოვნებს WAF-ის გამოვლენის პაიფლაინის გავლის შემდეგ upstream backend სერვერებზე გადამისამართებს. ეს გვერდი ჰოსტ-მარშრუტიზებას, დატვირთვ-განაწილებასა და proxy-კონფიგურაციას მოიცავს.

## ჰოსტ-კონფიგურაცია

ყოველ დაცულ დომენს სჭირდება ჰოსტ-ჩანაწერი, რომელიც შემოსულ მოთხოვნებს upstream backend-ს ართავს. ჰოსტები სამი გზით კონფიგურირდება:

### TOML კონფ-ფაილის გავლით

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### ადმინ UI-ის გავლით

1. გადადი **Hosts**-ზე sidebar-ში
2. დააჭირე **Add Host**
3. ჰოსტ-დეტალები შეავსე
4. დააჭირე **Save**

### REST API-ის გავლით

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## ჰოსტ-ველები

| ველი | ტიპი | საჭირო | აღწერა |
|-------|------|----------|-------------|
| `host` | `string` | კი | შესაბამობის დომენ-სახელი (მაგ. `example.com`) |
| `port` | `integer` | კი | მოსასმენი პორტი (ჩვეულებრივ `80` ან `443`) |
| `remote_host` | `string` | კი | Upstream backend-ის IP ან hostname |
| `remote_port` | `integer` | კი | Upstream backend-ის პორტი |
| `ssl` | `boolean` | არა | upstream HTTPS-ს იყენებს თუ არა (ნაგულისხმევი: `false`) |
| `guard_status` | `boolean` | არა | ამ ჰოსტისთვის WAF-ის დაცვის ჩართვა (ნაგულისხმევი: `true`) |

## დატვირთვის განაწილება

PRX-WAF upstream backend-ებზე წონიანი round-robin-ის დატვირთვ-განაწილებას იყენებს. ჰოსტისთვის მრავალი backend-ის კონფიგურაციისას ტრაფიკი მათ წონებთან პროპორციულად ნაწილდება.

::: info
ჰოსტ-მიხედვით მრავალი upstream backend ადმინ UI-ის ან API-ის გავლით კონფიგურირდება. TOML კონფ-ფაილი ერთ-backend-ის ჰოსტ-ჩანაწერებს მხარს უჭერს.
:::

## მოთხოვნ-header-ები

PRX-WAF გადამისამართებულ მოთხოვნებს სტანდარტულ proxy-header-ებს ავტომატურად ამატებს:

| Header | მნიშვნელობა |
|--------|-------|
| `X-Real-IP` | კლიენტის ორიგინალი IP მისამართი |
| `X-Forwarded-For` | კლიენტის IP (არსებულ ჯაჭვს ემატება) |
| `X-Forwarded-Proto` | `http` ან `https` |
| `X-Forwarded-Host` | ორიგინალი Host header-ის მნიშვნელობა |

## მოთხოვნ-body-ის ზომ-ლიმიტი

მოთხოვნ-body-ის მაქსიმალური ზომა უსაფრთხოების კონფიგურაციით იმართება:

```toml
[security]
max_request_body_bytes = 10485760  # 10 MB
```

ამ ლიმიტს მაქვს მოთხოვნები WAF-ის პაიფლაინამდე მოხვედრამდე 413 Payload Too Large პასუხით უარიყოფა.

## ჰოსტების მართვა

### ყველა ჰოსტის ჩამოთვლა

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### ჰოსტის განახლება

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### ჰოსტის წაშლა

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## IP-ზე დაფუძნებული წესები

PRX-WAF IP-ზე დაფუძნებულ allow და block წესებს მხარს უჭერს, რომლებიც გამოვლენის პაიფლაინის ფაზა 1-4-ში ფასდება:

```bash
# Add an IP allowlist rule
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# Add an IP blocklist rule
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## შემდეგი ნაბიჯები

- [SSL/TLS](./ssl-tls) -- HTTPS-ის Let's Encrypt-ით ჩართვა
- [Gateway მიმოხილვა](./index) -- პასუხ-ქეშირება და reverse tunnels
- [კონფიგურაციის ცნობარი](../configuration/reference) -- ყველა proxy კონფ-გასაღები
