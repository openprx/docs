---
title: კონფიგურაციის ცნობარი
description: OpenPR-ის API, worker, MCP სერვერი, frontend და მონაცემ-ბაზის ყველა გარემო-ცვლადის და კონფ-ვარიანტის სრული ცნობარი.
---

# კონფიგურაციის ცნობარი

OpenPR გარემო-ცვლადებით კონფიგურირდება. Docker Compose-ის გამოყენებისას ყველა სერვისი ერთი `.env` ფაილიდან კითხულობს, ან პირდაპირი გაშვებისას ცალ-ცალკე გარემო-ცვლადებიდან.

## API სერვერი

| ცვლადი | ნაგულისხმევი | აღწერა |
|----------|---------|-------------|
| `APP_NAME` | `api` | ლოგ-ჩანაწერისთვის აპლიკაციის იდენტიფიკატორი |
| `BIND_ADDR` | `0.0.0.0:8080` | API-ის მოსასმენი მისამართი და პორტი |
| `DATABASE_URL` | -- | PostgreSQL-კავშირ-სტრინგი |
| `JWT_SECRET` | `change-me-in-production` | JWT ტოკენ-ხელმოწერის საიდუმლო გასაღები |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 დღე) | Access ტოკენის სიცოცხლე წამებში |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 დღე) | Refresh ტოკენის სიცოცხლე წამებში |
| `RUST_LOG` | `info` | ლოგ-დონე (trace, debug, info, warn, error) |
| `UPLOAD_DIR` | `/app/uploads` | ფაილ-ატვირთვ-დირექტორია |

::: danger უსაფრთხოება
წარმოებაში `JWT_SECRET` ყოველთვის ძლიერ, შემთხვევით მნიშვნელობაზე შეცვალე. მინიმუმ 32 სიმბოლოიანი შემთხვევითი მონაცემი:
```bash
openssl rand -hex 32
```
:::

## მონაცემ-ბაზა

| ცვლადი | ნაგულისხმევი | აღწერა |
|----------|---------|-------------|
| `DATABASE_URL` | -- | სრული PostgreSQL-კავშირ-სტრინგი |
| `POSTGRES_DB` | `openpr` | მონაცემ-ბაზ-სახელი |
| `POSTGRES_USER` | `openpr` | მონაცემ-ბაზ-მომხმარებელი |
| `POSTGRES_PASSWORD` | `openpr` | მონაცემ-ბაზ-პაროლი |

კავშირ-სტრინგ-ფორმატი:

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
Docker Compose-ის გამოყენებისას მონაცემ-ბაზ-სერვისი `postgres`-ია, კავშირ-სტრინგი:
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## Worker

| ცვლადი | ნაგულისხმევი | აღწერა |
|----------|---------|-------------|
| `APP_NAME` | `worker` | აპლიკაციის იდენტიფიკატორი |
| `DATABASE_URL` | -- | PostgreSQL-კავშირ-სტრინგი |
| `JWT_SECRET` | -- | API სერვერ-მნიშვნელობასთან უნდა ემთხვევოდეს |
| `RUST_LOG` | `info` | ლოგ-დონე |

Worker `job_queue` და `scheduled_jobs` ცხრილებიდან ფონ-ამოცანებს ამუშავებს.

## MCP სერვერი

| ცვლადი | ნაგულისხმევი | აღწერა |
|----------|---------|-------------|
| `APP_NAME` | `mcp-server` | აპლიკაციის იდენტიფიკატორი |
| `OPENPR_API_URL` | -- | API სერვერ-URL (proxy-ის ჩათვლით, ასეთის შემთხვევაში) |
| `OPENPR_BOT_TOKEN` | -- | ბოტ-ტოკენი `opr_` პრეფიქსით |
| `OPENPR_WORKSPACE_ID` | -- | ნაგულისხმევი სამუშაო სივრც-UUID |
| `DATABASE_URL` | -- | PostgreSQL-კავშირ-სტრინგი |
| `JWT_SECRET` | -- | API სერვერ-მნიშვნელობასთან უნდა ემთხვევოდეს |
| `DEFAULT_AUTHOR_ID` | -- | MCP ოპერაციებისთვის fallback ავტორ-UUID |
| `RUST_LOG` | `info` | ლოგ-დონე |

### MCP სატრანსპორტო ვარიანტები

MCP სერვერ-ბინარი ბრძანებ-ხაზ-არგუმენტებს იღებს:

```bash
# HTTP mode (default)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# stdio mode (for Claude Desktop, Codex)
mcp-server --transport stdio

# Subcommand form
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## Frontend

| ცვლადი | ნაგულისხმევი | აღწერა |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | Frontend-ის API სერვერ-URL |

::: tip Reverse Proxy
წარმოებაში reverse proxy-ით (Caddy/Nginx) `VITE_API_URL` API სერვერზე გადამისამართებული proxy URL-ი უნდა იყოს.
:::

## Docker Compose-ის პორტები

| სერვისი | შიდა პორტი | გარე პორტი | მიზანი |
|---------|---------------|---------------|---------|
| PostgreSQL | 5432 | 5432 | მონაცემ-ბაზა |
| API | 8080 | 8081 | REST API |
| Worker | -- | -- | ფონ-ამოცანები (პორტი არ არის) |
| MCP სერვერი | 8090 | 8090 | MCP ინსტრუმენტები |
| Frontend | 80 | 3000 | ვებ UI |

## .env ფაილ-მაგალითი

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# API Server
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

## ლოგ-დონეები

OpenPR სტრუქტურირებული ლოგ-ჩაწერისთვის `tracing` crate-ს იყენებს. სიხშირის კონტროლისთვის `RUST_LOG`-ის დაყენება:

| დონე | აღწერა |
|-------|-------------|
| `error` | მხოლოდ შეცდომები |
| `warn` | შეცდომები და გაფრთხილებები |
| `info` | ჩვეულებრივი ოპერ-შეტყობინებები (ნაგულისხმევი) |
| `debug` | დეტალური debug-ინფო |
| `trace` | ძალიან სიხშირიანი, ყველა შიდა ოპერაციის ჩათვლით |

მოდულ-მიხედვით ფილტრაცია მხარდაჭერილია:

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## შემდეგი ნაბიჯები

- [Docker განასახება](../deployment/docker) -- Docker Compose-კონფიგურაცია
- [წარმოებ-განასახება](../deployment/production) -- Caddy, უსაფრთხოება და მასშტაბირება
- [ინსტალაცია](../getting-started/installation) -- დაწყება
