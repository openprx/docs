---
title: 문제 해결
description: "OAuth 오류, IMAP 동기화 실패, SMTP 전송 문제, SQLite 오류, WASM 플러그인 문제를 포함한 일반적인 PRX-Email 문제 해결."
---

# 문제 해결

이 페이지는 PRX-Email을 실행할 때 발생하는 가장 일반적인 문제와 원인 및 해결 방법을 다룹니다.

## OAuth 토큰 만료

**증상:** 만료된 토큰에 대한 메시지와 함께 `Provider` 오류 코드로 작업이 실패합니다.

**가능한 원인:**
- OAuth 액세스 토큰이 만료되었고 갱신 프로바이더가 설정되어 있지 않음
- `*_OAUTH_EXPIRES_AT` 환경 변수에 오래된 타임스탬프가 포함됨
- 갱신 프로바이더가 오류를 반환하는 중

**해결책:**

1. **토큰 만료 타임스탬프 확인:**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# 이것들은 미래의 Unix 타임스탬프여야 합니다
```

2. **환경에서 수동으로 토큰 재로드:**

```rust
// 새 토큰 설정
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// 재로드
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. 자동 토큰 갱신을 위해 **갱신 프로바이더를 구현**합니다:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. 새 토큰을 얻기 위해 **Outlook 부트스트랩 스크립트를 다시 실행**합니다:

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Email은 만료 60초 전에 토큰 갱신을 시도합니다. 토큰이 동기화 간격보다 빠르게 만료되는 경우 갱신 프로바이더가 연결되어 있는지 확인하세요.
:::

## IMAP 동기화 실패

**증상:** `sync()`가 `Network` 오류를 반환하거나 동기화 러너가 실패를 보고합니다.

**가능한 원인:**
- 잘못된 IMAP 서버 호스트명 또는 포트
- 네트워크 연결 문제
- 인증 실패 (잘못된 비밀번호 또는 만료된 OAuth 토큰)
- IMAP 서버 속도 제한

**해결책:**

1. **IMAP 서버에 대한 연결 확인:**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **전송 설정 확인:**

```rust
// 호스트와 포트가 올바른지 확인
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **인증 모드 확인:**

```rust
// 정확히 하나만 설정되어야 함
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **동기화 러너 백오프 상태 확인.** 반복적인 실패 후 스케줄러는 지수적 백오프를 적용합니다. 먼 미래의 `now_ts`를 사용하여 일시적으로 재설정합니다:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. 자세한 오류 정보를 위해 **구조화된 로그를 확인**합니다:

```bash
# 동기화 관련 구조화된 로그 찾기
grep "prx_email.*sync" /path/to/logs
```

## SMTP 전송 실패

**증상:** `send()`가 `ok: false`와 `Network` 또는 `Provider` 오류가 있는 `ApiResponse`를 반환합니다.

**가능한 원인:**
- 잘못된 SMTP 서버 호스트명 또는 포트
- 인증 실패
- 프로바이더가 수신자 주소를 거부함
- 속도 제한 또는 전송 할당량 초과

**해결책:**

1. **아웃박스 상태 확인:**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **SMTP 설정 확인:**

```rust
// 인증 모드 확인
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **유효성 검사 오류 확인.** 전송 API는 다음을 거부합니다:
   - 빈 `to`, `subject`, 또는 `body_text`
   - 비활성화된 `email_send` 기능 플래그
   - 잘못된 이메일 주소

4. 오류 처리를 확인하기 위해 **시뮬레이션된 실패로 테스트**합니다:

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... 필드 ...
    failure_mode: Some(SendFailureMode::Network), // 실패 시뮬레이션
});
```

## 아웃박스가 "sending" 상태에서 멈춤

**증상:** 아웃박스 레코드의 `status = 'sending'`이지만 프로세스가 파이널라이즈 전에 충돌했습니다.

**원인:** 프로세스가 아웃박스 레코드를 클레임한 후 `sent` 또는 `failed`로 파이널라이즈하기 전에 충돌했습니다.

**해결책:** SQL을 통해 멈춘 레코드를 수동으로 복구합니다:

```sql
-- 멈춘 행 식별 (임계값: 15분)
SELECT id, account_id, updated_at
FROM outbox
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;

-- failed로 복구하고 재시도 예약
UPDATE outbox
SET status = 'failed',
    last_error = 'recovered_from_stuck_sending',
    next_attempt_at = strftime('%s','now') + 30,
    updated_at = strftime('%s','now')
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;
```

## 첨부 파일 거부

**증상:** 전송이 "attachment exceeds size limit" 또는 "attachment content type is not allowed"로 실패합니다.

**해결책:**

1. **첨부 파일 정책 확인:**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **파일 크기가 제한 내에 있는지 확인**합니다 (기본값: 25 MiB).

3. 안전한 경우 허용 목록에 **MIME 타입을 추가**합니다:

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **경로 기반 첨부 파일의 경우** 파일 경로가 설정된 첨부 파일 스토리지 루트 아래에 있는지 확인합니다. `../`를 포함하거나 루트 외부로 해석되는 심볼릭 링크는 거부됩니다.

## 기능 비활성화 오류

**증상:** 작업이 `FeatureDisabled` 오류 코드를 반환합니다.

**원인:** 요청된 작업에 대한 기능 플래그가 계정에 대해 활성화되어 있지 않습니다.

**해결책:**

```rust
// 현재 상태 확인
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// 기능 활성화
plugin.set_account_feature(account_id, "email_send", true, now)?;

// 또는 전역 기본값 설정
plugin.set_feature_default("email_send", true, now)?;
```

## SQLite 데이터베이스 오류

**증상:** 작업이 `Storage` 오류 코드로 실패합니다.

**가능한 원인:**
- 데이터베이스 파일이 다른 프로세스에 의해 잠겨 있음
- 디스크가 가득 참
- 데이터베이스 파일이 손상됨
- 마이그레이션이 실행되지 않음

**해결책:**

1. **마이그레이션 실행:**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **잠긴 데이터베이스 확인.** 한 번에 하나의 쓰기 연결만 활성화할 수 있습니다. 바쁨 타임아웃을 늘립니다:

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30초
    ..StoreConfig::default()
};
```

3. **디스크 공간 확인:**

```bash
df -h .
```

4. 데이터베이스가 손상된 경우 **복구 또는 재생성**합니다:

```bash
# 기존 데이터베이스 백업
cp email.db email.db.bak

# 무결성 확인
sqlite3 email.db "PRAGMA integrity_check;"

# 손상된 경우 내보내기 및 다시 가져오기
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## WASM 플러그인 문제

### 네트워크 가드 오류

**증상:** WASM 호스팅 이메일 작업이 `EMAIL_NETWORK_GUARD` 오류를 반환합니다.

**원인:** 네트워크 안전 스위치가 활성화되어 있지 않습니다.

**해결책:**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### 호스트 기능 사용 불가

**증상:** 작업이 `EMAIL_HOST_CAPABILITY_UNAVAILABLE`을 반환합니다.

**원인:** 호스트 런타임이 이메일 기능을 제공하지 않습니다. 이는 WASM 컨텍스트 외부에서 실행할 때 발생합니다.

**해결책:** PRX 런타임이 플러그인에 이메일 호스트 콜을 제공하도록 설정되어 있는지 확인합니다.

## 동기화 러너가 계속 작업을 건너뜀

**증상:** 작업이 설정되어 있어도 동기화 러너가 `attempted: 0`을 보고합니다.

**원인:** 이전 실패로 인해 모든 작업이 백오프 상태에 있습니다.

**해결책:**

1. 구조화된 로그를 검토하여 **실패 백오프 상태를 확인**합니다.

2. 다시 실행하기 전에 **네트워크 연결성과 IMAP 인증을 확인**합니다.

3. 먼 미래의 타임스탬프를 사용하여 **백오프를 재설정**합니다:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## 높은 전송 실패율

**증상:** 메트릭에 높은 `send_failures` 수가 표시됩니다.

**해결책:**

1. `run_id`와 `error_code`로 필터링하여 **구조화된 로그 검사**:

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **SMTP 인증 모드 확인.** 비밀번호 또는 oauth_token 중 정확히 하나만 설정되어 있는지 확인합니다.

3. 광범위한 롤아웃을 활성화하기 전에 **프로바이더 가용성을 검증**합니다.

4. **메트릭 확인:**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## 도움 받기

위의 해결책 중 어느 것도 문제를 해결하지 못하는 경우:

1. **기존 이슈 확인:** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. 다음 내용과 함께 **새 이슈를 제출**합니다:
   - PRX-Email 버전 (`Cargo.toml` 확인)
   - Rust 툴체인 버전 (`rustc --version`)
   - 관련 구조화된 로그 출력
   - 재현 단계

## 다음 단계

- [설정 레퍼런스](../configuration/) -- 모든 설정 검토
- [OAuth 인증](../accounts/oauth) -- OAuth 특정 문제 해결
- [SQLite 스토리지](../storage/) -- 데이터베이스 유지 관리 및 복구
