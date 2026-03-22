---
title: 문제 해결
description: "데이터베이스 연결, 인증 오류, Docker 문제, MCP 서버 설정 등 일반적인 OpenPR 문제에 대한 해결책."
---

# 문제 해결

이 페이지는 OpenPR 실행 시 발생하는 일반적인 문제와 해결 방법을 다룹니다.

## 데이터베이스 연결

### "connection refused"로 API 시작 실패

PostgreSQL이 준비되기 전에 API 서버가 시작됩니다.

**해결책**: Docker Compose 파일에는 헬스 체크와 `condition: service_healthy`가 있는 `depends_on`이 포함되어 있습니다. 문제가 지속되면 PostgreSQL `start_period`를 늘리세요:

```yaml
postgres:
  healthcheck:
    start_period: 30s  # Increase from default 10s
```

### "role openpr does not exist"

PostgreSQL 사용자가 생성되지 않았습니다.

**해결책**: `POSTGRES_USER`와 `POSTGRES_PASSWORD`가 Docker Compose 환경에 설정되어 있는지 확인하세요. PostgreSQL을 직접 실행하는 경우:

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### 마이그레이션이 적용되지 않음

마이그레이션은 첫 번째 PostgreSQL 컨테이너 시작 시(`docker-entrypoint-initdb.d`를 통해) 자동으로 실행됩니다.

**해결책**: 데이터베이스가 이미 존재하는 경우 마이그레이션을 수동으로 적용하세요:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# Then run each migration SQL file in order
```

또는 볼륨을 다시 생성하세요:

```bash
docker-compose down -v
docker-compose up -d
```

::: warning 데이터 손실
`docker-compose down -v`는 데이터베이스 볼륨을 삭제합니다. 먼저 데이터를 백업하세요.
:::

## 인증

### 서버 재시작 후 "Invalid token"

JWT 토큰은 `JWT_SECRET`으로 서명됩니다. 이 값이 재시작 사이에 변경되면 기존 토큰이 모두 무효화됩니다.

**해결책**: `.env`에 고정된 `JWT_SECRET`을 설정하세요:

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### 첫 번째 사용자가 관리자가 아님

관리자 역할은 처음 등록한 사용자에게 할당됩니다. `role: "admin"` 대신 `role: "user"`가 표시되면 다른 계정이 먼저 등록된 것입니다.

**해결책**: 데이터베이스를 사용하여 역할을 업데이트하세요:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### DNS 오류로 Podman 빌드 실패

Podman의 기본 네트워크는 빌드 중 DNS 접근이 없습니다.

**해결책**: Podman으로 이미지를 빌드할 때는 항상 `--network=host`를 사용하세요:

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### 프론트엔드에 "502 Bad Gateway" 표시

Nginx 컨테이너가 API 서버에 접근할 수 없습니다.

**해결책**: 다음을 확인하세요:
1. API 컨테이너가 실행 중인지: `docker-compose ps`
2. API 헬스 체크가 통과하는지: `docker exec openpr-api curl -f http://localhost:8080/health`
3. 두 컨테이너가 동일한 네트워크에 있는지: `docker network inspect openpr_openpr-network`

### 포트 충돌

다른 서비스가 동일한 포트를 사용하고 있습니다.

**해결책**: `docker-compose.yml`에서 외부 포트 매핑을 변경하세요:

```yaml
api:
  ports:
    - "8082:8080"  # Changed from 8081
```

## MCP 서버

### "tools/list returns empty"

MCP 서버가 API에 연결할 수 없습니다.

**해결책**: 환경 변수를 확인하세요:

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

다음을 확인하세요:
- `OPENPR_API_URL`이 올바른 API 엔드포인트를 가리키는지
- `OPENPR_BOT_TOKEN`이 유효한 봇 토큰인지 (`opr_`로 시작)
- `OPENPR_WORKSPACE_ID`가 유효한 워크스페이스 UUID인지

### stdio 전송이 작동하지 않음

MCP 바이너리를 AI 클라이언트에서 명령으로 설정해야 합니다.

**해결책**: 바이너리 경로가 정확하고 환경 변수가 설정되었는지 확인하세요:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/absolute/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_...",
        "OPENPR_WORKSPACE_ID": "..."
      }
    }
  }
}
```

### SSE 연결 끊김

SSE 연결은 짧은 타임아웃이 있는 프록시 서버에 의해 닫힐 수 있습니다.

**해결책**: 리버스 프록시를 사용하는 경우 SSE 엔드포인트의 타임아웃을 늘리세요:

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## 프론트엔드

### 배포 후 빈 페이지

프론트엔드 빌드가 잘못된 API URL을 사용했을 수 있습니다.

**해결책**: 빌드 전에 `VITE_API_URL`을 설정하세요:

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### 로그인은 되지만 페이지가 비어있음

API 요청이 자동으로 실패하고 있습니다. 브라우저 콘솔(F12)에서 401 또는 CORS 오류를 확인하세요.

**해결책**: API가 브라우저에서 접근 가능하고 CORS가 설정되어 있는지 확인하세요. 프론트엔드는 Nginx를 통해 API 요청을 프록시해야 합니다.

## 성능

### 느린 검색

대용량 데이터셋에서 적절한 인덱스 없이는 PostgreSQL 전문 검색이 느릴 수 있습니다.

**해결책**: FTS 인덱스가 존재하는지 확인하세요 (마이그레이션에서 생성됨):

```sql
-- Check for existing indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### 높은 메모리 사용량

API 서버는 파일 업로드를 메모리에서 처리합니다.

**해결책**: 업로드 크기를 제한하고 `uploads/` 디렉토리를 모니터링하세요. 오래된 업로드에 대한 주기적인 정리를 설정하는 것을 고려하세요.

## 도움 받기

문제가 여기에 해당하지 않는 경우:

1. 알려진 문제는 [GitHub Issues](https://github.com/openprx/openpr/issues)를 확인하세요.
2. 오류 메시지에 대한 API 및 MCP 서버 로그를 검토하세요.
3. 오류 로그, 환경 세부 정보, 재현 단계와 함께 새 이슈를 여세요.
