---
title: ინსტალაცია
description: Fenfa-ს ინსტალაცია Docker-ის, Docker Compose-ის გამოყენებით ან Go-სა და Node.js-ით source-დან build.
---

# ინსტალაცია

Fenfa ინსტალაციის ორ მეთოდს მხარს უჭერს: Docker (სასურველია) და source-დან build.

::: tip სასურველია
**Docker** დაწყების ყველაზე სწრაფი გზაა. ერთი ბრძანება სრულად მოქმედ Fenfa ინსტანციას გაძლევთ build ინსტრუმენტების გარეშე.
:::

## წინაპირობები

| მოთხოვნა | მინიმუმი | შენიშვნა |
|----------|---------|----------|
| Docker | 20.10+ | ან Podman 3.0+ |
| Go (მხოლოდ source build-ისთვის) | 1.25+ | Docker-ისთვის არ სჭირდება |
| Node.js (მხოლოდ source build-ისთვის) | 20+ | Frontend-ის build-ისთვის |
| სადისკო სივრცე | 100 MB | პლუს ატვირთული build-ებისთვის |

## მეთოდი 1: Docker (სასურველია)

გადმოწიეთ და გაუშვით ოფიციალური image:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  fenfa/fenfa:latest
```

ეწვიეთ `http://localhost:8000/admin` და შედით ნაგულისხმევი token-ით `dev-admin-token`.

::: warning უსაფრთხოება
ნაგულისხმევი token-ები მხოლოდ განვითარებისთვისაა. Fenfa-ს ინტერნეტზე გამოსაქვეყნებლად უსაფრთხო token-ების კონფიგურაციისთვის იხილეთ [Production განასახება](../deployment/production).
:::

### მდგრადი შენახვით

მონაცემთა ბაზისა და ატვირთული ფაილებისთვის volume-ების mount-ი:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Custom კონფიგურაციით

ყველა პარამეტრის სრული კონტროლისთვის `config.json` ფაილის mount-ი:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -v ./config.json:/app/config.json:ro \
  fenfa/fenfa:latest
```

ყველა ხელმისაწვდომი პარამეტრისთვის იხილეთ [კონფიგურაციის ცნობარი](../configuration/).

### გარემოს ცვლადები

კონფიგ ფაილის გარეშე კონფიგურაციის მნიშვნელობების გადაფარვა:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -e FENFA_ADMIN_TOKEN=your-secret-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-secret-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://dist.example.com \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

| ცვლადი | აღწერა | ნაგულისხმევი |
|--------|--------|-------------|
| `FENFA_PORT` | HTTP პორტი | `8000` |
| `FENFA_DATA_DIR` | მონაცემთა ბაზის დირექტორია | `data` |
| `FENFA_PRIMARY_DOMAIN` | საჯარო დომენის URL | `http://localhost:8000` |
| `FENFA_ADMIN_TOKEN` | Admin token | `dev-admin-token` |
| `FENFA_UPLOAD_TOKEN` | Upload token | `dev-upload-token` |

## მეთოდი 2: Docker Compose

შექმენით `docker-compose.yml`:

```yaml
version: "3.8"
services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: your-secret-admin-token
      FENFA_UPLOAD_TOKEN: your-secret-upload-token
      FENFA_PRIMARY_DOMAIN: https://dist.example.com
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
```

სერვისის გაშვება:

```bash
docker compose up -d
```

## მეთოდი 3: Source-დან Build

და-clone-ეთ საცავი:

```bash
git clone https://github.com/openprx/fenfa.git
cd fenfa
```

### Make-ის გამოყენება

Makefile სრულ build-ს ავტომატიზაციას უკეთებს:

```bash
make build   # builds frontend + backend
make run     # starts the server
```

### ხელით Build

Build-ის პირველ ეტაპზე Frontend აპლიკაციები, შემდეგ Go backend:

```bash
# Build the public download page
cd web/front && npm ci && npm run build && cd ../..

# Build the admin panel
cd web/admin && npm ci && npm run build && cd ../..

# Build the Go binary
go build -o fenfa ./cmd/server
```

Frontend `internal/web/dist/`-ში compile-ს და `go:embed`-ის მეშვეობით Go ბინარულში embed-ს. შედეგი `fenfa` ბინარული სრულად self-contained-ია.

### ბინარულის გაშვება

```bash
./fenfa
```

Fenfa ნაგულისხმევად 8000 პორტზე იწყება. SQLite მონაცემთა ბაზა ავტომატურად `data/` დირექტორიაში იქმნება.

## ინსტალაციის გადამოწმება

გახსენით ბრაუზერი `http://localhost:8000/admin`-ზე და შედით admin token-ით. უნდა დაინახოთ admin dashboard.

შეამოწმეთ health endpoint:

```bash
curl http://localhost:8000/healthz
```

მოსალოდნელი პასუხი:

```json
{"ok": true}
```

## შემდეგი ნაბიჯები

- [სწრაფი დაწყება](./quickstart) -- პირველი build-ის ატვირთვა 5 წუთში
- [კონფიგურაციის ცნობარი](../configuration/) -- ყველა კონფიგურაციის პარამეტრი
- [Docker განასახება](../deployment/docker) -- Docker Compose და მრავალ-არქიტექტურიანი build-ები
