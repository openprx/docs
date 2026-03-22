---
title: 설치
description: "Cargo를 사용하여 소스에서 PRX-Memory 설치 또는 stdio 및 HTTP 전송을 위한 데몬 바이너리 빌드."
---

# 설치

PRX-Memory는 Rust 워크스페이스로 배포됩니다. 주요 아티팩트는 `prx-memory-mcp` 크레이트의 `prx-memoryd` 데몬 바이너리입니다.

::: tip 권장
소스에서 빌드하면 최신 기능을 사용할 수 있으며 LanceDB와 같은 선택적 백엔드를 활성화할 수 있습니다.
:::

## 사전 요구사항

| 요구사항 | 최소 | 참고 |
|---------|------|------|
| Rust | stable 툴체인 | [rustup](https://rustup.rs/)으로 설치 |
| 운영 체제 | Linux, macOS, Windows (WSL2) | Rust가 지원하는 모든 플랫폼 |
| Git | 2.30+ | 저장소 복제용 |
| 디스크 공간 | 100 MB | 바이너리 + 의존성 |
| RAM | 256 MB | 대용량 메모리 데이터베이스에는 더 많이 권장 |

## 방법 1: 소스에서 빌드 (권장)

저장소를 복제하고 릴리스 모드로 빌드합니다:

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

바이너리는 `target/release/prx-memoryd`에 위치합니다. PATH에 복사합니다:

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### 빌드 옵션

| 기능 플래그 | 기본값 | 설명 |
|-----------|--------|------|
| `lancedb-backend` | 비활성화 | LanceDB 벡터 스토리지 백엔드 |

LanceDB 지원으로 빌드:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning 빌드 의존성
Debian/Ubuntu에서는 다음이 필요할 수 있습니다:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
macOS에서는 Xcode Command Line Tools가 필요합니다:
```bash
xcode-select --install
```
:::

## 방법 2: Cargo Install

Rust가 설치되어 있으면 직접 설치할 수 있습니다:

```bash
cargo install prx-memory-mcp
```

소스에서 컴파일하고 `prx-memoryd` 바이너리를 `~/.cargo/bin/`에 배치합니다.

## 방법 3: 라이브러리로 사용

PRX-Memory 크레이트를 자체 Rust 프로젝트의 의존성으로 사용하려면 `Cargo.toml`에 추가합니다:

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## 설치 확인

빌드 후 바이너리가 실행되는지 확인합니다:

```bash
prx-memoryd --help
```

기본 stdio 세션 테스트:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

HTTP 세션 테스트:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

헬스 엔드포인트 확인:

```bash
curl -sS http://127.0.0.1:8787/health
```

## 개발 설정

개발 및 테스트를 위해 표준 Rust 워크플로우를 사용합니다:

```bash
# Format
cargo fmt --all

# Lint
cargo clippy --all-targets --all-features -- -D warnings

# Test
cargo test --all-targets --all-features

# Check (fast feedback)
cargo check --all-targets --all-features
```

## 제거

```bash
# Remove the binary
sudo rm /usr/local/bin/prx-memoryd
# Or if installed via Cargo
cargo uninstall prx-memory-mcp

# Remove data files
rm -rf ./data/memory-db.json
```

## 다음 단계

- [빠른 시작](./quickstart) -- 5분 만에 PRX-Memory 실행
- [설정](../configuration/) -- 모든 환경 변수 및 프로파일
- [MCP 통합](../mcp/) -- MCP 클라이언트 연결
