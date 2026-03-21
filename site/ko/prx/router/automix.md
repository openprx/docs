---
title: Automix 라우터
description: 저렴한 모델로 시작하고 신뢰도가 낮으면 에스컬레이션하는 비용 최적화 LLM 라우팅입니다.
---

# Automix 라우터

Automix 라우터는 모든 쿼리를 저렴한 모델로 시작하고 초기 응답의 신뢰도가 임계값 이하인 경우에만 프리미엄 모델로 에스컬레이션하여 비용을 최적화합니다.

## 작동 방식

1. **초기 쿼리** -- 저렴한 모델로 쿼리 전송
2. **신뢰도 확인** -- 응답 신뢰도 점수 평가
3. **필요시 에스컬레이션** -- 신뢰도가 임계값 이하이면 프리미엄 모델로 다시 쿼리
4. **반환** -- 첫 번째 신뢰도 높은 응답 반환

## 신뢰도 점수

신뢰도는 다음을 기반으로 평가됩니다:

- 응답에서 자체 보고된 신뢰도
- 헤지 표현의 존재 ("I'm not sure", "might be")
- 응답의 토큰 수준 엔트로피
- 도구 호출 성공률

## 설정

```toml
[router]
strategy = "automix"

[router.automix]
enabled = true
confidence_threshold = 0.7
cheap_model = "anthropic/claude-haiku"
premium_model = "anthropic/claude-opus-4-6"
max_escalations = 1
```

## 비용 절감

일반적인 사용에서 Automix는 쿼리의 60-80%를 저렴한 모델로 라우팅하여 복잡한 쿼리에 대한 품질을 유지하면서 상당한 비용 절감을 달성합니다.

## 관련 페이지

- [라우터 개요](./)
- [휴리스틱 라우터](./heuristic)
- [KNN 라우터](./knn)
