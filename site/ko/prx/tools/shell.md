---
title: 셸 실행
description: 설정 가능한 격리 백엔드, 환경 정리, 타임아웃 강제, 출력 제한을 갖춘 샌드박스 환경에서 명령을 실행하는 셸 도구입니다.
---

# 셸 실행

`shell` 도구는 PRX의 세 가지 핵심 도구 중 하나로, `default_tools()`와 `all_tools()` 레지스트리 모두에서 사용할 수 있습니다. 설정 가능한 샌드박스 내에서 OS 수준 명령 실행을 제공하여 에이전트가 시작한 명령이 엄격한 격리, 시간 제한, 출력 제약 하에서 실행되도록 합니다.

LLM이 셸 명령을 실행해야 한다고 판단하면 -- 패키지 설치, 코드 컴파일, 시스템 상태 쿼리, 스크립트 실행 -- `shell` 도구를 명령 문자열과 함께 호출합니다. PRX는 설정된 샌드박스 백엔드로 실행을 래핑하고, 60초 기본 타임아웃을 강제하며, 출력을 1 MB로 제한하고, 자식 프로세스를 스폰하기 전에 민감한 환경 변수를 제거합니다.

셸 도구는 일반적으로 PRX에서 가장 강력하고 가장 제한된 도구입니다. 보안 정책 엔진의 주요 대상이며, 대부분의 배포에서 실행 전 사람의 승인을 요구하는 `supervised`로 표시합니다.

## 설정

셸 도구 자체는 전용 설정 섹션이 없습니다. 동작은 보안 샌드박스와 리소스 제한을 통해 제어됩니다:

```toml
[security.sandbox]
enabled = true
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# 커스텀 Firejail 인자 (backend = "firejail"일 때)
firejail_args = ["--net=none", "--noroot"]

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]

[security.resources]
max_memory_mb = 512
max_cpu_time_seconds = 60
max_subprocesses = 10
memory_monitoring = true
```

셸을 감독 모드로 표시하려면(호출당 승인 필요):

```toml
[security.tool_policy.tools]
shell = "supervised"
```

## 샌드박스 백엔드

PRX는 5개의 샌드박스 백엔드를 지원합니다. `backend = "auto"`일 때 PRX는 다음 우선순위로 사용 가능한 백엔드를 탐색하고 첫 번째 것을 선택합니다:

| 백엔드 | 플랫폼 | 격리 수준 | 오버헤드 | 참고 |
|--------|--------|-----------|----------|------|
| **Landlock** | Linux (5.13+) | 파일시스템 LSM | 최소 | 커널 네이티브, 추가 의존성 없음. 커널 수준에서 파일시스템 경로를 제한. |
| **Firejail** | Linux | 전체 (네트워크, 파일시스템, PID) | 낮음 | 유저 스페이스 샌드박스. 네트워크 격리를 위한 `--net=none`, PID 네임스페이스, seccomp 필터링 지원. |
| **Bubblewrap** | Linux, macOS | 네임스페이스 기반 | 낮음 | 유저 네임스페이스 사용. 설정 가능한 쓰기/읽기 전용 경로 목록. |
| **Docker** | 모든 플랫폼 | 전체 컨테이너 | 높음 | 일회용 컨테이너 내에서 명령 실행. 최대 격리이지만 최고 지연. |
| **None** | 모든 플랫폼 | 애플리케이션 계층만 | 없음 | OS 수준 격리 없음. PRX가 여전히 타임아웃과 출력 제한을 강제하지만 프로세스가 전체 OS 접근 가능. |

### Landlock

Landlock은 커널 5.13+에서 사용 가능한 Linux 보안 모듈입니다. 루트 권한 없이 커널 수준에서 파일시스템 접근을 제한합니다. PRX는 Landlock을 사용하여 셸 명령이 읽고 쓸 수 있는 경로를 제한합니다.

### Firejail

Firejail은 Linux 네임스페이스와 seccomp를 통해 종합적인 샌드박싱을 제공합니다. `firejail_args`를 통해 커스텀 인자를 전달할 수 있습니다:

```toml
[security.sandbox]
backend = "firejail"
firejail_args = ["--net=none", "--noroot", "--nosound", "--no3d"]
```

### Bubblewrap

Bubblewrap(`bwrap`)은 유저 네임스페이스를 사용하여 최소한의 샌드박스 환경을 생성합니다. Firejail보다 가볍고 일부 macOS 설정에서도 작동합니다:

```toml
[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp", "/home/user/workspace"]
readonly_paths = ["/usr", "/lib", "/bin"]
```

### Docker

Docker는 완전한 컨테이너 격리를 제공합니다. 각 명령이 설정된 이미지를 기반으로 새 컨테이너에서 실행됩니다:

```toml
[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"
```

## 사용법

셸 도구는 에이전틱 루프 중 LLM에 의해 호출됩니다. 에이전트 대화에서 LLM은 다음과 같은 도구 호출을 생성합니다:

```json
{
  "name": "shell",
  "arguments": {
    "command": "ls -la /home/user/project"
  }
}
```

CLI에서 에이전트 출력의 셸 도구 호출을 관찰할 수 있습니다. 도구 호출은 실행되는 명령과 사용 중인 샌드박스 백엔드를 표시합니다.

### 실행 흐름

1. LLM이 `command` 인자와 함께 `shell` 도구 호출을 생성
2. 보안 정책 엔진이 호출이 허용, 거부 또는 감독 필요인지 확인
3. 감독 모드이면 PRX가 사용자에게 진행 전 승인을 요청
4. 샌드박스 백엔드가 적절한 격리 계층으로 명령을 래핑
5. 환경 변수가 정리됨 (아래 참조)
6. 60초 타임아웃으로 명령 실행
7. stdout과 stderr가 캡처되고, 필요하면 1 MB로 잘림
8. 결과가 성공/실패 상태와 함께 `ToolResult`로 LLM에 반환

## 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `command` | `string` | 예 | -- | 실행할 셸 명령. `/bin/sh -c` (또는 동등)에 전달됨. |

도구는 다음을 포함하는 `ToolResult`를 반환합니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | `bool` | 명령이 코드 0으로 종료되면 `true` |
| `output` | `string` | stdout과 stderr 결합, 1 MB로 잘림 |
| `error` | `string?` | 명령이 실패하거나 타임아웃되면 오류 메시지 |

## 환경 정리

셸 도구는 자식 프로세스에 엄격한 화이트리스트의 환경 변수만 전달합니다. 이는 데몬 환경에 존재할 수 있는 API 키, 토큰, 시크릿의 우발적 유출을 방지합니다.

**허용된 환경 변수:**

| 변수 | 용도 |
|------|------|
| `PATH` | 실행 파일 검색 경로 |
| `HOME` | 사용자 홈 디렉토리 |
| `TERM` | 터미널 유형 |
| `LANG` | 로케일 언어 |
| `LC_ALL` | 로케일 재정의 |
| `LC_CTYPE` | 문자 유형 로케일 |
| `USER` | 현재 사용자 이름 |
| `SHELL` | 기본 셸 경로 |
| `TMPDIR` | 임시 디렉토리 |

`API_KEY`, `AWS_SECRET_ACCESS_KEY`, `GITHUB_TOKEN`, `OPENAI_API_KEY` 및 커스텀 변수를 포함한 다른 모든 변수는 자식 프로세스 환경에서 제거됩니다. 이것은 설정을 통해 재정의할 수 없는 하드코딩된 보안 경계입니다.

## 리소스 제한

| 제한 | 기본값 | 설정 가능 | 설명 |
|------|--------|-----------|------|
| 타임아웃 | 60초 | `security.resources.max_cpu_time_seconds` | 명령당 최대 벽시계 시간 |
| 출력 크기 | 1 MB | -- | 최대 stdout + stderr 결합 |
| 메모리 | 512 MB | `security.resources.max_memory_mb` | 명령당 최대 메모리 사용 |
| 서브프로세스 | 10 | `security.resources.max_subprocesses` | 스폰되는 최대 자식 프로세스 |

명령이 타임아웃을 초과하면 PRX가 SIGTERM을 보내고 유예 기간 후 SIGKILL을 보냅니다. 도구 결과는 타임아웃을 오류로 보고합니다.

출력이 1 MB를 초과하면 잘리고 잘림을 나타내는 참고가 추가됩니다.

## 보안

- **샌드박스 격리**: 명령이 설정된 샌드박스 백엔드 내에서 실행되어 파일시스템, 네트워크, 프로세스 접근을 제한
- **환경 정리**: 9개의 화이트리스트된 환경 변수만 자식 프로세스에 전달
- **정책 엔진**: 모든 셸 호출이 실행 전에 보안 정책 엔진을 통과
- **감사 로깅**: `security.audit.enabled = true`일 때 모든 셸 명령과 결과가 감사 로그에 기록
- **감독 모드**: 셸 도구를 도구 정책에서 `supervised`로 표시하여 각 실행 전 명시적 사용자 승인 필요
- **리소스 제한**: 타임아웃, 메모리, 출력 크기, 서브프로세스 수에 대한 엄격한 제한으로 리소스 고갈 방지

### 위협 완화

셸 도구는 프롬프트 인젝션 공격의 주요 벡터입니다. 공격자가 LLM의 추론에 영향을 줄 수 있다면(예: 악성 문서 내용을 통해) 셸 도구가 명령 실행에 사용됩니다. PRX는 다음을 통해 이를 완화합니다:

1. **샌드박스 격리** -- 악성 명령이 실행되더라도 제한된 파일시스템과 네트워크 접근으로 실행
2. **환경 제거** -- API 키와 시크릿이 자식 프로세스에서 사용 불가
3. **감독 모드** -- 사람이 각 명령을 실행 전에 검토 가능
4. **감사 추적** -- 모든 명령이 포렌식 검토를 위해 로그됨

## 관련 페이지

- [보안 샌드박스](/ko/prx/security/sandbox) -- 상세한 샌드박스 백엔드 문서
- [정책 엔진](/ko/prx/security/policy-engine) -- 도구 접근 제어 규칙
- [설정 참조](/ko/prx/config/reference) -- `security.sandbox` 및 `security.resources` 필드
- [도구 개요](/ko/prx/tools/) -- 모든 46개 이상 도구 및 레지스트리 시스템
