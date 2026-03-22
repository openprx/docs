---
title: 프로덕션 배포
description: "Caddy 리버스 프록시, 자동 HTTPS, PostgreSQL 강화, 보안 모범 사례로 OpenPR을 프로덕션에 배포."
---

# 프로덕션 배포

이 가이드는 HTTPS, 리버스 프록시, 데이터베이스 강화, 보안 모범 사례를 적용한 프로덕션 환경에서의 OpenPR 배포를 다룹니다.

## 아키텍처

```mermaid
graph LR
    INTERNET["Internet<br/>:443"] --> CADDY["Caddy<br/>Auto HTTPS"]
    CADDY --> FE["Frontend<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## 사전 요구사항

- 최소 CPU 코어 2개, RAM 2GB를 갖춘 서버
- 서버 IP 주소를 가리키는 도메인 이름
- Docker 및 Docker Compose (또는 Podman)

## 1단계: 환경 설정

프로덕션 `.env` 파일 생성:

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

::: danger 시크릿
`.env` 파일을 버전 관리에 커밋하지 마세요. `chmod 600 .env`로 파일 권한을 제한하세요.
:::

## 2단계: Caddy 설정

호스트 시스템에 Caddy를 설치합니다:

```bash
sudo apt install -y caddy
```

Caddyfile을 설정합니다:

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

Caddy는 Let's Encrypt TLS 인증서를 자동으로 획득하고 갱신합니다.

Caddy를 시작합니다:

```bash
sudo systemctl enable --now caddy
```

::: tip 대안: Nginx
Nginx를 선호하는 경우 포트 3000으로 프록시 패스를 설정하고 TLS 인증서는 certbot을 사용하세요.
:::

## 3단계: Docker Compose로 배포

```bash
cd /opt/openpr
docker-compose up -d
```

모든 서비스가 정상인지 확인합니다:

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## 4단계: 관리자 계정 생성

브라우저에서 `https://your-domain.example.com`을 열고 관리자 계정을 등록합니다.

::: warning 첫 번째 사용자
최초 등록 사용자가 관리자가 됩니다. URL을 공유하기 전에 관리자 계정을 등록하세요.
:::

## 보안 체크리스트

### 인증

- [ ] `JWT_SECRET`을 32자 이상의 무작위 값으로 변경
- [ ] 적절한 토큰 TTL 값 설정 (액세스는 짧게, 갱신은 길게)
- [ ] 배포 직후 관리자 계정 생성

### 데이터베이스

- [ ] PostgreSQL에 강력한 비밀번호 사용
- [ ] PostgreSQL 포트(5432)를 인터넷에 노출하지 않음
- [ ] 연결에 PostgreSQL SSL 활성화 (원격 데이터베이스인 경우)
- [ ] 정기적인 데이터베이스 백업 설정

### 네트워크

- [ ] Caddy 또는 Nginx로 HTTPS(TLS 1.3) 사용
- [ ] 443(HTTPS) 포트와 선택적으로 8090(MCP) 포트만 인터넷에 노출
- [ ] 방화벽(ufw, iptables)으로 접근 제한
- [ ] MCP 서버 접근을 알려진 IP 대역으로 제한 고려

### 애플리케이션

- [ ] `RUST_LOG=info` 설정 (프로덕션에서 debug나 trace 사용 금지)
- [ ] 업로드 디렉토리의 디스크 사용량 모니터링
- [ ] 컨테이너 로그에 로그 로테이션 설정

## 데이터베이스 백업

PostgreSQL 자동 백업 설정:

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

크론에 추가:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/openpr/backup.sh
```

## 모니터링

### 헬스 체크

서비스 헬스 엔드포인트 모니터링:

```bash
# API
curl -f http://localhost:8080/health

# MCP Server
curl -f http://localhost:8090/health
```

### 로그 모니터링

```bash
# 모든 로그 추적
docker-compose logs -f

# 특정 서비스 추적
docker-compose logs -f api --tail=100
```

## 스케일링 고려 사항

- **API 서버**: 로드 밸런서 뒤에 여러 레플리카를 실행할 수 있습니다. 모든 인스턴스가 동일한 PostgreSQL 데이터베이스에 연결됩니다.
- **워커**: 중복 작업 처리를 방지하기 위해 단일 인스턴스를 실행하세요.
- **MCP 서버**: 여러 레플리카를 실행할 수 있습니다. 각 인스턴스는 스테이트리스입니다.
- **PostgreSQL**: 고가용성을 위해 PostgreSQL 복제 또는 관리형 데이터베이스 서비스를 고려하세요.

## 업데이트

OpenPR 업데이트 방법:

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

데이터베이스 마이그레이션은 API 서버 시작 시 자동으로 적용됩니다.

## 다음 단계

- [Docker 배포](./docker) -- Docker Compose 레퍼런스
- [설정](../configuration/) -- 환경 변수 레퍼런스
- [문제 해결](../troubleshooting/) -- 일반적인 프로덕션 문제
