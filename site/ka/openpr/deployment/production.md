---
title: წარმოებ-განასახება
description: OpenPR-ის Caddy-reverse proxy-ით, ავტო-HTTPS-ით, PostgreSQL-გამაგრებითა და უსაფრთხოებ-საუკეთესო-პრაქტიკებით წარმოებ-გარემოში განასახება.
---

# წარმოებ-განასახება

ეს სახელმძღვანელო HTTPS-ით, reverse proxy-ით, მონაცემ-ბაზ-გამაგრებითა და უსაფრთხოებ-საუკეთ-პრაქ-ით წარმოებ-გარემოში OpenPR-ის განასახებას მოიცავს.

## არქიტექტურა

```mermaid
graph LR
    INTERNET["Internet<br/>:443"] --> CADDY["Caddy<br/>Auto HTTPS"]
    CADDY --> FE["Frontend<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## წინაპირობები

- სერვერი მინ. 2 CPU ბირთვითა და 2 GB RAM-ით
- სერვერის IP-ზე მიმართული დომენ-სახელი
- Docker და Docker Compose (ან Podman)

## ნაბიჯი 1: გარემო-კონფ

წარმოებ `.env` ფაილის შექმნა:

```bash
# Database (use strong passwords)
DATABASE_URL=postgres://openpr:STRONG_PASSWORD_HERE@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# JWT (generate a random secret)
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# Logging
RUST_LOG=info
```

::: danger საიდუმლოებები
`.env` ფაილები version control-ში არასოდეს შეიტანო. ფაილ-ნებართ-შეზღ-ისთ `chmod 600 .env`-ის გამოყენება.
:::

## ნაბიჯი 2: Caddy-ს გამართვა

ჰოსტ-სისტემაზე Caddy-ს ინსტალაცია:

```bash
sudo apt install -y caddy
```

Caddyfile-ის კონფ:

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

Caddy ავტომატურად Let's Encrypt TLS სერთიფიკატებს იძენს და განაახლებს.

Caddy-ს გაშვება:

```bash
sudo systemctl enable --now caddy
```

::: tip ალტ: Nginx
Nginx-ის გამოყენების შემთხვევაში 3000-ე პორტზე proxy pass-ის კონფ-ი და TLS სერთ-ისთვის certbot-ის გამოყენება.
:::

## ნაბიჯი 3: Docker Compose-ით განასახება

```bash
cd /opt/openpr
docker-compose up -d
```

ყველა სერვისის ჯანსაღობ-გადამოწმება:

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## ნაბიჯი 4: Admin-ანგარიშის შექმნა

ბრაუზერში `https://your-domain.example.com` გახსენი და admin-ანგარიში დარეგ.

::: warning პირველი მომხმარებელი
პირველი დარეგ-მომხ admin-ი ხდება. URL-ის გაზიარებამდე admin-ანგ-ის დარ.
:::

## უსაფრთხოებ-სია

### ავთენტიფიკაცია

- [ ] `JWT_SECRET` შემთხვ-32+-სიმ-მნ-ზე შეცვლა
- [ ] შ-ტოკ-TTL-მნ-ის დაყ (access-ისთვ მოკლე, refresh-ისთ გრძელი)
- [ ] განასახ-შემდ-admin-ანგ-ის დაუყ-შექ

### მონაცემ-ბაზა

- [ ] PostgreSQL-ისთვ ძლ-პ-ის გამოყ
- [ ] PostgreSQL-პ (5432) ინტ-ზ გამოჩ-ის არარ
- [ ] PostgreSQL SSL-ის ჩ (არარ-მოnar-მ-ბ-ის შ)
- [ ] რეგ-მ-ბ-backup-ების გამ

### ქსელი

- [ ] Caddy-ს ან Nginx-ის HTTPS-ით (TLS 1.3) გამ
- [ ] ინტ-ზ მხოლოდ 443 (HTTPS) და სურვ 8090 (MCP)-ის გამოჩ
- [ ] Firewall-ის (ufw, iptables) წვდ-შეზ-ისთ გამ
- [ ] MCP სერვ-წვდ-ცნობ-IP-დ-შეზ-გათვ

### აპლიკაცია

- [ ] `RUST_LOG=info`-ის დ (debug ან trace არა წარ)
- [ ] uploads-დ-დისკ-გ-მონ
- [ ] კონტ-ლოგ-rotation-ის გამ

## მონაცემ-ბაზ-backup-ები

ავტ-PostgreSQL-backup-ების გამართვა:

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

Cron-ში დამატება:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/openpr/backup.sh
```

## მონიტორინგი

### ჯანმრთ-შემოწ

სერვის-ჯანმრთ-endpoint-ების მონ:

```bash
# API
curl -f http://localhost:8080/health

# MCP Server
curl -f http://localhost:8090/health
```

### ლოგ-მონიტ

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f api --tail=100
```

## მასშტ-მოსაზრებები

- **API სერვ**: load balancer-ის მიღმა მრ-replika-ში გაშვება შ. ყველა ინსტ ერთ PostgreSQL-ს უკ.
- **Worker**: ერთი ინსტ duplicate-სამ-გასაც.
- **MCP სერვ**: მრ-replika-ში გაშვ შ. ყ ინსტ stateless-ია.
- **PostgreSQL**: მაღ-ხელმ-ისთ PostgreSQL-repl-ის ან მართ-მ-ბ-სერვ-გათვ.

## განახლება

OpenPR-ის განახლება:

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

მ-ბ-მ-ები API სერვ-სტ-ზე ავტ-სრ.

## შემდეგი ნაბიჯები

- [Docker-განასახება](./docker) -- Docker Compose-ცნობარი
- [კონფიგ-ი](../configuration/) -- გარ-ცვლ-ცნობ
- [პრობლ-მოგ](../troubleshooting/) -- გავრ-წარ-პრ
