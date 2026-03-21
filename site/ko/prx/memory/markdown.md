---
title: Markdown 메모리 백엔드
description: 버전 관리와 단일 사용자 설정에 이상적인 Markdown 파일을 사용하는 파일 기반 메모리 스토리지입니다.
---

# Markdown 메모리 백엔드

Markdown 백엔드는 메모리를 디스크의 구조화된 Markdown 파일로 저장합니다. 이는 가장 단순한 백엔드이며 메모리를 사람이 읽을 수 있고 버전 관리 가능하게 하려는 단일 사용자 CLI 설정에 적합합니다.

## 개요

메모리는 설정 가능한 디렉터리에 Markdown 파일로 정리됩니다. 각 메모리 항목은 토픽이나 날짜별로 그룹화된 파일 내의 섹션입니다. 형식은 기계 파싱과 사람 읽기 모두 가능하도록 설계되었습니다.

## 파일 구조

```
~/.local/share/openprx/memory/
  ├── facts.md          # 추출된 핵심 팩트
  ├── preferences.md    # 사용자 선호도
  ├── projects/
  │   ├── project-a.md  # 프로젝트별 메모리
  │   └── project-b.md
  └── archive/
      └── 2026-02.md    # 보관된 오래된 메모리
```

## 설정

```toml
[memory]
backend = "markdown"

[memory.markdown]
directory = "~/.local/share/openprx/memory"
max_file_size_kb = 512
auto_archive_days = 30
```

## 검색

Markdown 백엔드는 리콜을 위해 단순한 전체 텍스트 grep을 사용합니다. 시맨틱 검색만큼 정교하지는 않지만 빠르며 추가 종속성이 필요하지 않습니다.

## 제한 사항

- 시맨틱 유사도 검색 없음
- 검색을 위한 선형 스캔 (대규모 메모리 저장소에서는 느림)
- 파일 잠금 없이는 동시 쓰기 접근이 안전하지 않음

## 관련 페이지

- [메모리 시스템 개요](./)
- [SQLite 백엔드](./sqlite) -- 더 구조화된 스토리지
- [메모리 정리](./hygiene)
