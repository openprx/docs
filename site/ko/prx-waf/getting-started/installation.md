---
title: 설치
description: "Docker Compose, Cargo, 소스 빌드를 사용하여 PRX-WAF를 설치합니다."
---

# 설치

PRX-WAF는 세 가지 방법으로 설치할 수 있습니다. 대부분의 사용자에게는 Docker Compose를 권장합니다.

## 방법 1: Docker Compose (권장)

### 사전 요구사항

- Docker 24.0 이상
- Docker Compose v2

### 설치

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

이 명령어는 다음을 시작합니다:
- **PostgreSQL** — 설정 및 이벤트 저장
- **PRX-WAF** — WAF 엔진 + 관리 API
- 기본 규칙으로 사전 구성됨

서비스:
- WAF 프록시: `http://localhost:8080`
- 관리자 UI: `http://localhost:9527`

### Docker Compose 파일

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: prx_waf
      POSTGRES_USER: prx_waf
      POSTGRES_PASSWORD: prx_waf
    volumes:
      - pgdata:/var/lib/postgresql/data

  prx-waf:
    image: ghcr.io/openprx/prx-waf:latest
    depends_on: [postgres]
    ports:
      - "8080:8080"    # 프록시
      - "9527:9527"    # 관리자 API
    volumes:
      - ./configs:/app/configs
      - ./rules:/app/rules
    command: ["prx-waf", "-c", "configs/default.toml", "run"]

volumes:
  pgdata:
```

## 방법 2: Cargo

### 사전 요구사항

- Rust 1.85.0 이상
- PostgreSQL 14 이상 (실행 중)

### 설치

```bash
cargo install prx-waf
```

### 설정

```bash
# 설정 파일 생성
mkdir -p configs
cat > configs/default.toml << 'EOF'
[proxy]
listen = "0.0.0.0:8080"

[api]
listen = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
EOF

# 데이터베이스 초기화
prx-waf -c configs/default.toml migrate
prx-waf -c configs/default.toml seed-admin

# 서버 시작
prx-waf -c configs/default.toml run
```

## 방법 3: 소스에서 빌드

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
./target/release/prx-waf -c configs/default.toml migrate
./target/release/prx-waf -c configs/default.toml seed-admin
./target/release/prx-waf -c configs/default.toml run
```

## systemd 서비스로 설치

프로덕션 Linux 서버에서 systemd 유닛으로 실행:

```bash
sudo tee /etc/systemd/system/prx-waf.service << 'EOF'
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=on-failure
RestartSec=5
User=prx-waf

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now prx-waf
```

## 초기 자격 증명

설치 후 관리자 UI에 접근합니다:

- **URL**: `http://localhost:9527`
- **사용자명**: `admin`
- **비밀번호**: `admin`

::: warning
초기 로그인 후 즉시 기본 비밀번호를 변경하세요.
:::

## 다음 단계

- [빠른 시작](./quickstart) — 6단계로 첫 번째 앱 보호
- [설정 레퍼런스](../configuration/reference) — 모든 설정 옵션
