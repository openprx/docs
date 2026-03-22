---
title: OAuth 인증
description: "PRX-Email에서 Gmail 및 Outlook을 위한 OAuth 2.0 XOAUTH2 인증 설정. 토큰 수명 주기 관리, 갱신 프로바이더, 핫 리로드."
---

# OAuth 인증

PRX-Email은 IMAP 및 SMTP 모두에서 XOAUTH2 메커니즘을 통해 OAuth 2.0 인증을 지원합니다. 이는 Outlook/Office 365에서 필수이며 Gmail에도 권장됩니다. 플러그인은 토큰 만료 추적, 플러그 가능한 갱신 프로바이더, 환경 기반 핫 리로드를 제공합니다.

## XOAUTH2 작동 방식

XOAUTH2는 기존의 비밀번호 인증을 OAuth 액세스 토큰으로 대체합니다. 클라이언트는 IMAP AUTHENTICATE 또는 SMTP AUTH 중에 특별히 형식화된 문자열을 전송합니다:

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

`auth.oauth_token`이 설정되면 PRX-Email이 이를 자동으로 처리합니다.

## Gmail OAuth 설정

### 1. Google Cloud 자격 증명 생성

1. [Google Cloud Console](https://console.cloud.google.com/)로 이동합니다
2. 프로젝트를 생성하거나 기존 프로젝트를 선택합니다
3. Gmail API를 활성화합니다
4. OAuth 2.0 자격 증명을 생성합니다 (데스크탑 애플리케이션 유형)
5. **클라이언트 ID**와 **클라이언트 시크릿**을 기록합니다

### 2. 액세스 토큰 획득

Google의 OAuth playground 또는 자체 OAuth 흐름을 사용하여 다음 범위의 액세스 토큰을 획득합니다:

- `https://mail.google.com/` (전체 IMAP/SMTP 액세스)

### 3. PRX-Email 설정

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Outlook OAuth 설정

PRX-Email에는 전체 인증 코드 흐름을 처리하는 Outlook/Office 365 OAuth 부트스트랩 스크립트가 포함되어 있습니다.

### 1. Azure 앱 등록

1. [Azure Portal 앱 등록](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)으로 이동합니다
2. 새 애플리케이션을 등록합니다
3. 리디렉션 URI를 설정합니다 (예: `http://localhost:53682/callback`)
4. **애플리케이션 (클라이언트) ID**와 **디렉토리 (테넌트) ID**를 기록합니다
5. API 권한 아래에서 다음을 추가합니다:
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. 부트스트랩 스크립트 실행

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

스크립트는 다음을 수행합니다:
1. 인증 URL을 출력합니다 -- 브라우저에서 엽니다
2. 콜백 URL 또는 인증 코드를 붙여넣을 때까지 기다립니다
3. 코드를 액세스 및 갱신 토큰으로 교환합니다
4. `chmod 600`으로 `./outlook_oauth.local.env`에 토큰을 저장합니다

### 스크립트 옵션

| 플래그 | 설명 |
|--------|------|
| `--output <file>` | 사용자 지정 출력 경로 (기본값: `./outlook_oauth.local.env`) |
| `--dry-run` | 인증 URL을 출력하고 종료 |
| `-h`, `--help` | 사용법 정보 표시 |

### 환경 변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `CLIENT_ID` | 예 | Azure 애플리케이션 클라이언트 ID |
| `TENANT` | 예 | 테넌트 ID 또는 `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | 예 | Azure 앱에 등록된 리디렉션 URI |
| `SCOPE` | 아니오 | 사용자 지정 범위 (기본값: IMAP + SMTP + offline_access) |

::: warning 보안
생성된 토큰 파일을 커밋하지 마세요. `.gitignore`에 `*.local.env`를 추가합니다.
:::

### 3. 토큰 로드

부트스트랩 스크립트가 토큰을 생성한 후 env 파일을 소스로 지정하고 PRX-Email을 설정합니다:

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## 토큰 수명 주기 관리

### 만료 추적

PRX-Email은 프로토콜(IMAP/SMTP)별로 OAuth 토큰 만료 타임스탬프를 추적합니다:

```rust
// 환경을 통해 만료 설정
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

각 작업 전에 플러그인은 토큰이 60초 이내에 만료되는지 확인합니다. 만료되는 경우 갱신이 시도됩니다.

### 플러그 가능한 갱신 프로바이더

자동 토큰 갱신을 처리하기 위해 `OAuthRefreshProvider` 트레이트를 구현합니다:

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // OAuth 프로바이더의 토큰 엔드포인트 호출
        // 새 액세스 토큰과 선택적 만료 반환
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

플러그인을 생성할 때 프로바이더를 첨부합니다:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### 환경에서 핫 리로드

재시작 없이 런타임에 OAuth 토큰을 재로드합니다:

```rust
// 환경에서 새 토큰 설정
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// 재로드 트리거
plugin.reload_auth_from_env("PRX_EMAIL");
```

`reload_auth_from_env` 메서드는 주어진 접두사가 있는 환경 변수를 읽고 IMAP/SMTP OAuth 토큰과 만료 타임스탬프를 업데이트합니다. OAuth 토큰이 로드되면 두 인증 중 하나의 불변성을 유지하기 위해 해당 비밀번호가 지워집니다.

### 전체 설정 재로드

완전한 전송 재설정을 위해:

```rust
plugin.reload_config(new_transport_config)?;
```

이는 새 설정을 유효성 검사하고 전체 전송 설정을 원자적으로 교체합니다.

## OAuth 환경 변수

| 변수 | 설명 |
|------|------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth 액세스 토큰 |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth 액세스 토큰 |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP 토큰 만료 (Unix 초) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP 토큰 만료 (Unix 초) |

접두사는 `reload_auth_from_env()`에 전달됩니다. 기본 PRX-Email 설정의 경우 접두사로 `PRX_EMAIL`을 사용합니다.

## 보안 모범 사례

1. **토큰을 절대 로그에 기록하지 마세요.** PRX-Email은 디버그 메시지를 정화하고 인증 관련 내용을 수정합니다.
2. **갱신 토큰을 사용하세요.** 액세스 토큰은 만료됩니다; 프로덕션 사용을 위해 항상 갱신 프로바이더를 구현하세요.
3. **토큰을 안전하게 저장하세요.** 파일 권한 (`chmod 600`)을 사용하고 버전 관리에 토큰 파일을 커밋하지 마세요.
4. **토큰을 정기적으로 순환하세요.** 자동 갱신에도 불구하고 토큰이 순환되고 있는지 주기적으로 확인하세요.

## 다음 단계

- [계정 관리](./index) -- 계정 및 기능 플래그 관리
- [설정 레퍼런스](../configuration/) -- 모든 환경 변수 및 설정
- [문제 해결](../troubleshooting/) -- OAuth 관련 오류 해결
