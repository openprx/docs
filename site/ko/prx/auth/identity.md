---
title: ID 관리
description: PRX의 워크스페이스 및 사용자 범위 지정, 멀티 테넌시, ID 컨텍스트 전파입니다.
---

# ID 관리

PRX의 ID 시스템은 모든 에이전트 작업에 대해 워크스페이스 수준 및 사용자 수준 범위 지정을 제공합니다. 멀티 테넌트 배포에서 ID 컨텍스트는 주어진 세션이 접근할 수 있는 메모리, 설정, 도구, 리소스를 결정합니다. ID 모듈은 접근 제어, 감사 로깅, 개인화의 기반입니다.

## 개요

모든 PRX 세션은 다음을 포함하는 ID 컨텍스트 내에서 작동합니다:

| 구성 요소 | 설명 |
|-----------|------|
| **User** | 에이전트와 상호 작용하는 사람 또는 봇 |
| **Workspace** | 사용자, 설정, 데이터를 그룹화하는 논리적 경계 |
| **Session** | 사용자와 에이전트 간의 단일 대화 |
| **Principal** | 접근 제어 결정을 위한 유효 ID |

```
┌─────────────────────────────────────────┐
│              Workspace: "acme"          │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ User: A  │  │ User: B  │  ...       │
│  │          │  │          │            │
│  │ Sessions │  │ Sessions │            │
│  │ Memories │  │ Memories │            │
│  │ Config   │  │ Config   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  Shared: workspace config, tools, keys │
└─────────────────────────────────────────┘
```

## 설정

### 워크스페이스 설정

```toml
[identity]
# 멀티 테넌트 ID 범위 지정 활성화.
enabled = true

# 워크스페이스를 지정하지 않는 세션의 기본 워크스페이스.
default_workspace = "default"

# 사용자가 새 워크스페이스를 생성할 수 있도록 허용.
allow_workspace_creation = true

# 배포당 최대 워크스페이스 수.
max_workspaces = 100
```

### 사용자 프로필

사용자 프로필은 사용자별 선호도와 메타데이터를 저장합니다:

```toml
[identity.profiles]
# 사용자 프로필의 스토리지 백엔드: "memory" | "sqlite" | "postgres"
backend = "sqlite"
path = "~/.local/share/openprx/identities.db"
```

### 워크스페이스 설정

각 워크스페이스는 자체 설정 오버레이를 가질 수 있습니다:

```toml
# config.toml의 워크스페이스별 오버라이드
[workspaces.acme]
display_name = "ACME Corp"
default_provider = "openai"
default_model = "gpt-4o"

[workspaces.acme.memory]
backend = "postgres"

[workspaces.acme.security.tool_policy]
default = "supervised"
```

## ID 컨텍스트

`IdentityContext` 구조체는 전체 요청 파이프라인을 통해 전달됩니다. `user_id`, `display_name`, `workspace_id`, `session_id`, `role` (Owner/Admin/Member/Guest), `channel`, 임의의 `metadata`를 포함합니다.

ID 컨텍스트는 모든 계층을 통해 전파됩니다: 게이트웨이가 수신 요청에서 추출하고, 에이전트 루프가 메모리 및 도구 접근 범위 지정에 사용하며, 메모리 시스템이 워크스페이스와 사용자별로 데이터를 네임스페이스하고, 비용 추적이 사용량을 귀속하며, 감사 로그가 행위자를 기록합니다.

## 멀티 테넌시

PRX는 여러 조직이 단일 PRX 인스턴스를 공유하는 멀티 테넌트 배포를 지원합니다. 테넌시 경계는 워크스페이스 수준에서 적용됩니다:

### 데이터 격리

| 리소스 | 격리 수준 |
|--------|----------|
| 메모리 | 워크스페이스별 + 사용자별 |
| 설정 | 전역 기본값에 대한 워크스페이스별 오버레이 |
| 도구 정책 | 워크스페이스별 오버라이드 |
| 시크릿 | 워크스페이스별 볼트 |
| 비용 예산 | 워크스페이스별 제한 |
| 감사 로그 | 워크스페이스별 필터링 |

### 워크스페이스 간 접근

기본적으로 사용자는 자신의 워크스페이스 내 리소스에만 접근할 수 있습니다. 워크스페이스 간 접근은 명시적인 설정이 필요합니다:

```toml
[identity.cross_workspace]
# 워크스페이스 관리자가 다른 워크스페이스에 접근할 수 있도록 허용.
admin_cross_access = false

# 특정 사용자가 여러 워크스페이스에 접근할 수 있도록 허용.
[[identity.cross_workspace.grants]]
user_id = "shared-bot"
workspaces = ["acme", "beta-corp"]
role = "member"
```

## 사용자 해결

PRX는 통신 채널에 따라 사용자 ID를 다르게 해결합니다:

| 채널 | ID 소스 | 사용자 ID 형식 |
|------|---------|---------------|
| Telegram | Telegram 사용자 ID | `telegram:<user_id>` |
| Discord | Discord 사용자 ID | `discord:<user_id>` |
| Slack | Slack 사용자 ID | `slack:<workspace_id>:<user_id>` |
| CLI | 시스템 사용자명 | `cli:<username>` |
| API/Gateway | Bearer 토큰 / API 키 | `api:<key_hash>` |
| WeChat | WeChat OpenID | `wechat:<open_id>` |
| QQ | QQ 번호 | `qq:<qq_number>` |

### 최초 접촉 등록

새로운 사용자가 PRX와 처음 상호 작용하면 ID 레코드가 자동으로 생성됩니다: 채널 어댑터가 사용자 식별자를 추출하고, 기본 설정으로 프로필을 생성하며, `Member` 역할로 `default_workspace`에 사용자를 할당합니다.

### 수동 사용자 관리

```bash
# 모든 알려진 사용자 목록
prx identity list

# 사용자 세부 정보 표시
prx identity info telegram:123456

# 사용자를 워크스페이스에 할당
prx identity assign telegram:123456 --workspace acme --role admin

# 워크스페이스에서 사용자 제거
prx identity remove telegram:123456 --workspace acme

# 사용자 메타데이터 설정
prx identity set telegram:123456 --key language --value en
```

## 워크스페이스 관리

```bash
# 모든 워크스페이스 목록
prx workspace list

# 새 워크스페이스 생성
prx workspace create acme --display-name "ACME Corp"

# 워크스페이스 세부 정보 표시
prx workspace info acme

# 워크스페이스 설정 지정
prx workspace config acme --set default_provider=anthropic

# 워크스페이스 삭제 (확인 필요)
prx workspace delete acme --confirm
```

## 사용자 프로필

사용자 프로필은 에이전트의 동작을 개인화하는 선호도를 저장합니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `user_id` | string | 고유 식별자 |
| `display_name` | string | 사람이 읽을 수 있는 이름 |
| `language` | string | 선호 언어 (ISO 639-1) |
| `timezone` | string | 선호 시간대 (IANA 형식) |
| `role` | enum | 워크스페이스 역할 (owner, admin, member, guest) |
| `preferences` | map | 키-값 선호도 (모델, 상세도 등) |
| `created_at` | datetime | 최초 상호 작용 타임스탬프 |
| `last_seen_at` | datetime | 가장 최근 상호 작용 타임스탬프 |

### 시스템 프롬프트에서 프로필 접근

에이전트의 시스템 프롬프트는 템플릿 변수를 통해 사용자 프로필 정보를 포함할 수 있습니다 (예: <code v-pre>{{identity.display_name}}</code>, <code v-pre>{{identity.language}}</code>). 이는 프롬프트가 LLM에 전송되기 전에 ID 컨텍스트에서 해결됩니다.

## 역할 기반 접근 제어

워크스페이스 역할은 사용자가 수행할 수 있는 작업을 결정합니다:

| 권한 | Owner | Admin | Member | Guest |
|------|-------|-------|--------|-------|
| 에이전트 사용 (채팅) | 예 | 예 | 예 | 예 |
| 메모리 저장 | 예 | 예 | 예 | 아니요 |
| 도구 설정 | 예 | 예 | 아니요 | 아니요 |
| 사용자 관리 | 예 | 예 | 아니요 | 아니요 |
| 워크스페이스 관리 | 예 | 아니요 | 아니요 | 아니요 |
| 감사 로그 조회 | 예 | 예 | 아니요 | 아니요 |

## 통합 지점

`identity.enabled = true`일 때 모든 메모리 작업은 `workspace:{workspace_id}:user:{user_id}:{key}`로 범위가 지정되어 데이터 격리를 보장합니다. 도구 정책은 워크스페이스별로 오버라이드할 수 있으며, 토큰 사용량은 사용자별 비용 보고를 위해 ID 컨텍스트에 귀속됩니다.

## 보안 참고

- **ID 스푸핑** -- ID 시스템은 채널 어댑터가 사용자를 올바르게 식별한다고 신뢰합니다. 채널 인증이 적절히 설정되었는지 확인하세요 (봇 토큰, OAuth 등).
- **워크스페이스 격리** -- 워크스페이스 경계는 애플리케이션 로직에서 적용됩니다. 기본 스토리지 (SQLite, Postgres)는 데이터베이스 수준의 격리를 제공하지 않습니다. 범위 지정 로직의 버그로 데이터가 유출될 수 있습니다.
- **게스트 접근** -- 게스트는 기본적으로 최소 권한을 가집니다. 공개 대면 에이전트를 활성화할 때 게스트 역할 설정을 검토하세요.
- **프로필 데이터** -- 사용자 프로필에 개인 정보가 포함될 수 있습니다. 개인정보 보호 정책 및 관련 규정에 따라 처리하세요.
- **워크스페이스 간 부여** -- 워크스페이스 간 접근은 신중하게 부여하세요. 각 부여는 계정 침해 시 영향 범위를 확대합니다.

## 관련 페이지

- [인증 개요](/ko/prx/auth/)
- [OAuth2 흐름](/ko/prx/auth/oauth2)
- [프로바이더 프로필](/ko/prx/auth/profiles)
- [보안 개요](/ko/prx/security/)
- [정책 엔진](/ko/prx/security/policy-engine)
- [메모리 시스템](/ko/prx/memory/)
