---
title: 파일 작업
description: file_read와 file_write 도구는 경로 검증, 메모리 ACL 강제, 보안 정책 통합과 함께 파일시스템 접근을 제공합니다.
---

# 파일 작업

PRX는 최소 `default_tools()` 세트의 일부인 두 가지 핵심 파일 작업 도구 -- `file_read`와 `file_write` -- 를 제공합니다. 이 도구들은 항상 사용 가능하며, 추가 설정이 필요 없고, 에이전트가 로컬 파일시스템과 상호작용하는 기반을 형성합니다.

두 도구 모두 보안 정책 엔진의 적용을 받습니다. 경로 검증은 에이전트가 허용된 디렉토리 내의 파일만 접근할 수 있도록 합니다. 메모리 ACL이 활성화되면 `file_read`는 에이전트가 메모리 스토리지를 직접 읽어 접근 제어를 우회하는 것을 방지하기 위해 메모리 마크다운 파일 접근을 추가로 차단합니다.

`shell` 도구와 달리, 파일 작업은 외부 프로세스를 스폰하지 않습니다. PRX 프로세스 내에서 직접 Rust I/O 작업으로 구현되어 `cat`이나 `echo >`와 같은 동등한 셸 명령보다 빠르고 감사하기 쉽습니다.

## 설정

파일 작업은 전용 설정 섹션이 없습니다. 동작은 보안 정책 엔진과 메모리 ACL 설정을 통해 제어됩니다:

```toml
# 메모리 ACL은 file_read 동작에 영향
[memory]
acl_enabled = false    # true일 때 file_read가 메모리 파일 접근 차단

# 보안 정책으로 파일 접근 경로 제한 가능
[security.tool_policy.tools]
file_read = "allow"    # "allow" | "deny" | "supervised"
file_write = "allow"

# 경로 기반 정책 규칙
[[security.policy.rules]]
name = "allow-workspace-read"
action = "allow"
tools = ["file_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "allow-workspace-write"
action = "allow"
tools = ["file_write"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-paths"
action = "deny"
tools = ["file_read", "file_write"]
paths = ["/etc/shadow", "/root/**", "**/.ssh/**", "**/.env"]
```

## 사용법

### file_read

`file_read` 도구는 파일 내용을 읽고 문자열로 반환합니다. 에이전트가 추론 루프에서 파일을 검사하는 주요 방법입니다.

```json
{
  "name": "file_read",
  "arguments": {
    "path": "/home/user/project/src/main.rs"
  }
}
```

에이전트는 일반적으로 `file_read`를 다음 용도로 사용합니다:

- 수정하기 전에 소스 코드 검사
- 시스템 상태를 이해하기 위해 설정 파일 읽기
- 오류 메시지를 위한 로그 파일 확인
- 문서 또는 README 파일 검토

### file_write

`file_write` 도구는 파일에 내용을 쓰며, 존재하지 않으면 생성하고 존재하면 내용을 덮어씁니다.

```json
{
  "name": "file_write",
  "arguments": {
    "path": "/home/user/project/src/config.toml",
    "content": "[server]\nport = 8080\nhost = \"0.0.0.0\"\n"
  }
}
```

에이전트는 일반적으로 `file_write`를 다음 용도로 사용합니다:

- 새 소스 파일이나 설정 파일 생성
- 기존 파일 수정 (`file_read`로 읽은 후)
- 생성된 보고서나 요약 작성
- 처리된 데이터를 디스크에 저장

## 파라미터

### file_read 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `path` | `string` | 예 | -- | 읽을 파일의 절대 또는 상대 경로 |

**반환:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `bool` | 파일이 성공적으로 읽히면 `true` |
| `output` | `string` | UTF-8 문자열로서의 파일 내용 |
| `error` | `string?` | 읽기 실패 시 오류 메시지 (파일 없음, 권한 거부, ACL 차단 등) |

### file_write 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `path` | `string` | 예 | -- | 쓸 파일의 절대 또는 상대 경로 |
| `content` | `string` | 예 | -- | 파일에 쓸 내용 |

**반환:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `bool` | 파일이 성공적으로 쓰이면 `true` |
| `output` | `string` | 확인 메시지 (예: "File written: /path/to/file") |
| `error` | `string?` | 쓰기 실패 시 오류 메시지 (권한 거부, 경로 차단 등) |

## 경로 검증

두 도구 모두 I/O 작업 실행 전에 경로 검증을 수행합니다:

1. **경로 정규화** -- 상대 경로는 현재 작업 디렉토리를 기준으로 해석됩니다. 심볼릭 링크는 경로 탈출을 감지하기 위해 해석됩니다.
2. **정책 검사** -- 해석된 경로는 보안 정책 규칙과 대조됩니다. 명시적으로 경로를 허용하는 규칙이 없고 기본 액션이 `deny`이면 작업이 차단됩니다.
3. **특수 경로 차단** -- 정책에 관계없이 특정 경로는 항상 차단됩니다:
   - `/proc/`, `/sys/` (Linux 커널 인터페이스)
   - `/dev/` 내 디바이스 파일 (`/dev/null`, `/dev/urandom` 제외)
   - `memory.acl_enabled = true`일 때 메모리 저장소 파일

### 경로 탈출 방지

도구는 정책 확인 전에 심볼릭 링크를 해석하고 `..` 구성요소를 정규화합니다. 이는 공격자가 심볼릭 링크나 상대 경로 트릭을 사용하여 허용된 디렉토리를 벗어나는 것을 방지합니다:

```
# 이들은 모두 해석되고 확인됩니다:
/home/user/workspace/../../../etc/passwd  →  /etc/passwd  →  거부됨
/home/user/workspace/link-to-etc          →  /etc/        →  거부됨 (심볼릭 링크인 경우)
```

## 메모리 ACL 강제

설정에서 `memory.acl_enabled = true`일 때 `file_read` 도구는 추가 제한을 강제합니다:

- **메모리 파일 차단**: `file_read`는 메모리 디렉토리(일반적으로 `~/.local/share/openprx/memory/`)에 저장된 마크다운 파일 읽기를 거부합니다. 이는 에이전트가 원시 저장소 파일을 읽어 메모리 접근 제어를 우회하는 것을 방지합니다.
- **메모리 리콜 비활성화**: ACL이 활성화되면 `memory_recall` 도구는 도구 레지스트리에서 완전히 제거됩니다.
- **타겟 접근만**: 에이전트는 메모리 내용에 접근하기 위해 적절한 ACL 검사와 함께 `memory_get` 또는 `memory_search`를 사용해야 합니다.

```toml
[memory]
acl_enabled = true    # 메모리 경로에 대한 file_read 제한 활성화
```

이 분리는 에이전트가 메모리 파일의 물리적 위치를 알고 있더라도 제어된 메모리 API 외부에서는 읽을 수 없도록 합니다.

## 보안

### 정책 엔진 통합

모든 `file_read`와 `file_write` 호출은 실행 전에 보안 정책 엔진을 통과합니다. 정책 엔진은 규칙을 순서대로 평가합니다:

1. 도구별 정책 (`security.tool_policy.tools.file_read`)
2. 경로 기반 규칙 (매칭되는 `paths` 패턴이 있는 `security.policy.rules`)
3. 기본 액션 (`security.policy.default_action`)

### 감사 로깅

감사 로깅이 활성화되면 모든 파일 작업이 다음과 함께 기록됩니다:

- 타임스탬프
- 도구 이름 (`file_read` 또는 `file_write`)
- 해석된 파일 경로
- 성공/실패 상태
- 오류 사유 (거부되거나 실패한 경우)

```toml
[security.audit]
enabled = true
log_path = "audit.log"
```

### 민감한 파일 보호

기본 보안 정책은 일반적인 민감한 경로에 대한 접근을 차단합니다:

- SSH 키 (`~/.ssh/`)
- 환경 파일 (`.env`, `.env.local`)
- Git 자격 증명 (`.git-credentials`)
- 셸 이력 (`.bash_history`, `.zsh_history`)
- 시스템 패스워드 파일 (`/etc/shadow`)

이 기본값은 명시적 허용 규칙으로 재정의할 수 있지만, 프로덕션에서는 강력히 권장하지 않습니다.

### 바이너리 파일 처리

`file_read` 도구는 파일을 UTF-8 문자열로 읽습니다. 바이너리 파일은 깨진 출력이나 인코딩 오류를 생성합니다. 에이전트는 바이너리 파일 검사를 위해 적절한 명령어(예: `xxd`, `file`, `hexdump`)와 함께 `shell` 도구를 사용해야 합니다.

## 관련 페이지

- [셸 실행](/ko/prx/tools/shell) -- 명령 실행 도구 (바이너리 파일의 대안)
- [메모리 도구](/ko/prx/tools/memory) -- ACL이 포함된 제어된 메모리 접근
- [정책 엔진](/ko/prx/security/policy-engine) -- 경로 기반 접근 제어 규칙
- [설정 참조](/ko/prx/config/reference) -- 메모리 및 보안 설정
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
