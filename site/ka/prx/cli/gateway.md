---
title: prx gateway
description: ცალკეული HTTP/WebSocket გეითვეი სერვერის გაშვება არხებისა და cron-ის გარეშე.
---

# prx gateway

გაუშვით HTTP/WebSocket გეითვეი სერვერი ცალკეული პროცესის სახით. [`prx daemon`](./daemon)-ისგან განსხვავებით, ეს ბრძანება იწყებს მხოლოდ გეითვეის -- არანაირი არხები, cron დამგეგმავი ან ევოლუციის ძრავა.

ეს სასარგებლოა განთავსებებისთვის, სადაც გსურთ PRX API-ის გამოქვეყნება სრული დემონის გარეშე, ან როდესაც არხებს და დაგეგმვას ცალკეულ პროცესებად აწარმოებთ.

## გამოყენება

```bash
prx gateway [OPTIONS]
```

## ვარიანტები

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--config` | `-c` | `~/.config/prx/config.toml` | კონფიგურაციის ფაილის გზა |
| `--port` | `-p` | `3120` | მოსმენის პორტი |
| `--host` | `-H` | `127.0.0.1` | მიბმის მისამართი |
| `--log-level` | `-l` | `info` | ლოგის სიტყვიერება: `trace`, `debug`, `info`, `warn`, `error` |
| `--cors-origin` | | `*` | ნებადართული CORS წარმოშობები (მძიმით გამოყოფილი) |
| `--tls-cert` | | | TLS სერტიფიკატის ფაილის გზა |
| `--tls-key` | | | TLS კონფიდენციალური გასაღების ფაილის გზა |

## ენდფოინთები

გეითვეი გამოაქვეყნებს შემდეგ ენდფოინთების ჯგუფებს:

| გზა | მეთოდი | აღწერა |
|-----|--------|--------|
| `/health` | GET | ჯანმრთელობის შემოწმება (აბრუნებს `200 OK`) |
| `/api/v1/chat` | POST | ჩატის შეტყობინების გაგზავნა |
| `/api/v1/chat/stream` | POST | ჩატის შეტყობინების გაგზავნა (სტრიმინგი SSE) |
| `/api/v1/sessions` | GET, POST | სესიების მართვა |
| `/api/v1/sessions/:id` | GET, DELETE | ცალკეული სესიის ოპერაციები |
| `/api/v1/tools` | GET | ხელმისაწვდომი ინსტრუმენტების ჩამოთვლა |
| `/api/v1/memory` | GET, POST | მეხსიერების ოპერაციები |
| `/ws` | WS | WebSocket ენდფოინთი რეალურ დროში კომუნიკაციისთვის |
| `/webhooks/:channel` | POST | შემომავალი webhook მიმღები არხებისთვის |

იხილეთ [გეითვეის HTTP API](/ka/prx/gateway/http-api) და [გეითვეის WebSocket](/ka/prx/gateway/websocket) სრული API დოკუმენტაციისთვის.

## მაგალითები

```bash
# ნაგულისხმევ პორტზე გაშვება
prx gateway

# ყველა ინტერფეისზე მიბმა 8080 პორტზე
prx gateway --host 0.0.0.0 --port 8080

# TLS-ით
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# CORS-ის შეზღუდვა
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# debug ლოგირება
prx gateway --log-level debug
```

## რევერს პროქსის უკან

წარმოებაში განათავსეთ გეითვეი რევერს პროქსის (Nginx, Caddy და ა.შ.) უკან TLS-ის შეწყვეტისა და დატვირთვის დაბალანსებისთვის:

```
# Caddy მაგალითი
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# Nginx მაგალითი
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## სიგნალები

| სიგნალი | ქცევა |
|---------|-------|
| `SIGHUP` | კონფიგურაციის გადატვირთვა |
| `SIGTERM` | გრაციოზული გამორთვა (ასრულებს მიმდინარე მოთხოვნებს) |

## დაკავშირებული

- [prx daemon](./daemon) -- სრული გაშვების გარემო (გეითვეი + არხები + cron + ევოლუცია)
- [გეითვეის მიმოხილვა](/ka/prx/gateway/) -- გეითვეის არქიტექტურა
- [გეითვეის HTTP API](/ka/prx/gateway/http-api) -- REST API მითითება
- [გეითვეის WebSocket](/ka/prx/gateway/websocket) -- WebSocket პროტოკოლი
