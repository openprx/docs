---
title: 문제 해결
description: "iOS 설치 실패, 업로드 오류, Docker 문제 등 Fenfa 실행 시 발생하는 일반적인 문제와 해결 방법."
---

# 문제 해결

이 페이지는 Fenfa 실행 시 발생하는 일반적인 문제와 해결 방법을 다룹니다.

## iOS 설치

### "설치할 수 없음" / 설치 실패

**증상:** iOS에서 설치 버튼을 탭하면 "설치할 수 없음"이 표시되거나 아무 일도 일어나지 않습니다.

**원인 및 해결 방법:**

1. **HTTPS가 설정되지 않음.** iOS는 OTA 설치를 위해 유효한 TLS 인증서가 있는 HTTPS가 필요합니다. 자체 서명 인증서는 작동하지 않습니다.
   - **해결:** 유효한 TLS 인증서로 리버스 프록시를 설정하세요. [프로덕션 배포](../deployment/production)를 참조하세요.
   - **테스트용:** `ngrok`을 사용하여 HTTPS 터널을 생성하세요: `ngrok http 8000`

2. **잘못된 primary_domain.** 매니페스트 plist에는 `primary_domain`을 기반으로 한 다운로드 URL이 포함되어 있습니다. 이것이 잘못되면 iOS가 IPA를 가져올 수 없습니다.
   - **해결:** `FENFA_PRIMARY_DOMAIN`을 사용자가 접근하는 정확한 HTTPS URL로 설정하세요 (예: `https://dist.example.com`).

3. **인증서 문제.** TLS 인증서는 도메인을 커버하고 iOS에서 신뢰할 수 있어야 합니다.
   - **해결:** 무료의 신뢰할 수 있는 인증서를 위해 Let's Encrypt를 사용하세요.

4. **IPA 서명 만료.** 프로비저닝 프로파일이나 서명 인증서가 만료되었을 수 있습니다.
   - **해결:** 유효한 인증서로 IPA를 다시 서명하고 재업로드하세요.

### UDID 바인딩이 작동하지 않음

**증상:** mobileconfig 프로파일이 설치되지만 기기가 등록되지 않습니다.

**원인 및 해결 방법:**

1. **콜백 URL에 접근할 수 없음.** UDID 콜백 URL은 기기에서 접근 가능해야 합니다.
   - **해결:** `primary_domain`이 올바르고 기기의 네트워크에서 접근 가능한지 확인하세요.

2. **Nonce 만료.** 프로파일 nonce는 일정 시간 후 만료됩니다.
   - **해결:** mobileconfig 프로파일을 다시 다운로드하고 재시도하세요.

## 업로드 문제

### 401로 업로드 실패

**증상:** `{"ok": false, "error": {"code": "UNAUTHORIZED", ...}}`

**해결:** `X-Auth-Token` 헤더에 유효한 토큰이 포함되어 있는지 확인하세요. 업로드 엔드포인트는 업로드 토큰과 관리 토큰 모두 허용합니다.

```bash
# Verify your token works
curl -H "X-Auth-Token: YOUR_TOKEN" http://localhost:8000/admin/api/products
```

### 413으로 업로드 실패 (요청 엔티티가 너무 큼)

**증상:** 대용량 파일 업로드가 413 오류로 실패합니다.

**해결:** 이것은 일반적으로 Fenfa가 아닌 리버스 프록시 제한입니다. 제한을 늘리세요:

**Nginx:**
```nginx
client_max_body_size 2G;
```

**Caddy:**
Caddy에는 기본 본문 크기 제한이 없지만 설정한 경우:
```
dist.example.com {
    request_body {
        max_size 2GB
    }
    reverse_proxy localhost:8000
}
```

### 스마트 업로드가 메타데이터를 감지하지 못함

**증상:** 스마트 업로드 후 버전과 빌드 번호가 비어 있습니다.

**해결:** 스마트 업로드 자동 감지는 IPA와 APK 파일에만 작동합니다. 데스크탑 형식 (DMG, EXE, DEB 등)의 경우 업로드 요청에 `version`과 `build`를 명시적으로 제공하세요.

## Docker 문제

### 컨테이너가 시작되지만 관리 패널이 비어 있음

**증상:** 관리 패널이 로드되지만 데이터가 없거나 빈 페이지가 표시됩니다.

**해결:** 컨테이너가 실행 중이고 포트 매핑이 올바른지 확인하세요:

```bash
docker ps
docker logs fenfa
```

### 컨테이너 재시작 후 데이터 손실

**증상:** 컨테이너를 재시작한 후 모든 제품, 변형, 릴리스가 사라집니다.

**해결:** 영구 볼륨을 마운트하세요:

```bash
docker run -d --name fenfa -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### 마운트된 볼륨에 권한 거부됨

**증상:** Fenfa가 `/data` 또는 `/app/uploads`에 쓰지 못합니다.

**해결:** 호스트 디렉토리가 존재하고 올바른 권한을 가지고 있는지 확인하세요:

```bash
mkdir -p data uploads
chmod 777 data uploads  # Or set appropriate UID/GID
```

## 데이터베이스 문제

### "database is locked" 오류

**증상:** 높은 동시성에서 SQLite가 "database is locked"를 반환합니다.

**해결:** SQLite는 동시 읽기를 잘 처리하지만 쓰기는 직렬화됩니다. 이 오류는 일반적으로 매우 높은 쓰기 부하에서 발생합니다. 해결 방법:
- 동일한 데이터베이스 파일에 하나의 Fenfa 인스턴스만 쓰도록 하세요.
- 여러 인스턴스를 실행하는 경우 S3 스토리지와 공유 데이터베이스를 사용하세요 (또는 향후 릴리스에서 다른 데이터베이스 백엔드로 전환).

### 데이터베이스 손상

**증상:** SQLite 오류로 Fenfa가 시작되지 않습니다.

**해결:** 백업에서 복원합니다:

```bash
# Stop Fenfa
docker stop fenfa

# Restore backup
cp /backups/fenfa-latest.db /path/to/data/fenfa.db

# Restart
docker start fenfa
```

::: tip 예방
자동화된 일일 백업을 설정하세요. 백업 스크립트는 [프로덕션 배포](../deployment/production)를 참조하세요.
:::

## 네트워크 문제

### iOS 매니페스트가 잘못된 URL을 반환함

**증상:** iOS 매니페스트 plist에 공개 도메인 대신 `http://localhost:8000`이 포함되어 있습니다.

**해결:** `FENFA_PRIMARY_DOMAIN`을 공개 HTTPS URL로 설정하세요:

```bash
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

### 다운로드가 느리거나 시간 초과됨

**증상:** 대용량 파일 다운로드가 느리거나 실패합니다.

**가능한 해결 방법:**
- 리버스 프록시 타임아웃 증가: `proxy_read_timeout 600s;` (Nginx)
- 요청 버퍼링 비활성화: `proxy_request_buffering off;` (Nginx)
- 대용량 파일에는 CDN이 있는 S3 호환 스토리지 사용 고려

## 도움 받기

여기서 문제가 해결되지 않는 경우:

1. 알려진 문제는 [GitHub Issues](https://github.com/openprx/fenfa/issues)를 확인하세요.
2. 컨테이너 로그를 검토하세요: `docker logs fenfa`
3. 다음 정보와 함께 새 이슈를 열어주세요:
   - Fenfa 버전 (`docker inspect fenfa | grep Image`)
   - 관련 로그 출력
   - 문제 재현 단계
