---
title: MCP ინტეგრაცია
description: "PRX-Memory MCP პროტოკოლის ინტეგრაცია: მხარდაჭერილი ინსტრუმენტები, resource-ები, template-ები და ტრანსპორტის რეჟიმები."
---

# MCP ინტეგრაცია

PRX-Memory ნეიტიური MCP (Model Context Protocol) სერვერის სახით შენდება. ის მეხსიერების ოპერაციებს MCP ინსტრუმენტებად, მმართველობის skill-ებს MCP resource-ებად და payload template-ებს სტანდარტიზებული მეხსიერების ინტერაქციებისთვის ხდის ხელმისაწვდომად.

## ტრანსპორტის რეჟიმები

### stdio

stdio ტრანსპორტი სტანდარტულ შეყვანა/გამოტანაზე ახდენს კომუნიკაციას, რაც მას MCP კლიენტებთან, მაგ. Claude Code-თან, Codex-თან და OpenClaw-თან პირდაპირი ინტეგრაციისთვის იდეალურს ხდის.

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

HTTP ტრანსპორტი უზრუნველყოფს ქსელზე ხელმისაწვდომ სერვერს დამატებითი ოპერაციული endpoint-ებით.

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

HTTP-მხოლოდ endpoint-ები:

| Endpoint | აღწერა |
|----------|--------|
| `GET /health` | ჯანმრთელობის შემოწმება |
| `GET /metrics` | Prometheus მეტრიკები |
| `GET /metrics/summary` | JSON მეტრიკების შეჯამება |
| `POST /mcp/session/renew` | Streaming სესიის განახლება |

## MCP კლიენტის კონფიგურაცია

დაამატეთ PRX-Memory MCP კლიენტის კონფიგურაციის ფაილში:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
გამოიყენეთ აბსოლუტური გზები `command`-ისა და `PRX_MEMORY_DB`-ისთვის გზის resolution-ის პრობლემების თავიდან ასაცილებლად.
:::

## MCP ინსტრუმენტები

PRX-Memory ამ ინსტრუმენტებს ხდის ხელმისაწვდომად MCP `tools/call` ინტერფეისის მეშვეობით:

### ძირითადი მეხსიერების ოპერაციები

| ინსტრუმენტი | აღწერა |
|------------|--------|
| `memory_store` | ახალი მეხსიერების ჩანაწერის შენახვა ტექსტით, scope-ით, tag-ებითა და metadata-ით |
| `memory_recall` | მეხსიერებების გამოძახება შეკითხვის მიხედვით ლექსიკური, ვექტორული და rerank-ული ძიებით |
| `memory_update` | არსებული მეხსიერების ჩანაწერის განახლება |
| `memory_forget` | მეხსიერების ჩანაწერის წაშლა ID-ის მიხედვით |

### ბულქ ოპერაციები

| ინსტრუმენტი | აღწერა |
|------------|--------|
| `memory_export` | ყველა მეხსიერების ექსპორტი portable JSON ფორმატში |
| `memory_import` | მეხსიერებების იმპორტი ექსპორტიდან |
| `memory_migrate` | შენახვის backend-ებს შორის მიგრაცია |
| `memory_reembed` | ყველა მეხსიერების ახლად embedding-ი მიმდინარე მოდელით |
| `memory_compact` | შენახვის კომპაქტიზება და ოპტიმიზება |

### Evolution

| ინსტრუმენტი | აღწერა |
|------------|--------|
| `memory_evolve` | მეხსიერების evolution train/holdout მიღებით constraint gating-ით |

### Skill-ების აღმოჩენა

| ინსტრუმენტი | აღწერა |
|------------|--------|
| `memory_skill_manifest` | მმართველობის skill-ებისთვის skill manifest-ის დაბრუნება |

## MCP Resource-ები

PRX-Memory მმართველობის skill პაკეტებს MCP resource-ებად ხდის ხელმისაწვდომად:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

კონკრეტული resource-ის წაკითხვა:

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## Resource Template-ები

Payload template-ები კლიენტებს ეხმარება სტანდარტიზებული მეხსიერების ოპერაციების შედგენაში:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

Template-ის გამოყენება store payload-ის გენერაციისთვის:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## Streaming სესიები

HTTP ტრანსპორტი მხარს უჭერს Server-Sent Events (SSE)-ს streaming პასუხებისთვის. სესიებს კონფიგურირებადი TTL აქვთ:

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 minutes
```

სესიის განახლება ვადის გასვლამდე:

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## სტანდარტიზაციის პროფილები

PRX-Memory მხარს უჭერს ორ სტანდარტიზაციის პროფილს, რომლებიც აკონტროლებს მეხსიერების ჩანაწერების tag-ებისა და ვალიდაციის ხდომილებებს:

| პროფილი | აღწერა |
|---------|--------|
| `zero-config` | მინიმალური შეზღუდვები, ნებისმიერ tag-სა და scope-ს იღებს (ნაგულისხმევი) |
| `governed` | მკაცრი tag-ების ნორმალიზება, ratio bounds-ი და ხარისხის შეზღუდვები |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## შემდეგი ნაბიჯები

- [სწრაფი დაწყება](../getting-started/quickstart) -- პირველი შენახვა და გამოძახება
- [კონფიგურაციის ცნობარი](../configuration/) -- ყველა გარემოს ცვლადი
- [პრობლემების მოგვარება](../troubleshooting/) -- გავრცელებული MCP პრობლემები
