---
title: KNN 라우터
description: 과거 쿼리 임베딩에 대한 K-최근접 이웃을 사용한 시맨틱 유사도 기반 LLM 라우팅입니다.
---

# KNN 라우터

KNN (K-최근접 이웃) 라우터는 시맨틱 유사도를 사용하여 들어오는 쿼리를 알려진 최적 모델 할당이 있는 과거 쿼리 데이터베이스와 매칭합니다. 이를 통해 시간이 지남에 따라 개선되는 학습된 라우팅이 가능합니다.

## 작동 방식

1. **쿼리 임베딩** -- 들어오는 쿼리를 벡터 임베딩으로 변환
2. **KNN 검색** -- 임베딩 저장소에서 가장 유사한 K개의 과거 쿼리 찾기
3. **투표** -- K개 이웃의 모델 할당을 집계
4. **선택** -- 가장 많은 투표를 받은 모델 선택 (유사도로 가중)

## 학습 데이터

KNN 라우터는 다음에서 데이터셋을 구축합니다:

- 품질 평가가 포함된 에이전트 세션 로그
- 프롬프트 진화에서의 A/B 테스트 결과
- 수동 피드백 및 수정

## 설정

```toml
[router]
strategy = "knn"

[router.knn]
k = 5
embedding_provider = "ollama"
embedding_model = "nomic-embed-text"
min_similarity = 0.6
min_dataset_size = 100
fallback_strategy = "heuristic"
```

## 콜드 스타트

학습 데이터가 충분하지 않은 경우 (`min_dataset_size` 미만) KNN 라우터는 휴리스틱 전략으로 폴백합니다.

## 관련 페이지

- [라우터 개요](./)
- [휴리스틱 라우터](./heuristic)
- [Automix 라우터](./automix)
- [Embeddings 메모리](/ko/prx/memory/embeddings)
