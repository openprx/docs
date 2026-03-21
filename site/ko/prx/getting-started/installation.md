---
title: 설치
description: 설치 스크립트, Cargo, 소스 빌드 또는 Docker를 사용하여 Linux, macOS 또는 Windows WSL2에 PRX를 설치합니다.
---

# 설치

PRX는 `prx`라는 단일 정적 바이너리로 제공됩니다. 작업 흐름에 맞는 설치 방법을 선택하세요.

## 사전 요구 사항

PRX를 설치하기 전에 시스템이 다음 요구 사항을 충족하는지 확인하세요:

| 요구 사항 | 세부 사항 |
|-----------|-----------|
| **OS** | Linux (x86_64, aarch64), macOS (Apple Silicon, Intel) 또는 WSL2를 통한 Windows |
| **Rust** | 1.92.0+ (2024 에디션) -- Cargo 설치 또는 소스 빌드 시에만 필요 |
| **시스템 패키지** | `pkg-config` (Linux, 소스 빌드 시에만 필요) |
| **디스크 공간** | 바이너리용 약 50 MB, WASM 플러그인 런타임 포함 시 약 200 MB |
| **RAM** | 데몬 최소 64 MB (LLM 추론 제외) |

::: tip
설치 스크립트나 Docker를 사용하는 경우 시스템에 Rust를 설치할 필요가 없습니다.
:::

## 방법 1: 설치 스크립트 (권장)

가장 빠른 시작 방법입니다. 스크립트가 OS와 아키텍처를 감지하고, 최신 릴리스 바이너리를 다운로드하여 `PATH`에 배치합니다.

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

스크립트는 기본적으로 `prx`를 `~/.local/bin/`에 설치합니다. 이 디렉터리가 `PATH`에 포함되어 있는지 확인하세요:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

특정 버전을 설치하려면:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --version 0.3.0
```

사용자 지정 디렉터리에 설치하려면:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --prefix /usr/local
```

## 방법 2: Cargo 설치

Rust 툴체인이 설치되어 있다면 crates.io에서 직접 PRX를 설치할 수 있습니다:

```bash
cargo install openprx
```

이 명령은 기본 기능으로 릴리스 바이너리를 빌드하여 `~/.cargo/bin/prx`에 배치합니다.

모든 선택적 기능(Matrix E2EE, WhatsApp Web 등)을 포함하여 설치하려면:

```bash
cargo install openprx --all-features
```

::: info 기능 플래그
PRX는 선택적 채널 지원을 위해 Cargo 기능 플래그를 사용합니다:

| 기능 | 설명 |
|------|------|
| `channel-matrix` | E2E 암호화를 지원하는 Matrix 채널 |
| `whatsapp-web` | WhatsApp Web 멀티 디바이스 채널 |
| **default** | 모든 안정적인 채널 활성화 |
:::

## 방법 3: 소스에서 빌드

개발용이나 최신 미출시 코드를 실행하려면:

```bash
# 저장소 클론
git clone https://github.com/openprx/prx.git
cd prx

# 릴리스 바이너리 빌드
cargo build --release

# 바이너리 경로: target/release/prx
./target/release/prx --version
```

모든 기능을 포함하여 빌드하려면:

```bash
cargo build --release --all-features
```

로컬에서 빌드한 바이너리를 Cargo bin 디렉터리에 설치하려면:

```bash
cargo install --path .
```

### 개발 빌드

개발 중 빠른 반복을 위해 디버그 빌드를 사용하세요:

```bash
cargo build
./target/debug/prx --version
```

::: warning
디버그 빌드는 런타임에서 상당히 느립니다. 프로덕션이나 벤치마크에는 항상 `--release`를 사용하세요.
:::

## 방법 4: Docker

로컬 설치 없이 컨테이너로 PRX를 실행합니다:

```bash
docker pull ghcr.io/openprx/prx:latest
```

설정 디렉터리를 마운트하여 실행:

```bash
docker run -d \
  --name prx \
  -v ~/.config/openprx:/home/prx/.config/openprx \
  -p 3120:3120 \
  ghcr.io/openprx/prx:latest \
  daemon
```

또는 Docker Compose를 사용:

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    ports:
      - "3120:3120"
    volumes:
      - ./config:/home/prx/.config/openprx
      - ./data:/home/prx/.local/share/openprx
    command: daemon
```

::: tip
Docker에서 실행할 때 LLM API 키는 환경 변수를 통해 설정하거나 설정 파일을 마운트하세요. 자세한 내용은 [설정](../config/)을 참조하세요.
:::

## 설치 확인

설치 후 PRX가 정상적으로 작동하는지 확인합니다:

```bash
prx --version
```

예상 출력:

```
prx 0.3.0
```

상태 점검을 실행합니다:

```bash
prx doctor
```

이 명령은 Rust 툴체인(설치된 경우), 시스템 의존성, 설정 파일 유효성, LLM 프로바이더에 대한 네트워크 연결을 확인합니다.

## 플랫폼 참고 사항

### Linux

PRX는 모든 최신 Linux 배포판(커널 4.18 이상)에서 작동합니다. 바이너리는 TLS를 위해 `rustls`와 정적 링크되어 있으므로 OpenSSL 설치가 필요하지 않습니다.

샌드박스 기능을 사용하려면 추가 패키지가 필요할 수 있습니다:

```bash
# Firejail 샌드박스 백엔드
sudo apt install firejail

# Bubblewrap 샌드박스 백엔드
sudo apt install bubblewrap

# Docker 샌드박스 백엔드 (Docker 데몬 필요)
sudo apt install docker.io
```

### macOS

PRX는 Apple Silicon (aarch64)과 Intel (x86_64) Mac 모두에서 네이티브로 실행됩니다. iMessage 채널은 macOS에서만 사용할 수 있습니다.

소스에서 빌드하는 경우 Xcode Command Line Tools가 설치되어 있는지 확인하세요:

```bash
xcode-select --install
```

### Windows (WSL2)

PRX는 WSL2를 통해 Windows에서 지원됩니다. Linux 배포판(Ubuntu 권장)을 설치하고 WSL2 환경 내에서 Linux 지침을 따르세요.

```powershell
# PowerShell에서 (WSL2와 Ubuntu 설치)
wsl --install -d Ubuntu
```

그런 다음 WSL2 내에서:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

::: warning
현재 네이티브 Windows 지원은 제공되지 않습니다. WSL2는 네이티브에 가까운 Linux 성능을 제공하며 권장되는 방법입니다.
:::

## 제거

PRX를 제거하려면:

```bash
# 설치 스크립트로 설치한 경우
rm ~/.local/bin/prx

# Cargo로 설치한 경우
cargo uninstall openprx

# 설정 및 데이터 제거 (선택 사항)
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## 다음 단계

- [빠른 시작](./quickstart) -- 5분 만에 PRX 실행하기
- [온보딩 마법사](./onboarding) -- LLM 프로바이더 구성
- [설정](../config/) -- 전체 설정 레퍼런스
