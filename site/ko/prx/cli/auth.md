---
title: prx auth
description: LLM 프로바이더 및 서비스를 위한 OAuth 인증 프로필을 관리합니다.
---

# prx auth

OAuth 인증 프로필을 관리합니다. PRX는 OAuth2를 지원하는 프로바이더 및 서비스(GitHub Copilot, Google Gemini 등)에 OAuth2 플로우를 사용합니다. 인증 프로필은 PRX 시크릿 스토어에 토큰을 안전하게 저장합니다.

## 사용법

```bash
prx auth <SUBCOMMAND> [OPTIONS]
```

## 하위 명령어

### `prx auth login`

프로바이더 또는 서비스에 인증합니다.

```bash
prx auth login [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--provider` | `-P` | | 인증할 프로바이더 (예: `github-copilot`, `google-gemini`) |
| `--profile` | | `default` | 여러 계정을 위한 이름 지정 프로필 |
| `--browser` | | `true` | OAuth 플로우를 위해 브라우저 열기 |
| `--device-code` | | `false` | 디바이스 코드 플로우 사용 (헤드리스 환경용) |

```bash
# GitHub Copilot에 로그인
prx auth login --provider github-copilot

# 디바이스 코드 플로우 (브라우저 없음)
prx auth login --provider github-copilot --device-code

# 이름 지정 프로필로 로그인
prx auth login --provider google-gemini --profile work
```

로그인 플로우:

1. PRX가 프로바이더의 OAuth 동의 페이지를 위해 브라우저를 열거나(또는 디바이스 코드를 표시)
2. 브라우저에서 PRX를 승인합니다
3. PRX가 액세스 토큰과 리프레시 토큰을 수신하고 안전하게 저장합니다
4. 이후 API 호출에 토큰이 자동으로 사용됩니다

### `prx auth refresh`

만료된 액세스 토큰을 수동으로 갱신합니다.

```bash
prx auth refresh [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--provider` | `-P` | 전체 | 갱신할 프로바이더 (생략 시 모두 갱신) |
| `--profile` | | `default` | 갱신할 이름 지정 프로필 |

```bash
# 모든 프로바이더 토큰 갱신
prx auth refresh

# 특정 프로바이더 갱신
prx auth refresh --provider github-copilot
```

::: tip
토큰 갱신은 정상 작동 중 자동으로 수행됩니다. 인증 문제를 해결할 때만 이 명령을 사용하세요.
:::

### `prx auth logout`

프로바이더에 대해 저장된 자격 증명을 제거합니다.

```bash
prx auth logout [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--provider` | `-P` | | 로그아웃할 프로바이더 (필수) |
| `--profile` | | `default` | 로그아웃할 이름 지정 프로필 |
| `--all` | | `false` | 모든 프로바이더 및 프로필에서 로그아웃 |

```bash
# GitHub Copilot에서 로그아웃
prx auth logout --provider github-copilot

# 모든 곳에서 로그아웃
prx auth logout --all
```

## 인증 프로필

프로필을 사용하면 동일한 프로바이더에 대해 여러 계정을 사용할 수 있습니다. 업무용과 개인용 계정이 분리되어 있을 때 유용합니다.

```bash
# 두 개의 Google 계정으로 로그인
prx auth login --provider google-gemini --profile personal
prx auth login --provider google-gemini --profile work

# 채팅에서 특정 프로필 사용
prx chat --provider google-gemini  # "default" 프로필 사용
```

설정 파일에서 프로바이더별 활성 프로필을 설정합니다:

```toml
[providers.google-gemini]
auth_profile = "work"
```

## 토큰 저장소

토큰은 ChaCha20-Poly1305 암호화를 사용하여 암호화되며 `~/.local/share/prx/secrets/`의 PRX 시크릿 스토어에 저장됩니다. 암호화 키는 머신 ID에서 파생됩니다.

## 관련 문서

- [인증 개요](/ko/prx/auth/) -- 인증 아키텍처
- [OAuth2 플로우](/ko/prx/auth/oauth2) -- OAuth2 플로우 상세 문서
- [인증 프로필](/ko/prx/auth/profiles) -- 프로필 관리
- [시크릿 스토어](/ko/prx/security/secrets) -- 토큰이 안전하게 저장되는 방식
