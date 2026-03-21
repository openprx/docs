---
title: 플러그인 개발자 가이드
description: 플러그인 개발 키트를 사용하여 PRX 플러그인을 개발하는 단계별 가이드입니다.
---

# 플러그인 개발자 가이드

이 가이드는 PRX 플러그인을 처음부터 만드는 과정을 안내합니다. 이 가이드를 마치면 PRX에 로드할 수 있는 동작하는 도구 플러그인을 갖게 됩니다.

## 사전 요구 사항

- `wasm32-wasi` 타겟이 포함된 Rust 툴체인
- PRX CLI 설치
- WASM 개념에 대한 기본 이해

## 프로젝트 설정

```bash
# WASM 타겟 설치
rustup target add wasm32-wasi

# 새 플러그인 프로젝트 생성
cargo new --lib my-plugin
cd my-plugin
```

`Cargo.toml`에 PRX PDK를 추가합니다:

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## 도구 플러그인 작성

최소한의 도구 플러그인은 `Tool` 트레이트를 구현합니다:

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## 빌드

```bash
cargo build --target wasm32-wasi --release
```

컴파일된 플러그인은 `target/wasm32-wasi/release/my_plugin.wasm`에 있습니다.

## 로컬 테스트

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## 배포

플러그인은 `.wasm` 파일로 공유하거나 플러그인 레지스트리에 배포할 수 있습니다 (곧 제공 예정).

## 관련 페이지

- [플러그인 시스템 개요](./)
- [PDK 레퍼런스](./pdk)
- [호스트 함수](./host-functions)
- [예제](./examples)
