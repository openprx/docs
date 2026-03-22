---
title: 관리자 UI
description: "JWT + TOTP 인증, 실시간 대시보드, 보안 이벤트, 규칙 관리, CrowdSec 통합을 갖춘 PRX-WAF 관리자 대시보드 가이드."
---

# 관리자 UI

PRX-WAF에는 **Vue 3** + **Tailwind CSS**로 구축된 관리자 대시보드가 포함되어 있으며, JWT + TOTP 인증과 함께 제공됩니다.

## 접근

관리자 UI는 기본적으로 `http://localhost:9527`에서 제공됩니다.

기본 자격 증명:
- **사용자명**: `admin`
- **비밀번호**: `admin`

::: warning
초기 로그인 후 즉시 비밀번호를 변경하고, 2단계 인증(TOTP)을 활성화하세요.
:::

## 인증

### JWT 토큰

UI는 API 요청에 Bearer 토큰을 사용합니다. CLI에서 직접 API를 사용할 때 토큰 획득 방법:

```bash
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  | jq -r '.token')
```

### TOTP (2단계 인증)

관리자 설정에서 TOTP를 활성화합니다:

1. **프로필** → **2단계 인증** → **활성화**
2. Google Authenticator 또는 Authy로 QR 코드 스캔
3. 현재 OTP 코드를 입력하여 확인

TOTP가 활성화되면 로그인 시 비밀번호와 함께 코드가 필요합니다:

```bash
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin","totp":"123456"}' \
  | jq -r '.token')
```

## 대시보드 섹션

### 개요

- 초당 요청 수 (RPS) 실시간 차트
- 차단된 요청 수 (지난 24시간)
- 활성 규칙 수
- 클러스터 노드 상태

### 보안 이벤트

실시간 탐지 이벤트 로그:
- 타임스탬프, 소스 IP, 방법, URI
- 트리거된 규칙 ID 및 이름
- 취한 액션 (차단/로그/허용)
- 심각도 레벨

```bash
# API에서 최근 이벤트 가져오기
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/security-events?limit=50
```

### 규칙 관리

- 모든 로드된 규칙 보기 (필터링 및 정렬 가능)
- 규칙 활성화/비활성화
- 규칙 통계 (총 규칙, 카테고리별 분류)
- 핫 리로드 트리거

### 호스트 관리

- 보호된 애플리케이션 추가/편집/제거
- 업스트림 서버 설정
- IP 허용/차단 목록 관리

### IP 규칙

- 동적 IP 허용/차단 목록 관리
- 모든 활성 IP 규칙 보기
- IP 범위 추가 (CIDR 표기법)

### CrowdSec

- CrowdSec LAPI 연결 상태
- 활성 결정 목록 (차단/캡차)
- 연결 테스트

### SSL 인증서

- 인증서 만료 날짜
- Let's Encrypt 자동 갱신 상태
- 수동 인증서 업로드

### 설정

- 프록시 설정 편집
- 규칙 설정 조정
- 클러스터 상태 보기

## REST API

관리자 UI는 REST API를 통해 제공됩니다. 전체 엔드포인트:

```bash
# 서버 상태
GET /api/status

# 인증
POST /api/auth/login
POST /api/auth/refresh

# 보안 이벤트
GET /api/security-events
GET /api/security-events/stats

# 규칙
GET /api/rules
PUT /api/rules/{id}/enable
PUT /api/rules/{id}/disable
POST /api/rules/reload

# IP 규칙
GET /api/rules/ip
POST /api/rules/ip
DELETE /api/rules/ip/{id}

# 호스트
GET /api/hosts
POST /api/hosts
PUT /api/hosts/{id}
DELETE /api/hosts/{id}

# CrowdSec
GET /api/crowdsec/status
GET /api/crowdsec/decisions
POST /api/crowdsec/test

# 클러스터
GET /api/cluster/status
```

## 다음 단계

- [CrowdSec 통합](../crowdsec/) — 위협 인텔리전스 설정
- [규칙 엔진](../rules/) — 탐지 규칙 관리
- [설정 레퍼런스](../configuration/reference) — 관리 API 설정
