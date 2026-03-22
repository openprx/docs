---
title: ინსტალაცია
description: OpenPR-ის ინსტალაცია Docker Compose-ის, Podman-ის ან Rust-ის და Node.js-ის გამოყენებით source-დან build-ით.
---

# ინსტალაცია

OpenPR ინსტალაციის სამ მეთოდს მხარს უჭერს. Docker Compose სრულ-ფუნქციური ინსტანციის მიღების უსწრაფესი გზაა.

::: tip რეკომენდებული
**Docker Compose** ყველა სერვისს (API, frontend, worker, MCP სერვერი, PostgreSQL) ერთი ბრძანებით ამოქმედებს. Rust-ინსტრუმენტ-ჯაჭვი ან Node.js საჭირო არ არის.
:::

## წინაპირობები

| მოთხოვნა | მინიმუმი | შენიშვნა |
|-------------|---------|-------|
| Docker | 20.10+ | ან Podman 3.0+ podman-compose-ით |
| Docker Compose | 2.0+ | Docker Desktop-ში შეტანილი |
| Rust (source build) | 1.75.0 | Docker-ინსტალაციისთვის საჭირო არ არის |
| Node.js (source build) | 20+ | SvelteKit-ის frontend-ის build-ისთვის |
| PostgreSQL (source build) | 15+ | Docker-მეთოდი PostgreSQL-ს მოიცავს |
| დისკ-სივრცე | 500 MB | images + მონაცემ-ბაზა |
| RAM | 1 GB | 2 GB+ წარმოებისთვის რეკომენდებული |

## მეთოდი 1: Docker Compose (რეკომენდებული)

საცავის clone და ყველა სერვისის გაშვება:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

ეს ხუთ სერვისს იწყებს:

| სერვისი | კონტეინერი | პორტი | აღწერა |
|---------|-----------|------|-------------|
| PostgreSQL | `openpr-postgres` | 5432 | მონაცემ-ბაზა ავტო-მიგრაციით |
| API | `openpr-api` | 8081 (8080-ზე გადავყავს) | REST API სერვერი |
| Worker | `openpr-worker` | -- | ფონ-ამოცან-პროცესორი |
| MCP სერვერი | `openpr-mcp-server` | 8090 | MCP ინსტრუმენტ-სერვერი |
| Frontend | `openpr-frontend` | 3000 | SvelteKit ვებ UI |

ყველა სერვისის გაშვების გადამოწმება:

```bash
docker-compose ps
```

::: warning პირველი მომხმარებელი
პირველი დარეგისტრირებული მომხმარებელი ავტომატურად **admin**-ი ხდება. URL-ის სხვებთან გაზიარებამდე admin-ანგარიში რეგისტრაციაში გაიარე.
:::

### გარემო-ცვლადები

განასახების კასტომიზაციისთვის `.env`-ის რედაქტირება:

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (change in production!)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

::: danger უსაფრთხოება
წარმოებაში განასახებამდე `JWT_SECRET`-სა და მონაცემ-ბაზ-პაროლები ყოველთვის შეცვალე. ძლიერი, შემთხვევითი მნიშვნელობების გამოყენება.
:::

## მეთოდი 2: Podman

OpenPR Podman-თან მუშაობს, როგორც Docker-ის ალტერნატივა. ძირითადი განსხვავება ისაა, რომ Podman DNS-ის გამო build-ებისთვის `--network=host`-ს საჭიროებს:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# Build images with network access
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# Start services
sudo podman-compose up -d
```

::: tip Podman DNS
Frontend-ის Nginx-კონტეინერი DNS-სამარნად `10.89.0.1`-ს იყენებს (Podman-ის ნაგულისხმევი ქსელ-DNS), არა `127.0.0.11`-ს (Docker-ის ნაგულისხმევი). ეს ჩართულ Nginx-კონფ-ში უკვე კონფიგურირებულია.
:::

## მეთოდი 3: Source-დან Build

### Backend

```bash
# Prerequisites: Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# Configure
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Build all binaries
cargo build --release -p api -p worker -p mcp-server
```

ბინარები მდებარეობს:
- `target/release/api` -- REST API სერვერი
- `target/release/worker` -- ფონ-worker
- `target/release/mcp-server` -- MCP ინსტრუმენტ-სერვერი

### Frontend

```bash
cd frontend
npm install    # or: bun install
npm run build  # or: bun run build
```

Build-გამოსავალი `frontend/build/`-შია. Nginx-ით ან ნებისმიერი სტატიკ-ფაილ-სერვერით გამოიყენე.

### მონაცემ-ბაზ-გამართვა

მონაცემ-ბაზის შექმნა და მიგრაციების გაშვება:

```bash
# Create database
createdb -U postgres openpr

# Migrations run automatically on first API start
# Or apply manually:
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... apply remaining migrations in order
```

### სერვისების გაშვება

```bash
# Terminal 1: API server
./target/release/api

# Terminal 2: Worker
./target/release/worker

# Terminal 3: MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## ინსტალაციის გადამოწმება

ყველა სერვისის გაშვებისას ყოველი endpoint-ის გადამოწმება:

```bash
# API health check
curl http://localhost:8080/health

# MCP server health
curl http://localhost:8090/health

# Frontend
curl -s http://localhost:3000 | head -5
```

ვებ UI-ზე წვდომისთვის ბრაუზერში http://localhost:3000 გახსენი.

## დეინსტალაცია

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v removes volumes (database data)
docker rmi $(docker images 'openpr*' -q)
```

### Source Build

```bash
# Stop running services (Ctrl+C in each terminal)
# Remove binaries
rm -f target/release/api target/release/worker target/release/mcp-server

# Drop database (optional)
dropdb -U postgres openpr
```

## შემდეგი ნაბიჯები

- [სწრაფი დაწყება](./quickstart) -- 5 წუთში პირველი სამუშაო სივრცისა და პროექტის შექმნა
- [Docker განასახება](../deployment/docker) -- წარმოებ-Docker-კონფიგურაცია
- [წარმოებ-განასახება](../deployment/production) -- Caddy, PostgreSQL და უსაფრთხოების გამაგრება
