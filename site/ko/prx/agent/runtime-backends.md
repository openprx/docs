---
title: 런타임 백엔드
description: PRX의 플러거블 실행 백엔드 -- 도구 및 명령 실행을 위한 Native, Docker, WASM 런타임.
---

# 런타임 백엔드

PRX는 도구, 명령, 외부 프로세스를 실행하기 위한 여러 실행 백엔드를 지원합니다. 런타임 서브시스템은 `RuntimeAdapter` 트레이트 뒤에 실행 환경을 추상화하여, 에이전트 설정을 변경하지 않고도 로컬 프로세스 실행, Docker 컨테이너, WebAssembly 샌드박스 간에 전환할 수 있습니다.

## 개요

에이전트가 외부 명령 실행이 필요한 도구 (쉘 스크립트, MCP 서버, 스킬 통합)를 실행하면 런타임 백엔드가 해당 명령의 실행 방식을 결정합니다:

| 백엔드 | 격리 | 오버헤드 | 사용 사례 |
|--------|------|----------|----------|
| **Native** | 프로세스 수준 | 최소 | 개발, 신뢰할 수 있는 환경 |
| **Docker** | 컨테이너 수준 | 보통 | 프로덕션, 신뢰할 수 없는 도구, 재현성 |
| **WASM** | 샌드박스 수준 | 낮음 | 이식 가능한 스킬, 최대 격리, 플러그인 시스템 |

```
Agent Loop
    │
    ├── Tool Call: "shell" with command "ls -la"
    │
    ▼
┌───────────────────────────────────┐
│         RuntimeAdapter            │
│  ┌─────────┬─────────┬─────────┐ │
│  │ Native  │ Docker  │  WASM   │ │
│  │ Runtime │ Runtime │ Runtime │ │
│  └────┬────┴────┬────┴────┬────┘ │
└───────┼─────────┼─────────┼──────┘
        │         │         │
   ┌────▼────┐ ┌──▼───┐ ┌──▼────┐
   │ Process │ │ ctr  │ │ wasmr │
   │ spawn   │ │ exec │ │ exec  │
   └─────────┘ └──────┘ └───────┘
```

## RuntimeAdapter 트레이트

모든 백엔드는 `RuntimeAdapter` 트레이트를 구현합니다:

```rust
#[async_trait]
pub trait RuntimeAdapter: Send + Sync {
    async fn execute(&self, command: &str, args: &[String],
        env: &HashMap<String, String>, working_dir: Option<&Path>,
        timeout: Duration) -> Result<ExecutionOutput>;
    async fn is_available(&self) -> bool;
    fn name(&self) -> &str;
}
```

`ExecutionOutput`은 `stdout`, `stderr`, `exit_code`, `duration`을 포함합니다.

## 설정

`config.toml`에서 런타임 백엔드를 선택하고 설정합니다:

```toml
[runtime]
# 백엔드 선택: "native" | "docker" | "wasm" | "auto"
backend = "auto"

# 전역 실행 타임아웃 (도구별로 오버라이드 가능).
default_timeout_secs = 60

# stdout/stderr에서 캡처하는 최대 출력 크기.
max_output_bytes = 1048576  # 1 MB

# 환경 변수 화이트리스트. 이 변수만
# 자식 프로세스에 전달됩니다 (모든 백엔드).
env_whitelist = ["PATH", "HOME", "TERM", "LANG", "USER"]
```

### 자동 감지

`backend = "auto"`일 때 PRX는 가용성에 따라 런타임을 선택합니다:

1. Docker가 실행 중이고 접근 가능하면 Docker를 사용합니다
2. WASM 런타임이 사용 가능하면 호환 도구에 WASM을 사용합니다
3. Native로 폴백합니다

자동 감지는 시작 시 한 번 실행되며 선택된 백엔드를 로깅합니다.

## Native 런타임

Native 런타임은 `tokio::process::Command`를 사용하여 명령을 로컬 자식 프로세스로 생성합니다. 가장 단순하고 빠른 백엔드이며 추가 종속성이 없습니다.

### 설정

```toml
[runtime]
backend = "native"

[runtime.native]
# 명령 실행에 사용할 쉘.
shell = "/bin/bash"

# 설정할 추가 환경 변수.
[runtime.native.env]
RUSTFLAGS = "-D warnings"
```

### 특성

| 속성 | 값 |
|------|-----|
| 격리 | 프로세스 수준만 (사용자 권한 상속) |
| 시작 시간 | < 10ms |
| 파일시스템 접근 | 전체 (사용자 권한 및 샌드박스로 제한) |
| 네트워크 접근 | 전체 (샌드박스로 제한) |
| 종속성 | 없음 |
| 플랫폼 | 전체 (Linux, macOS, Windows) |

### 보안 고려 사항

Native 런타임은 표준 Unix 프로세스 경계를 넘어서는 격리를 제공하지 않습니다. 명령은 PRX 프로세스와 동일한 권한으로 실행됩니다. 신뢰할 수 없는 명령을 실행할 때는 항상 [샌드박스 서브시스템](/ko/prx/security/sandbox)과 함께 사용하세요:

```toml
[runtime]
backend = "native"

[security.sandbox]
backend = "bubblewrap"
allow_network = false
writable_paths = ["/tmp"]
```

## Docker 런타임

Docker 런타임은 일시적인 컨테이너 내에서 명령을 실행합니다. 각 실행마다 새 컨테이너를 생성하고, 명령을 실행하며, 출력을 캡처하고, 컨테이너를 삭제합니다.

### 설정

```toml
[runtime]
backend = "docker"

[runtime.docker]
image = "debian:bookworm-slim"
socket = "/var/run/docker.sock"
memory_limit = "256m"
cpu_limit = "1.0"
pids_limit = 100
network = "none"          # "none" | "bridge" | "host"
mount_workspace = true
workspace_mount_path = "/workspace"
auto_pull = true
auto_remove = true
```

시작 시간은 이미지에 따라 500ms-2초입니다. 파일시스템 접근은 컨테이너와 명시적으로 마운트된 볼륨으로 제한됩니다.

### 보안

Docker 런타임은 기본적으로 강력한 격리를 제공합니다: 네트워크 격리 (`network = "none"`), 리소스 제한 (메모리/CPU/PID), 읽기 전용 루트 파일시스템, 특권 모드 없음, 실행 후 자동 컨테이너 제거. `[runtime.docker.tool_images]`를 통한 도구별 이미지 오버라이드가 지원됩니다.

## WASM 런타임

WASM (WebAssembly) 런타임은 `.wasm` 모듈로 컴파일된 도구를 실행합니다. WASM은 WASI (WebAssembly System Interface)를 통한 세밀한 기능 제어로 이식 가능하고 샌드박스된 실행을 제공합니다.

### 설정

```toml
[runtime]
backend = "wasm"

[runtime.wasm]
# WASM 런타임 엔진: "wasmtime" | "wasmer"
engine = "wasmtime"

# .wasm 모듈이 포함된 디렉터리.
module_path = "~/.local/share/openprx/wasm/"

# WASM 모듈에 부여된 WASI 기능.
[runtime.wasm.capabilities]
filesystem_read = ["/workspace"]
filesystem_write = ["/tmp"]
network = false
env_vars = ["HOME", "USER"]

# 단일 WASM 호출의 최대 실행 시간.
timeout_secs = 30

# WASM 모듈의 최대 메모리 할당.
max_memory_mb = 128
```

### 특성

| 속성 | 값 |
|------|-----|
| 격리 | WASM 샌드박스 (기능 기반) |
| 시작 시간 | 10-50ms |
| 파일시스템 접근 | WASI 사전 개방 디렉터리만 |
| 네트워크 접근 | WASI를 통해 설정 가능 |
| 종속성 | `wasmtime` 또는 `wasmer` 런타임 (조건부 컴파일) |
| 플랫폼 | 전체 (WASM은 플랫폼 독립적) |

### 조건부 컴파일

WASM 런타임은 기능 플래그 뒤에서 조건부로 컴파일됩니다:

```bash
# WASM 지원으로 PRX 빌드
cargo build --release --features wasm-runtime
```

기능 플래그 없이는 WASM 백엔드를 사용할 수 없으며 `backend = "auto"`는 이를 건너뜁니다.

### 플러그인 시스템

WASM 런타임은 PRX의 플러그인 시스템을 구동합니다. `.wasm` 모듈로 배포되는 스킬은 네이티브 코드를 신뢰하지 않고도 동적으로 로드할 수 있습니다. `config.toml`의 `[tools.custom.<name>]`에서 `type = "wasm"`과 `module` 경로로 WASM 도구를 등록합니다.

## 팩토리 함수

PRX는 팩토리 함수 (`create_runtime`)를 사용하여 시작 시 백엔드를 선택합니다. 설정된 `backend` 문자열을 적절한 `RuntimeAdapter` 구현과 매칭하고 백엔드가 사용 가능한지 검증합니다 (예: Docker 데몬 실행 중, WASM 엔진 컴파일됨).

## 비교 매트릭스

| 기능 | Native | Docker | WASM |
|------|--------|--------|------|
| 설정 복잡도 | 없음 | Docker 데몬 | 기능 플래그 + 모듈 |
| 시작 지연 | < 10ms | 500ms - 2s | 10-50ms |
| 격리 강도 | 낮음 | 높음 | 높음 |
| 리소스 제어 | OS 제한 | cgroups | WASM 메모리 제한 |
| 네트워크 격리 | 샌드박스 경유 | 내장 | WASI 기능 |
| 파일시스템 격리 | 샌드박스 경유 | 내장 | WASI 사전 개방 |
| 이식성 | 플랫폼 네이티브 | OCI 이미지 | 플랫폼 독립적 |
| 도구 호환성 | 전체 | 전체 (이미지 포함) | WASM 컴파일 전용 |

## 보안 참고

- 런타임 백엔드는 방어 계층이지 [샌드박스](/ko/prx/security/sandbox)를 대체하는 것이 아닙니다. 두 시스템이 함께 작동합니다 -- 런타임은 실행 환경을 제공하고 샌드박스는 OS 수준 제한을 추가합니다.
- Docker 런타임은 Docker 소켓에 대한 접근이 필요하며, 이 자체가 특권 리소스입니다. 전용 서비스 계정으로 PRX를 실행하세요.
- WASM 모듈에는 주변 권한이 없습니다. 모든 기능 (파일시스템, 네트워크, 환경)을 명시적으로 부여해야 합니다.
- `env_whitelist` 설정은 모든 백엔드에 적용됩니다. API 키와 시크릿은 도구 실행 환경에 전달되지 않습니다.

## 관련 페이지

- [에이전트 런타임 아키텍처](/ko/prx/agent/runtime)
- [샌드박스](/ko/prx/security/sandbox)
- [Skillforge](/ko/prx/tools/skillforge)
- [Session Worker](/ko/prx/agent/session-worker)
- [도구 개요](/ko/prx/tools/)
