---
title: LLM 라우터
description: 모델 선택, 비용 최적화, 품질 균형을 위한 PRX 지능형 LLM 라우터 개요입니다.
---

# LLM 라우터

PRX 라우터는 각 요청에 대해 최적의 LLM 프로바이더와 모델을 자동으로 선택하는 지능형 모델 선택 시스템입니다. 여러 라우팅 전략을 사용하여 품질, 비용, 지연 시간의 균형을 맞춥니다.

## 개요

단일 모델만 항상 사용하는 대신 라우터는 다음을 기반으로 설정된 모델 중에서 동적으로 선택합니다:

- 쿼리 복잡도 및 유형
- 모델 기능 점수 및 Elo 레이팅
- 비용 제약
- 지연 시간 요구 사항
- 과거 성능 데이터

## 라우팅 전략

| 전략 | 설명 | 최적 용도 |
|------|------|----------|
| [휴리스틱](./heuristic) | 쿼리 특성을 사용한 규칙 기반 점수 | 간단한 설정, 예측 가능한 동작 |
| [KNN](./knn) | 과거 성공적인 쿼리와의 시맨틱 유사도 | 학습된 라우팅, 높은 정확도 |
| [Automix](./automix) | 저렴하게 시작하고 신뢰도 낮으면 에스컬레이션 | 비용 최적화 |

## 설정

```toml
[router]
enabled = true
strategy = "heuristic"  # "heuristic" | "knn" | "automix"
default_model = "anthropic/claude-sonnet-4-6"

[router.models]
cheap = "anthropic/claude-haiku"
standard = "anthropic/claude-sonnet-4-6"
premium = "anthropic/claude-opus-4-6"
```

## 관련 페이지

- [휴리스틱 라우터](./heuristic)
- [KNN 라우터](./knn)
- [Automix 라우터](./automix)
- [LLM 프로바이더](/ko/prx/providers/)
