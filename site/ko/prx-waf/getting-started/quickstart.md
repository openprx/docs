---
title: 빠른 시작
description: "6단계로 PRX-WAF를 시작하고 첫 번째 웹 애플리케이션을 보호합니다."
---

# 빠른 시작

이 가이드는 6단계로 PRX-WAF를 실행하고 웹 애플리케이션을 보호하는 방법을 안내합니다.

## 1단계: 클론 및 시작

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

서비스가 시작될 때까지 기다립니다:

```bash
docker compose ps
# 모든 서비스가 "Up" 상태로 표시되어야 합니다
```

## 2단계: 관리자 UI에 로그인

브라우저에서 `http://localhost:9527`을 엽니다.

기본 자격 증명으로 로그인:
- **사용자명**: `admin`
- **비밀번호**: `admin`

::: warning
로그인 후 즉시 비밀번호를 변경하세요.
:::

## 3단계: 업스트림 애플리케이션 설정

**Hosts** 탭으로 이동하여 보호할 애플리케이션을 추가합니다:

```json
{
  "host": "myapp.example.com",
  "upstream": "http://127.0.0.1:3000",
  "tls": false
}
```

또는 API를 사용합니다:

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "myapp.example.com",
    "upstream": "http://127.0.0.1:3000"
  }'
```

## 4단계: 규칙 확인

**Rules** 탭에서 활성 규칙을 확인합니다. 기본적으로 다음이 활성화됩니다:

- OWASP CRS 규칙 (SQLi, XSS, 경로 순회 등)
- 내장 봇 탐지
- 스캐너 탐지

```bash
# CLI에서 확인
prx-waf rules stats
```

## 5단계: WAF를 통해 트래픽 라우팅

DNS 또는 로드 밸런서를 WAF를 통해 트래픽을 라우팅하도록 업데이트합니다. 로컬 테스트의 경우:

```bash
# WAF 프록시를 통해 직접 테스트
curl -H "Host: myapp.example.com" http://localhost:8080/
```

WAF는 탐지된 위협을 차단하고 정상 요청을 `http://127.0.0.1:3000`으로 전달합니다.

## 6단계: WAF 테스트

간단한 SQLi 페이로드로 WAF를 테스트합니다:

```bash
# 이것은 차단되어야 합니다 (403 반환)
curl -H "Host: myapp.example.com" \
  "http://localhost:8080/?id=1'+OR+'1'='1"
```

관리자 UI의 **Security Events** 탭에서 차단 이벤트를 확인합니다.

## 다음 단계

- [규칙 엔진](../rules/) — 탐지 규칙 작동 방식 이해
- [사용자 정의 규칙](../rules/custom-rules) — 애플리케이션별 규칙 작성
- [SSL/TLS](../gateway/ssl-tls) — HTTPS 활성화
- [클러스터 모드](../cluster/) — 고가용성을 위한 여러 노드 배포
