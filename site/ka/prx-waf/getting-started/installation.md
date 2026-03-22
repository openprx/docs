---
title: ინსტალაცია
description: "PRX-WAF-ის ინსტალაცია Docker Compose-ის, Cargo-ის ან წყაროდან აშენების გავლით. წინაპირობები, პლატფორმის შენიშვნები და ინსტალაციის შემდგომი გადამოწმება."
---

# ინსტალაცია

PRX-WAF სამ ინსტალაციის მეთოდს მხარს უჭერს. აირჩიეთ თქვენს სამუშაო ნაკადთან ყველაზე შესაფერი.

::: tip რეკომენდებული
**Docker Compose** ყველაზე სწრაფი გზა დასაწყებად. ის PRX-WAF-ს, PostgreSQL-სა და ადმინ UI-ს ერთი ბრძანებით ამართავს.
:::

## წინაპირობები

| მოთხოვნა | მინიმუმი | შენიშვნები |
|-------------|---------|-------|
| ოპერაციული სისტემა | Linux (x86_64, aarch64), macOS (12+) | Windows WSL2-ის გავლით |
| PostgreSQL | 16+ | Docker Compose-ში შეტანილია |
| Rust (მხოლოდ წყაროს აშენება) | 1.82.0 | Docker ინსტალაციისთვის საჭირო არ არის |
| Node.js (მხოლოდ ადმინ UI-ის აშენება) | 18+ | Docker ინსტალაციისთვის საჭირო არ არის |
| Docker | 20.10+ | ან Podman 3.0+ |
| დისკ-სივრცე | 500 MB | ~100 MB ბინარა + ~400 MB PostgreSQL მონაცემი |
| RAM | 512 MB | 2 GB+ წარმოებისთვის რეკომენდებული |

## მეთოდი 1: Docker Compose (რეკომენდებული)

საცავის კლონირება და ყველა სერვისის Docker Compose-ით გაშვება:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Review and edit environment variables in docker-compose.yml
# (database password, admin credentials, listen ports)
docker compose up -d
```

ეს სამ კონტეინერს ამართავს:

| კონტეინერი | პორტი | აღწერა |
|-----------|------|-------------|
| `prx-waf` | `80`, `443` | Reverse proxy (HTTP + HTTPS) |
| `prx-waf` | `9527` | ადმინ API + Vue 3 UI |
| `postgres` | `5432` | PostgreSQL 16 მონაცემთა ბაზა |

განასახების გადამოწმება:

```bash
# Check container status
docker compose ps

# Check health endpoint
curl http://localhost:9527/health
```

ადმინ UI-ს გახსნა `http://localhost:9527`-ზე და შესვლა ნაგულისხმევი სერთიფიკატებით: `admin` / `admin`.

::: warning ნაგულისხმევი პაროლის შეცვლა
ნაგულისხმევი ადმინ-პაროლი პირველი შესვლის შემდეგ დაუყოვნებლივ შეცვალეთ. ადმინ UI-ში **Settings > Account**-ზე გადადით ან API-ს გამოიყენეთ.
:::

### Docker Compose Podman-ით

Podman-ის Docker-ის ნაცვლად გამოყენებისას:

```bash
podman-compose up -d --build
```

::: info Podman DNS
Podman-ის გამოყენებისას კონტეინერ-კონტეინერ კომუნიკაციის DNS resolver-ის მისამართია `10.89.0.1` Docker-ის `127.0.0.11`-ის ნაცვლად. შეტანილი `docker-compose.yml` ამას ავტომატურად ამუშავებს.
:::

## მეთოდი 2: Cargo ინსტალაცია

Rust-ის ინსტალაციის შემთხვევაში PRX-WAF-ის საცავიდან ინსტალაცია:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

ბინარა `target/release/prx-waf`-ში მდებარეობს. PATH-ში კოპირება:

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning Build-ის დამოკიდებულებები
Cargo build-ი native დამოკიდებულებებს კომპილირებს. Debian/Ubuntu-ზე შეიძლება დაგჭირდეს:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
macOS-ზე Xcode Command Line Tools საჭიროა:
```bash
xcode-select --install
```
:::

### მონაცემთა ბაზის გამართვა

PRX-WAF-ს PostgreSQL 16+ მონაცემთა ბაზა სჭირდება:

```bash
# Create database and user
createdb prx_waf
createuser prx_waf

# Run migrations
./target/release/prx-waf -c configs/default.toml migrate

# Create default admin user (admin/admin)
./target/release/prx-waf -c configs/default.toml seed-admin
```

### სერვერის გაშვება

```bash
./target/release/prx-waf -c configs/default.toml run
```

ეს reverse proxy-ს 80/443 პორტებზე და ადმინ API-ს 9527 პორტზე იწყებს.

## მეთოდი 3: წყაროდან აშენება (განვითარება)

ადმინ UI-ის live reload-ით განვითარებისთვის:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Build the Rust backend
cargo build

# Build the admin UI
cd web/admin-ui
npm install
npm run build
cd ../..

# Start the development server
cargo run -- -c configs/default.toml run
```

### ადმინ UI-ის წარმოებისთვის აშენება

```bash
cd web/admin-ui
npm install
npm run build
```

აშენებული ფაილები Rust ბინარაში კომპილაციის დროს ჩაიდება და API სერვერის მიერ გაიშვება.

## systemd სერვისი

bare metal-ის წარმოება-განასახებებისთვის systemd სერვისის შექმნა:

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## ინსტალაციის გადამოწმება

ინსტალაციის შემდეგ PRX-WAF-ის გაშვების გადამოწმება:

```bash
# Check health endpoint
curl http://localhost:9527/health

# Check admin UI
curl -s http://localhost:9527 | head -5
```

dashboard-ის სწორი ჩატვირთვის გადასამოწმებლად ადმინ UI-ში `http://localhost:9527`-ზე შეხვედი.

## შემდეგი ნაბიჯები

- [სწრაფი დაწყება](./quickstart) -- თქვენი პირველი პროგრამის 5 წუთში დაცვა
- [კონფიგურაცია](../configuration/) -- PRX-WAF-ის პარამეტრების მოსარგებლება
- [წეს-ძრავა](../rules/) -- გამოვლენის პაიფლაინის გაგება
