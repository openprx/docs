---
title: 설정 레퍼런스
description: "프록시, API, 스토리지, 캐시, HTTP/3, 보안, 규칙, CrowdSec, 클러스터 섹션을 포함한 모든 PRX-WAF TOML 설정 키 레퍼런스."
---

# 설정 레퍼런스

PRX-WAF TOML 설정 파일의 모든 키에 대한 완전한 레퍼런스입니다.

## `[proxy]` — 리버스 프록시

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `listen` | `string` | `"0.0.0.0:8080"` | WAF 프록시가 수신할 주소:포트 |
| `worker_threads` | `integer` | CPU 코어 수 | Tokio 워커 스레드 수 |
| `connect_timeout_ms` | `integer` | `5000` | 업스트림 연결 타임아웃 (밀리초) |
| `read_timeout_ms` | `integer` | `30000` | 응답 읽기 타임아웃 (밀리초) |
| `write_timeout_ms` | `integer` | `30000` | 요청 쓰기 타임아웃 (밀리초) |
| `idle_timeout_ms` | `integer` | `60000` | 유휴 연결 타임아웃 (밀리초) |
| `redirect_http_to_https` | `boolean` | `false` | HTTP 트래픽을 HTTPS로 리디렉션 |
| `max_request_body_bytes` | `integer` | `10485760` | 최대 요청 바디 크기 (바이트, 기본값 10 MiB) |

## `[api]` — 관리 API

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `listen` | `string` | `"127.0.0.1:9527"` | 관리 API가 수신할 주소:포트 |
| `jwt_secret` | `string` | 필수 | JWT 서명 비밀 키 |
| `jwt_expiry_secs` | `integer` | `86400` | JWT 토큰 만료 시간 (초) |
| `cors_origins` | `string[]` | `[]` | 허용된 CORS 오리진 |

## `[storage]` — 데이터베이스

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `database_url` | `string` | 필수 | PostgreSQL 연결 문자열 |
| `max_connections` | `integer` | `20` | 연결 풀의 최대 연결 수 |
| `min_connections` | `integer` | `2` | 연결 풀의 최소 연결 수 |
| `connect_timeout_secs` | `integer` | `10` | 데이터베이스 연결 타임아웃 |

## `[cache]` — 응답 캐싱

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `enabled` | `boolean` | `false` | 응답 캐싱 활성화 |
| `max_size_mb` | `integer` | `256` | 최대 캐시 크기 (MiB) |
| `default_ttl_secs` | `integer` | `300` | 기본 캐시 TTL (초) |

## `[http3]` — HTTPS 및 HTTP/3

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `enabled` | `boolean` | `false` | HTTPS/HTTP3 활성화 |
| `listen` | `string` | `"0.0.0.0:443"` | HTTPS 수신 주소:포트 |
| `cert_pem` | `string` | `""` | TLS 인증서 파일 경로 |
| `key_pem` | `string` | `""` | TLS 개인 키 파일 경로 |
| `tls_min_version` | `string` | `"1.2"` | 최소 TLS 버전: `"1.2"` 또는 `"1.3"` |

### `[http3.acme]` — Let's Encrypt

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `enabled` | `boolean` | `false` | Let's Encrypt ACME 활성화 |
| `email` | `string` | `""` | 인증서 갱신 알림용 이메일 |
| `domains` | `string[]` | `[]` | 인증서를 발급할 도메인 목록 |
| `cache_dir` | `string` | `"/tmp/acme"` | 인증서 캐시 디렉토리 |
| `staging` | `boolean` | `false` | Let's Encrypt 스테이징 환경 사용 (테스트용) |

## `[security]` — 보안 응답

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `block_response_code` | `integer` | `403` | 차단된 요청의 HTTP 상태 코드 |
| `block_response_body` | `string` | `"Forbidden"` | 차단 응답 바디 텍스트 |
| `rate_limit_response_code` | `integer` | `429` | 속도 제한 응답의 HTTP 상태 코드 |
| `challenge_page_html` | `string` | 내장 HTML | 챌린지 페이지 HTML |

## `[rules]` — 규칙 엔진

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `dir` | `string` | `"rules/"` | 규칙 파일이 있는 디렉토리 |
| `hot_reload` | `boolean` | `true` | 파일 변경 시 규칙 자동 리로드 |
| `reload_debounce_ms` | `integer` | `500` | 핫 리로드 디바운스 지연 (밀리초) |
| `enable_builtin_owasp` | `boolean` | `true` | OWASP CRS 내장 규칙 활성화 |
| `enable_builtin_bot` | `boolean` | `true` | 봇 탐지 내장 규칙 활성화 |
| `enable_builtin_scanner` | `boolean` | `true` | 스캐너 탐지 내장 규칙 활성화 |
| `enable_builtin_modsecurity` | `boolean` | `true` | ModSecurity 내장 규칙 활성화 |
| `enable_builtin_cve_patches` | `boolean` | `true` | CVE 패치 내장 규칙 활성화 |
| `paranoia_level` | `integer` | `1` | OWASP CRS 파라노이아 레벨 (1-4) |

## `[crowdsec]` — CrowdSec 통합

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `enabled` | `boolean` | `false` | CrowdSec 통합 활성화 |
| `mode` | `string` | `"bouncer"` | 통합 모드: `bouncer`, `appsec`, `log_pusher` |
| `lapi_url` | `string` | `""` | CrowdSec LAPI 기본 URL |
| `api_key` | `string` | `""` | CrowdSec 바운서 API 키 |
| `update_interval_secs` | `integer` | `60` | LAPI에서 결정을 가져오는 간격 |
| `fallback_action` | `string` | `"log"` | LAPI 접근 불가 시 폴백: `log`, `block`, `allow` |
| `cache_decisions` | `boolean` | `true` | 로컬에서 결정 캐시 |
| `cache_ttl_secs` | `integer` | `300` | 캐시된 결정 TTL (초) |

## `[cluster]` — 클러스터링

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `enabled` | `boolean` | `false` | 클러스터 모드 활성화 |
| `node_id` | `string` | `""` | 고유 노드 식별자 |
| `listen` | `string` | `"0.0.0.0:16851"` | 클러스터 QUIC 수신 주소:포트 |
| `seeds` | `string[]` | `[]` | 연결할 시드 노드 주소 목록 (워커 전용) |
| `cert_pem` | `string` | `""` | 이 노드의 mTLS 인증서 |
| `key_pem` | `string` | `""` | 이 노드의 mTLS 개인 키 |
| `ca_pem` | `string` | `""` | 피어 인증을 위한 CA 인증서 |

## `[[hosts]]` — 보호된 호스트

| 키 | 유형 | 기본값 | 설명 |
|----|------|--------|------|
| `host` | `string` | 필수 | 매칭할 Host 헤더 값 |
| `upstream` | `string\|string[]` | 필수 | 업스트림 서버 URL (단일 또는 다중) |
| `load_balance` | `string` | `"round_robin"` | 로드 밸런싱 알고리즘 |
| `health_check_path` | `string` | `""` | 업스트림 상태 체크 경로 |
| `health_check_interval_secs` | `integer` | `10` | 상태 체크 간격 |
| `allow_ips` | `string[]` | `[]` | WAF 검사를 건너뛸 허용된 IP/CIDR |
| `block_ips` | `string[]` | `[]` | 항상 차단할 IP/CIDR |
| `cache_responses` | `boolean` | `false` | 이 호스트의 응답 캐시 활성화 |
| `cache_ttl_secs` | `integer` | `300` | 이 호스트의 캐시 TTL |

## 다음 단계

- [설정 개요](./index) — 설정 시스템 이해
- [설치 가이드](../getting-started/installation) — 초기 설정
- [문제 해결](../troubleshooting/) — 일반적인 설정 문제
