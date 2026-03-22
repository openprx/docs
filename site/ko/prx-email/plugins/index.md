---
title: WASM 플러그인
description: "PRX 런타임에서 샌드박스 실행을 위한 PRX-Email WASM 플러그인 시스템. WIT 호스트 콜, 네트워크 안전 스위치, 플러그인 개발 가이드."
---

# WASM 플러그인

PRX-Email에는 PRX 런타임 내부에서 샌드박스 실행을 위해 이메일 클라이언트를 WebAssembly로 컴파일하는 WASM 플러그인이 포함되어 있습니다. 플러그인은 WIT (WebAssembly Interface Types)를 사용하여 호스트 콜 인터페이스를 정의하여 WASM 호스팅 코드가 sync, list, get, search, send, reply와 같은 이메일 작업을 호출할 수 있습니다.

## 아키텍처

```
PRX Runtime (Host)
  |
  +-- WASM Plugin (prx-email-plugin)
        |
        +-- WIT Host-Calls
        |     email.sync    --> Host IMAP sync
        |     email.list    --> Host inbox list
        |     email.get     --> Host message get
        |     email.search  --> Host inbox search
        |     email.send    --> Host SMTP send
        |     email.reply   --> Host SMTP reply
        |
        +-- email.execute   --> Dispatcher
              (forwards to host-calls above)
```

### 실행 모델

WASM 플러그인이 `email.execute`를 호출하면 플러그인은 적절한 호스트 콜 함수로 호출을 디스패치합니다. 호스트 런타임이 실제 IMAP/SMTP 작업을 처리하고 결과는 WIT 인터페이스를 통해 반환됩니다.

## 네트워크 안전 스위치

WASM 컨텍스트에서의 실제 IMAP/SMTP 실행은 **기본적으로 비활성화**됩니다. 이는 샌드박스 플러그인이 의도치 않은 네트워크 연결을 하는 것을 방지합니다.

### 네트워크 작업 활성화

PRX 런타임을 시작하기 전에 환경 변수를 설정합니다:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### 비활성화 시 동작

| 작업 | 동작 |
|------|------|
| `email.sync` | `EMAIL_NETWORK_GUARD` 오류 반환 |
| `email.send` | `EMAIL_NETWORK_GUARD` 오류 반환 |
| `email.reply` | `EMAIL_NETWORK_GUARD` 오류 반환 |
| `email.list` | 작동 (로컬 SQLite에서 읽음) |
| `email.get` | 작동 (로컬 SQLite에서 읽음) |
| `email.search` | 작동 (로컬 SQLite에서 읽음) |

::: tip
읽기 전용 작업 (list, get, search)은 네트워크 접근 없이 로컬 SQLite 데이터베이스를 쿼리하기 때문에 항상 작동합니다. IMAP/SMTP 연결이 필요한 작업만 제한됩니다.
:::

### 호스트 기능 사용 불가

호스트 런타임이 이메일 기능을 전혀 제공하지 않는 경우 (비-WASM 실행 경로), 작업은 `EMAIL_HOST_CAPABILITY_UNAVAILABLE`을 반환합니다.

## 플러그인 구조

```
wasm-plugin/
  Cargo.toml          # 플러그인 크레이트 설정
  plugin.toml         # 플러그인 매니페스트
  plugin.wasm         # 사전 컴파일된 WASM 바이너리
  src/
    lib.rs            # 플러그인 진입점 및 디스패처
    bindings.rs       # WIT 생성 바인딩
  wit/                # WIT 인터페이스 정의
    deps/
      prx-host/       # 호스트 제공 인터페이스
```

### Cargo 설정

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wit-bindgen = { version = "0.51", features = ["macros"] }

[package.metadata.component]
package = "prx:plugin"

[package.metadata.component.target.dependencies]
"prx:host" = { path = "wit/deps/prx-host" }
```

## 플러그인 빌드

### 사전 요구사항

- Rust 툴체인
- `wasm32-wasip1` 타겟

### 빌드 단계

```bash
# WASM 타겟 추가
rustup target add wasm32-wasip1

# 플러그인 빌드
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 빌드 스크립트 사용

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## WIT 인터페이스

플러그인은 WIT 정의 인터페이스를 통해 호스트와 통신합니다. `prx:host` 패키지는 다음 호스트 콜 함수를 제공합니다:

### 사용 가능한 호스트 콜

| 함수 | 설명 | 네트워크 필요 |
|------|------|:------------:|
| `email.sync` | 계정/폴더의 IMAP 받은 편지함 동기화 | 예 |
| `email.list` | 로컬 데이터베이스에서 메시지 목록 조회 | 아니오 |
| `email.get` | ID로 특정 메시지 가져오기 | 아니오 |
| `email.search` | 쿼리로 메시지 검색 | 아니오 |
| `email.send` | SMTP를 통해 새 이메일 전송 | 예 |
| `email.reply` | 기존 이메일에 답장 | 예 |

### 요청/응답 형식

호스트 콜은 요청 및 응답 페이로드에 JSON 직렬화를 사용합니다:

```rust
// 예: 메시지 목록 조회
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## 개발 워크플로우

### 1. 플러그인 코드 수정

`wasm-plugin/src/lib.rs`를 편집하여 사용자 정의 로직을 추가합니다:

```rust
// 이메일 작업 전 전처리 추가
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // 사용자 정의 유효성 검사, 로깅 또는 변환
    Ok(())
}
```

### 2. 재빌드

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. 로컬 테스트

네트워크 안전 스위치를 비활성화하여 테스트합니다:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# 업데이트된 플러그인으로 PRX 런타임 실행
```

### 4. 배포

컴파일된 `.wasm` 파일을 PRX 런타임의 플러그인 디렉토리에 복사합니다.

## 보안 모델

| 제약 조건 | 적용 |
|---------|------|
| 네트워크 접근 | 기본적으로 비활성화; `PRX_EMAIL_ENABLE_REAL_NETWORK=1` 필요 |
| 파일 시스템 접근 | WASM에서 직접 파일 시스템 접근 없음 |
| 메모리 | WASM 선형 메모리 한도로 제한됨 |
| 실행 시간 | 연료 측정으로 제한됨 |
| 토큰 안전성 | OAuth 토큰은 호스트가 관리하며 WASM에 노출되지 않음 |

::: warning
WASM 플러그인은 OAuth 토큰이나 자격 증명에 직접 접근할 수 없습니다. 모든 인증은 호스트 런타임이 처리합니다. 플러그인은 작업 결과만 수신하며 원시 자격 증명은 받지 않습니다.
:::

## 다음 단계

- [설치](../getting-started/installation) -- WASM 플러그인 빌드 지침
- [설정 레퍼런스](../configuration/) -- 네트워크 안전 스위치 및 런타임 설정
- [문제 해결](../troubleshooting/) -- 플러그인 관련 문제
