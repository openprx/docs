---
title: 설치
description: "소스에서 PRX-Email 설치, Cargo 의존성으로 추가, 또는 PRX 런타임 통합을 위한 WASM 플러그인 빌드."
---

# 설치

PRX-Email은 Rust 라이브러리 의존성으로 사용하거나, 독립 실행형 사용을 위해 소스에서 빌드하거나, PRX 런타임을 위한 WASM 플러그인으로 컴파일할 수 있습니다.

::: tip 권장사항
대부분의 사용자에게는 PRX-Email을 **Cargo 의존성**으로 추가하는 것이 Rust 프로젝트에 이메일 기능을 통합하는 가장 빠른 방법입니다.
:::

## 사전 요구사항

| 요구사항 | 최소 버전 | 비고 |
|---------|---------|------|
| Rust | 1.85.0 (2024 에디션) | 모든 설치 방법에 필요 |
| Git | 2.30+ | 저장소 클론용 |
| SQLite | bundled | `rusqlite` 번들 기능을 통해 포함됨; 시스템 SQLite 불필요 |
| `wasm32-wasip1` 타겟 | latest | WASM 플러그인 컴파일에만 필요 |

## 방법 1: Cargo 의존성 (권장)

프로젝트의 `Cargo.toml`에 PRX-Email을 추가합니다:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

이렇게 하면 라이브러리와 `rusqlite` (번들 SQLite), `imap`, `lettre`, `mail-parser`를 포함한 모든 의존성을 가져옵니다.

::: warning 빌드 의존성
`rusqlite` 번들 기능은 C 소스에서 SQLite를 컴파일합니다. Debian/Ubuntu에서는 다음이 필요할 수 있습니다:
```bash
sudo apt install -y build-essential pkg-config
```
macOS에서는 Xcode Command Line Tools가 필요합니다:
```bash
xcode-select --install
```
:::

## 방법 2: 소스에서 빌드

저장소를 클론하고 릴리스 모드로 빌드합니다:

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

모든 것이 작동하는지 확인하기 위해 테스트 스위트를 실행합니다:

```bash
cargo test
```

린트 유효성 검사를 위해 clippy를 실행합니다:

```bash
cargo clippy -- -D warnings
```

## 방법 3: WASM 플러그인

WASM 플러그인을 사용하면 PRX-Email이 PRX 런타임 내에서 샌드박스 WebAssembly 모듈로 실행됩니다. 플러그인은 WIT (WebAssembly Interface Types)를 사용하여 호스트 콜 인터페이스를 정의합니다.

### WASM 플러그인 빌드

```bash
cd prx_email

# WASM 타겟 추가
rustup target add wasm32-wasip1

# 플러그인 빌드
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

컴파일된 플러그인은 `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`에 있습니다.

또는 빌드 스크립트를 사용합니다:

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### 플러그인 설정

WASM 플러그인에는 플러그인 메타데이터와 기능을 정의하는 `plugin.toml` 매니페스트가 `wasm-plugin/` 디렉토리에 포함되어 있습니다.

### 네트워크 안전 스위치

기본적으로 WASM 플러그인은 **실제 네트워크 작업이 비활성화**된 상태로 실행됩니다. WASM 컨텍스트에서 실제 IMAP/SMTP 연결을 활성화하려면:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

비활성화된 경우 네트워크 의존 작업 (`email.sync`, `email.send`, `email.reply`)은 가드 힌트가 있는 제어된 오류를 반환합니다. 이는 샌드박스 플러그인에서 의도치 않은 네트워크 접근을 방지하기 위한 안전 조치입니다.

## 의존성

PRX-Email은 다음 주요 의존성을 사용합니다:

| 크레이트 | 버전 | 목적 |
|---------|------|------|
| `rusqlite` | 0.31 | 번들 C 컴파일이 있는 SQLite 데이터베이스 |
| `imap` | 2.4 | 받은 편지함 동기화를 위한 IMAP 클라이언트 |
| `lettre` | 0.11 | 이메일 전송을 위한 SMTP 클라이언트 |
| `mail-parser` | 0.10 | MIME 메시지 파싱 |
| `rustls` | 0.23 | IMAP 연결을 위한 TLS |
| `rustls-connector` | 0.20 | TLS 스트림 래퍼 |
| `serde` / `serde_json` | 1.0 | 모델 및 API 응답 직렬화 |
| `sha2` | 0.10 | 폴백 메시지 ID를 위한 SHA-256 |
| `base64` | 0.22 | 첨부 파일을 위한 Base64 인코딩 |
| `thiserror` | 1.0 | 오류 타입 파생 |

모든 TLS 연결은 `rustls` (순수 Rust)를 사용합니다 -- OpenSSL 의존성 없음.

## 설치 확인

빌드 후 라이브러리가 컴파일되고 테스트가 통과하는지 확인합니다:

```bash
cargo check
cargo test
```

예상 출력:

```
running 7 tests
test plugin::email_plugin::tests::parse_mime_extracts_text_html_and_attachments ... ok
test plugin::email_plugin::tests::references_chain_appends_parent_message_id ... ok
test plugin::email_plugin::tests::reply_sets_in_reply_to_header_on_outbox ... ok
test plugin::email_plugin::tests::parse_mime_fallback_message_id_is_stable_and_unique ... ok
test plugin::email_plugin::tests::list_search_reject_out_of_range_limit ... ok
test plugin::email_plugin::tests::run_sync_runner_respects_max_concurrency_cap ... ok
test plugin::email_plugin::tests::reload_auth_from_env_updates_tokens ... ok

test result: ok. 7 passed; 0 failed; 0 ignored
```

## 다음 단계

- [빠른 시작](./quickstart) -- 첫 번째 이메일 계정 설정 및 메시지 전송
- [계정 관리](../accounts/) -- IMAP, SMTP, OAuth 설정
- [WASM 플러그인](../plugins/) -- WASM 플러그인 인터페이스에 대해 알아보기
