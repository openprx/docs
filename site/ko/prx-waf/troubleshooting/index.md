---
title: 문제 해결
description: "데이터베이스 연결, 규칙 로딩, 오탐, 클러스터 동기화, SSL 인증서, 성능 조정을 포함한 일반적인 PRX-WAF 문제에 대한 해결 방법."
---

# 문제 해결

이 페이지는 PRX-WAF 실행 시 발생하는 가장 일반적인 문제와 그 원인 및 해결 방법을 다룹니다.

## 데이터베이스 연결 실패

**증상:** PRX-WAF가 "connection refused" 또는 "authentication failed" 오류로 시작에 실패합니다.

**해결 방법:**

1. **PostgreSQL이 실행 중인지 확인:**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **연결 테스트:**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. TOML 설정에서 **연결 문자열 확인**:

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. 데이터베이스는 존재하지만 테이블이 없는 경우 **마이그레이션 실행**:

```bash
prx-waf -c configs/default.toml migrate
```

## 규칙이 로드되지 않음

**증상:** PRX-WAF는 시작되지만 활성 규칙이 없습니다. 공격이 탐지되지 않습니다.

**해결 방법:**

1. **규칙 통계 확인:**

```bash
prx-waf rules stats
```

출력에 규칙이 0개로 표시되면 규칙 디렉토리가 비어 있거나 잘못 설정된 것입니다.

2. 설정에서 **규칙 디렉토리 경로 확인**:

```toml
[rules]
dir = "rules/"
```

3. **규칙 파일 검증:**

```bash
python rules/tools/validate.py rules/
```

4. **YAML 구문 오류 확인** -- 단일 형식 오류 파일이 모든 규칙 로딩을 방해할 수 있습니다:

```bash
# 문제를 찾기 위해 파일 하나씩 검증
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **내장 규칙이 활성화되어 있는지 확인:**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## 핫 리로드가 작동하지 않음

**증상:** 규칙 파일을 수정했지만 변경 사항이 적용되지 않습니다.

**해결 방법:**

1. **핫 리로드가 활성화되어 있는지 확인:**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **수동으로 리로드 트리거:**

```bash
prx-waf rules reload
```

3. **SIGHUP 전송:**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **파일 시스템 감시 제한 확인** (Linux):

```bash
cat /proc/sys/fs/inotify/max_user_watches
# 너무 낮으면 증가:
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 오탐 (합법적인 요청이 차단됨)

**증상:** 합법적인 요청이 차단됩니다 (403 Forbidden).

**해결 방법:**

1. 보안 이벤트에서 **차단 규칙 식별**:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

이벤트에서 `rule_id` 필드를 확인합니다.

2. **특정 규칙 비활성화:**

```bash
prx-waf rules disable CRS-942100
```

3. **파라노이아 레벨 낮추기.** 파라노이아 2 이상으로 실행 중이면 1로 줄입니다:

```toml
# 규칙 설정에서, 파라노이아 레벨 1 규칙만 로드
```

4. **규칙을 로그 모드로 전환** (차단 대신 모니터링):

규칙 파일을 편집하여 `action: "block"`을 `action: "log"`로 변경한 후 리로드:

```bash
prx-waf rules reload
```

5. 신뢰할 수 있는 소스에 대한 **IP 허용 목록 추가**:

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
새 규칙을 배포할 때 `action: log`로 시작하여 오탐 가능성을 모니터링한 후 `action: block`으로 전환하세요.
:::

## SSL 인증서 문제

**증상:** HTTPS 연결 실패, 인증서 오류, 또는 Let's Encrypt 갱신 실패.

**해결 방법:**

1. **관리자 UI** → **SSL 인증서**에서 **인증서 상태 확인**.

2. ACME HTTP-01 챌린지를 위해 **포트 80이 인터넷에서 접근 가능한지 확인**.

3. 수동 인증서를 사용하는 경우 **인증서 경로 확인**:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **인증서가 도메인과 일치하는지 확인:**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## 클러스터 노드가 연결되지 않음

**증상:** 워커 노드가 클러스터에 참여할 수 없습니다. 상태에 "disconnected" 피어가 표시됩니다.

**해결 방법:**

1. 클러스터 포트 (기본값: UDP 16851)에서 **네트워크 연결 확인**:

```bash
# 워커에서 메인으로
nc -zuv node-a 16851
```

2. **방화벽 규칙 확인** -- 클러스터 통신은 UDP를 사용합니다:

```bash
sudo ufw allow 16851/udp
```

3. **인증서 확인** -- 모든 노드는 동일한 CA로 서명된 인증서를 사용해야 합니다:

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. 워커 노드에서 **시드 설정 확인**:

```toml
[cluster]
seeds = ["node-a:16851"]   # 메인 노드로 해석되어야 함
```

5. 디버그 상세 수준으로 **로그 검토**:

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## 높은 메모리 사용량

**증상:** PRX-WAF 프로세스가 예상보다 더 많은 메모리를 소비합니다.

**해결 방법:**

1. **응답 캐시 크기 줄이기:**

```toml
[cache]
max_size_mb = 128    # 기본값 256에서 줄임
```

2. **데이터베이스 연결 풀 줄이기:**

```toml
[storage]
max_connections = 10   # 기본값 20에서 줄임
```

3. **워커 스레드 줄이기:**

```toml
[proxy]
worker_threads = 2    # CPU 수에서 줄임
```

4. **메모리 사용량 모니터링:**

```bash
ps aux | grep prx-waf
```

## CrowdSec 연결 문제

**증상:** CrowdSec 통합에 "disconnected"가 표시되거나 결정이 로드되지 않습니다.

**해결 방법:**

1. **LAPI 연결 테스트:**

```bash
prx-waf crowdsec test
```

2. **API 키 확인:**

```bash
# CrowdSec 머신에서
cscli bouncers list
```

3. **LAPI URL 확인:**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. LAPI에 접근할 수 없을 때를 위한 **안전한 폴백 액션 설정**:

```toml
[crowdsec]
fallback_action = "log"    # LAPI 중단 시 차단하지 않음
```

## 성능 조정

### 느린 응답 시간

1. **응답 캐싱 활성화:**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **워커 스레드 증가:**

```toml
[proxy]
worker_threads = 8
```

3. **데이터베이스 연결 증가:**

```toml
[storage]
max_connections = 50
```

### 높은 CPU 사용량

1. **활성 규칙 수 줄이기.** 필요하지 않은 경우 파라노이아 레벨 3-4 규칙을 비활성화합니다.

2. **사용하지 않는 탐지 단계 비활성화.** 예를 들어 CrowdSec을 사용하지 않는 경우:

```toml
[crowdsec]
enabled = false
```

## 도움 받기

위의 해결 방법으로 문제가 해결되지 않는 경우:

1. **기존 이슈 확인:** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. **새 이슈 제출** (다음 포함):
   - PRX-WAF 버전
   - 운영 체제 및 커널 버전
   - 설정 파일 (비밀번호 제거)
   - 관련 로그 출력
   - 재현 단계

## 다음 단계

- [설정 레퍼런스](../configuration/reference) — 모든 설정 미세 조정
- [규칙 엔진](../rules/) — 규칙 평가 방식 이해
- [클러스터 모드](../cluster/) — 클러스터별 문제 해결
