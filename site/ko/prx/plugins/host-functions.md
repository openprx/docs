---
title: 호스트 함수
description: PRX WASM 플러그인에 사용 가능한 호스트 함수 레퍼런스입니다.
---

# 호스트 함수

호스트 함수는 PRX가 WASM 플러그인에 노출하는 API 표면입니다. HTTP 요청, 파일 작업, 에이전트 상태 등 호스트 기능에 대한 제어된 접근을 제공합니다.

## 사용 가능한 호스트 함수

### HTTP

| 함수 | 설명 | 권한 |
|------|------|------|
| `http_request(method, url, headers, body)` | HTTP 요청 수행 | `net.http` |
| `http_get(url)` | GET 요청 단축어 | `net.http` |
| `http_post(url, body)` | POST 요청 단축어 | `net.http` |

### 파일시스템

| 함수 | 설명 | 권한 |
|------|------|------|
| `fs_read(path)` | 파일 읽기 | `fs.read` |
| `fs_write(path, data)` | 파일 쓰기 | `fs.write` |
| `fs_list(path)` | 디렉터리 내용 나열 | `fs.read` |

### 에이전트 상태

| 함수 | 설명 | 권한 |
|------|------|------|
| `memory_get(key)` | 에이전트 메모리에서 읽기 | `agent.memory.read` |
| `memory_set(key, value)` | 에이전트 메모리에 쓰기 | `agent.memory.write` |
| `config_get(key)` | 플러그인 설정 읽기 | `agent.config` |

### 로깅

| 함수 | 설명 | 권한 |
|------|------|------|
| `log_info(msg)` | info 레벨로 로그 | 항상 허용 |
| `log_warn(msg)` | warn 레벨로 로그 | 항상 허용 |
| `log_error(msg)` | error 레벨로 로그 | 항상 허용 |

## 권한 매니페스트

각 플러그인은 매니페스트에 필요한 권한을 선언합니다:

```toml
[permissions]
net.http = ["api.example.com"]
fs.read = ["/data/*"]
agent.memory.read = true
```

## 관련 페이지

- [플러그인 아키텍처](./architecture)
- [PDK 레퍼런스](./pdk)
- [보안 샌드박스](/ko/prx/security/sandbox)
