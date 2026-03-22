---
title: 설치
description: 설치 스크립트, Cargo, 소스 빌드 또는 Docker를 사용하여 Linux, macOS 또는 Windows WSL2에 PRX-SD를 설치합니다.
---

# 설치

PRX-SD는 네 가지 설치 방법을 지원합니다. 워크플로우에 가장 적합한 방법을 선택하세요.

::: tip 권장 방법
**설치 스크립트**가 가장 빠른 시작 방법입니다. 플랫폼을 자동으로 감지하고 올바른 바이너리를 다운로드하여 PATH에 설치합니다.
:::

## 필수 요건

| 요건 | 최소 | 비고 |
|-------------|---------|-------|
| 운영 체제 | Linux (x86_64, aarch64), macOS (12+), Windows (WSL2) | 네이티브 Windows는 지원되지 않음 |
| 디스크 공간 | 200 MB | ~50 MB 바이너리 + ~150 MB 시그니처 데이터베이스 |
| RAM | 512 MB | 대용량 디렉토리 스캔에는 2 GB 이상 권장 |
| Rust (소스 빌드 전용) | 1.85.0 | 스크립트 또는 Docker 설치에는 필요 없음 |
| Git (소스 빌드 전용) | 2.30+ | 저장소 클론용 |
| Docker (Docker 전용) | 20.10+ | 또는 Podman 3.0+ |

## 방법 1: 설치 스크립트 (권장)

설치 스크립트는 플랫폼에 맞는 최신 릴리스 바이너리를 다운로드하여 `/usr/local/bin`에 설치합니다.

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash
```

특정 버전을 설치하려면:

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash -s -- --version 0.5.0
```

스크립트는 다음 환경 변수를 지원합니다:

| 변수 | 기본값 | 설명 |
|----------|---------|-------------|
| `INSTALL_DIR` | `/usr/local/bin` | 사용자 정의 설치 디렉토리 |
| `VERSION` | `latest` | 특정 릴리스 버전 |
| `ARCH` | 자동 감지 | 아키텍처 재정의 (`x86_64`, `aarch64`) |

## 방법 2: Cargo 설치

Rust가 설치된 경우 crates.io에서 직접 설치할 수 있습니다:

```bash
cargo install prx-sd
```

이 방법은 소스에서 컴파일하여 `~/.cargo/bin/`에 `sd` 바이너리를 설치합니다.

::: warning 빌드 의존성
Cargo 설치는 네이티브 의존성을 컴파일합니다. Debian/Ubuntu에서는 다음이 필요할 수 있습니다:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
macOS에서는 Xcode 커맨드 라인 도구가 필요합니다:
```bash
xcode-select --install
```
:::

## 방법 3: 소스에서 빌드

저장소를 클론하고 릴리스 모드로 빌드합니다:

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

바이너리는 `target/release/sd`에 위치합니다. PATH에 복사합니다:

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### 빌드 옵션

| 기능 플래그 | 기본값 | 설명 |
|-------------|---------|-------------|
| `yara` | 활성화됨 | YARA-X 규칙 엔진 |
| `ml` | 비활성화됨 | ONNX ML 추론 엔진 |
| `gui` | 비활성화됨 | Tauri + Vue 3 데스크톱 GUI |
| `virustotal` | 비활성화됨 | VirusTotal API 통합 |

ML 추론 지원으로 빌드하려면:

```bash
cargo build --release --features ml
```

데스크톱 GUI를 빌드하려면:

```bash
cargo build --release --features gui
```

## 방법 4: Docker

공식 Docker 이미지를 가져옵니다:

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

대상 디렉토리를 마운트하여 스캔을 실행합니다:

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

실시간 모니터링을 위해 데몬으로 실행합니다:

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
자동 시그니처 업데이트가 포함된 프로덕션 배포를 위해 저장소 루트에 `docker-compose.yml`이 있습니다.
:::

## 플랫폼별 참고 사항

### Linux

PRX-SD는 모든 최신 Linux 배포판에서 작동합니다. 실시간 모니터링에는 `inotify` 서브시스템이 사용됩니다. 대규모 디렉토리 트리의 경우 감시 한도를 높여야 할 수 있습니다:

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

루트킷 탐지 및 메모리 스캐닝에는 루트 권한이 필요합니다.

### macOS

PRX-SD는 macOS에서 실시간 모니터링에 FSEvents를 사용합니다. Apple Silicon(aarch64)과 Intel(x86_64) 모두 지원됩니다. 설치 스크립트가 아키텍처를 자동으로 감지합니다.

::: warning macOS Gatekeeper
macOS가 바이너리를 차단하는 경우 격리 속성을 제거합니다:
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows (WSL2)

PRX-SD는 Linux 바이너리를 사용하여 WSL2 내에서 실행됩니다. 먼저 Linux 배포판과 함께 WSL2를 설치한 다음 Linux 설치 단계를 따릅니다. 네이티브 Windows 지원은 향후 릴리스에서 계획되어 있습니다.

## 설치 확인

설치 후 `sd`가 작동하는지 확인합니다:

```bash
sd --version
```

예상 출력:

```
prx-sd 0.5.0
```

시그니처 데이터베이스를 포함한 전체 시스템 상태를 확인합니다:

```bash
sd info
```

설치된 버전, 시그니처 수, YARA 규칙 수, 데이터베이스 경로가 표시됩니다.

## 제거

### 스크립트 / Cargo 설치

```bash
# 바이너리 제거
sudo rm /usr/local/bin/sd
# 또는 Cargo로 설치한 경우
cargo uninstall prx-sd

# 시그니처 데이터베이스 및 설정 제거
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## 다음 단계

- [빠른 시작](./quickstart) -- 5분 안에 스캔 시작
- [파일 및 디렉토리 스캔](../scanning/file-scan) -- `sd scan` 명령어 전체 레퍼런스
- [탐지 엔진 개요](../detection/) -- 다층 파이프라인 이해
