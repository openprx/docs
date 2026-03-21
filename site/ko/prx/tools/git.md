---
title: Git 작업
description: 워크스페이스 저장소에서 status, diff, commit, push, pull, log, branch 작업을 지원하는 버전 관리 도구입니다.
---

# Git 작업

`git_operations` 도구는 PRX 에이전트에 통합 인터페이스를 통한 버전 관리 기능을 제공합니다. 에이전트가 셸 도구를 통해 `git` 명령을 호출하도록 요구하는 대신(샌드박스 제한 적용), `git_operations`는 가장 일반적인 Git 워크플로우를 위한 구조화되고 안전한 API를 제공합니다: 상태 확인, 차이점 보기, 커밋 생성, 푸시, 풀, 이력 보기, 브랜치 관리.

이 도구는 에이전트가 작업하는 프로젝트 디렉토리인 워크스페이스 저장소에서 작동합니다. `all_tools()` 레지스트리에 등록되며 에이전트가 전체 도구 세트로 실행될 때 항상 사용할 수 있습니다.

Git을 셸 명령이 아닌 일급 도구로 제공함으로써, PRX는 세밀한 보안 정책을 적용하고, 인자를 검증하며, LLM이 안정적으로 파싱할 수 있는 구조화된 출력을 생성할 수 있습니다.

## 설정

`git_operations` 도구는 전용 설정 섹션이 없습니다. 동작은 워크스페이스 경로와 보안 정책으로 제어됩니다:

```toml
# git 작업을 위한 도구 정책
[security.tool_policy.tools]
git_operations = "allow"    # "allow" | "deny" | "supervised"
```

워크스페이스 저장소는 에이전트 세션의 현재 작업 디렉토리에 의해 결정됩니다. 에이전트가 Git 저장소 내에서 시작되면 해당 저장소가 사용됩니다. 그렇지 않으면 도구가 저장소를 찾을 수 없다는 오류를 반환합니다.

## 사용법

`git_operations` 도구는 수행할 Git 액션을 지정하는 `operation` 파라미터를 받습니다:

### status

현재 저장소 상태 확인 (스테이징, 미스테이징, 추적되지 않는 파일):

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "status"
  }
}
```

다음을 표시하는 구조화된 출력을 반환합니다:
- 현재 브랜치 이름
- 커밋을 위해 스테이징된 파일
- 수정되었지만 미스테이징된 파일
- 추적되지 않는 파일
- 업스트림 추적 상태

### diff

작업 트리 또는 커밋 간 변경 사항 보기:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["--staged"]
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["HEAD~3..HEAD"]
  }
}
```

### commit

메시지와 함께 커밋 생성:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "fix: resolve race condition in session cleanup"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "feat: add web search provider selection",
    "args": ["--all"]
  }
}
```

### push

원격 저장소에 커밋 푸시:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push",
    "args": ["origin", "feature/web-search"]
  }
}
```

### pull

원격 저장소에서 변경 사항 풀:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "pull"
  }
}
```

### log

커밋 이력 보기:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "log",
    "args": ["--oneline", "-20"]
  }
}
```

### branch

브랜치 나열, 생성 또는 전환:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch",
    "args": ["feature/new-tool"]
  }
}
```

## 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `operation` | `string` | 예 | -- | Git 작업: `"status"`, `"diff"`, `"commit"`, `"push"`, `"pull"`, `"log"`, `"branch"` |
| `message` | `string` | 조건부 | -- | 커밋 메시지 (`"commit"` 작업에 필수) |
| `args` | `array` | 아니오 | `[]` | Git 명령에 전달되는 추가 인자 |

**반환:**

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `bool` | Git 작업이 성공적으로 완료되면 `true` |
| `output` | `string` | Git 명령 출력 (상태 텍스트, diff 내용, 로그 항목 등) |
| `error` | `string?` | 작업 실패 시 오류 메시지 |

## 일반 워크플로우

### 피처 브랜치 워크플로우

일반적인 에이전트 주도 피처 브랜치 워크플로우:

```
1. [git_operations] operation="branch", args=["feature/add-search"]
2. [file_write] 새 파일 작성
3. [git_operations] operation="status"  -- 변경 사항 확인
4. [git_operations] operation="diff"    -- 변경 사항 검토
5. [git_operations] operation="commit", message="feat: add search functionality", args=["--all"]
6. [git_operations] operation="push", args=["-u", "origin", "feature/add-search"]
```

### 코드 리뷰 준비

커밋 전 변경 사항 검사:

```
1. [git_operations] operation="status"
2. [git_operations] operation="diff", args=["--staged"]
3. [git_operations] operation="log", args=["--oneline", "-5"]
4. 에이전트가 diff를 검토하고 개선점을 제안
```

### 충돌 해결

병합 충돌 확인 및 해결:

```
1. [git_operations] operation="pull"
2. 충돌 발생 시: [git_operations] operation="status"
3. [file_read] 충돌 파일 읽기
4. [file_write] 충돌 해결
5. [git_operations] operation="commit", message="merge: resolve conflicts in config.toml"
```

## 보안

### 셸과의 비교

`shell` 도구를 통해 `git`을 실행하는 대신 `git_operations`를 사용하면 몇 가지 보안 이점이 있습니다:

- **인자 검증**: 파라미터가 실행 전에 검증되어 인젝션 공격을 방지
- **구조화된 출력**: 결과가 예측 가능한 형식으로 파싱되어 반환
- **셸 확장 없음**: 인자가 셸 해석 없이 Git에 직접 전달
- **세밀한 정책**: `shell`이 거부되거나 감독되는 동안 `git_operations`는 허용 가능

### 파괴적 작업 보호

이 도구에는 일반적인 파괴적 작업에 대한 보호 장치가 포함되어 있습니다:

- **강제 푸시**: `--force` 및 `--force-with-lease` 인자는 경고와 함께 로그됨
- **브랜치 삭제**: `-D` (강제 삭제) 작업은 감사 로그에 플래그됨
- **리셋 작업**: 하드 리셋은 도구를 통해 직접 노출되지 않음

최대 안전을 위해 `git_operations`를 감독 모드로 표시합니다:

```toml
[security.tool_policy.tools]
git_operations = "supervised"
```

### 자격 증명 처리

`git_operations` 도구는 시스템의 Git 자격 증명 스토리지(크리덴셜 헬퍼, SSH 키 등)를 사용합니다. 자격 증명을 노출하거나 로그하지 않습니다. 원격 작업(push, pull)은 호스트에 사전 설정된 Git 자격 증명에 의존합니다.

### 감사 로깅

활성화되면 모든 Git 작업이 감사 로그에 기록됩니다:

- 작업 유형 (status, commit, push 등)
- 인자
- 성공/실패 상태
- 커밋 SHA (커밋 작업의 경우)

## 관련 페이지

- [셸 실행](/ko/prx/tools/shell) -- 고급 Git 명령의 대안
- [파일 작업](/ko/prx/tools/file-operations) -- 저장소의 파일 읽기/쓰기
- [세션 및 에이전트](/ko/prx/tools/sessions) -- 전문 에이전트에 Git 작업 위임
- [정책 엔진](/ko/prx/security/policy-engine) -- Git 작업의 접근 제어
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
