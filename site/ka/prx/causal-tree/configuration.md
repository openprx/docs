---
title: CTE კონფიგურაციის მითითება
description: PRX მიზეზობრივი ხის ძრავის სრული კონფიგურაციის მითითება.
---

# CTE კონფიგურაციის მითითება

მიზეზობრივი ხის ძრავა კონფიგურირდება PRX კონფიგურაციის ფაილის `[causal_tree]` სექციით.

> **CTE ნაგულისხმევად გამორთულია.** ქვემოთ ყველა პარამეტრი მოქმედებს მხოლოდ როცა `causal_tree.enabled = true`.

## სრული მაგალითი

```toml
[causal_tree]
enabled = true

w_confidence = 0.50
w_cost = 0.25
w_latency = 0.25

write_decision_log = true
write_metrics = true

[causal_tree.policy]
max_branches = 3
commit_threshold = 0.62
extra_token_ratio_limit = 0.35
extra_latency_budget_ms = 300
rehearsal_timeout_ms = 5000
default_side_effect_mode = "read_only"
circuit_breaker_threshold = 5
circuit_breaker_cooldown_secs = 60
```

## პარამეტრების მითითება

### ზედა დონის პარამეტრები

| პარამეტრი | ტიპი | ნაგულისხმევი | აღწერა |
|-----------|------|-------------|--------|
| `enabled` | bool | `false` | მთავარი გადამრთველი. `false`-ზე CTE სრულად გვერდავლილია. |
| `w_confidence` | f32 | `0.50` | ნდობის განზომილების შეფასების წონა. |
| `w_cost` | f32 | `0.25` | ღირებულების ჯარიმის შეფასების წონა. |
| `w_latency` | f32 | `0.25` | დაყოვნების ჯარიმის შეფასების წონა. |
| `write_decision_log` | bool | `true` | ჩართვისას გამოაქვს სტრუქტურირებული ლოგი ყოველი CTE გადაწყვეტილებისთვის. |
| `write_metrics` | bool | `true` | ჩართვისას აგროვებს CTE წარმადობის მეტრიკებს. |

### პოლიტიკის პარამეტრები (`[causal_tree.policy]`)

| პარამეტრი | ტიპი | ნაგულისხმევი | აღწერა |
|-----------|------|-------------|--------|
| `max_branches` | usize | `3` | მოთხოვნაზე კანდიდატი შტოების მაქსიმალური რაოდენობა. |
| `commit_threshold` | f32 | `0.62` | შტოს დასაფიქსირებელი მინიმალური კომპოზიტური ქულა. |
| `extra_token_ratio_limit` | f32 | `0.35` | CTE-ს დამატებითი ტოკენების მაქსიმალური თანაფარდობა საბაზისო მოთხოვნასთან. |
| `extra_latency_budget_ms` | u64 | `300` | CTE პაიპლაინის მაქსიმალური დამატებითი დაყოვნება (მილიწამები). |
| `rehearsal_timeout_ms` | u64 | `5000` | ერთი რეპეტიციის ტაიმაუტი (მილიწამები). |
| `default_side_effect_mode` | string | `"read_only"` | გვერდითი ეფექტების რეჟიმი. `"read_only"` / `"dry_run"` / `"live"`. |
| `circuit_breaker_threshold` | u32 | `5` | თანმიმდევრული წარუმატებლობები ამომრთველის ამოქმედებამდე. |
| `circuit_breaker_cooldown_secs` | u64 | `60` | ამომრთველის გაგრილების პერიოდი (წამები). |

## მინიმალური კონფიგურაცია

```toml
[causal_tree]
enabled = true
```

## დაკავშირებული გვერდები

- [მიზეზობრივი ხის ძრავის მიმოხილვა](./)
- [სრული კონფიგურაციის მითითება](/ka/prx/config/reference)
