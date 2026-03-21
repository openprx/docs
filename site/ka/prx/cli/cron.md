---
title: prx cron
description: PRX დემონზე გაშვებული დაგეგმილი cron ამოცანების მართვა.
---

# prx cron

მართეთ დაგეგმილი ამოცანები, რომლებიც შესრულდება PRX-ის cron დამგეგმავზე. Cron ამოცანებს შეუძლიათ LLM პრომფთების, shell ბრძანებების ან ინსტრუმენტების გამოძახების შესრულება განსაზღვრული გრაფიკით.

## გამოყენება

```bash
prx cron <SUBCOMMAND> [OPTIONS]
```

## ქვებრძანებები

### `prx cron list`

ყველა დაკონფიგურირებული cron ამოცანისა და მათი სტატუსის ჩამოთვლა.

```bash
prx cron list [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--json` | `-j` | `false` | გამოტანა JSON ფორმატში |
| `--verbose` | `-v` | `false` | ამოცანის სრული დეტალების ჩვენება, გრაფიკის გამოსახულების ჩათვლით |

**გამოსავლის მაგალითი:**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

ახალი cron ამოცანის დამატება.

```bash
prx cron add [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--name` | `-n` | აუცილებელი | ამოცანის სახელი |
| `--schedule` | `-s` | აუცილებელი | Cron გამოსახულება (5 ან 6 ველი) |
| `--prompt` | `-p` | | შესასრულებელი LLM პრომფთი |
| `--command` | `-c` | | შესასრულებელი shell ბრძანება |
| `--channel` | | | არხი, რომელზეც გაიგზავნება გამოსავალი |
| `--provider` | `-P` | კონფიგურაციის ნაგულისხმევი | LLM პროვაიდერი პრომფთის ამოცანებისთვის |
| `--model` | `-m` | პროვაიდერის ნაგულისხმევი | მოდელი პრომფთის ამოცანებისთვის |
| `--enabled` | | `true` | ამოცანის დაუყოვნებლივ ჩართვა |

`--prompt` ან `--command`-დან ერთ-ერთი მაინც უნდა იყოს მითითებული.

```bash
# ყოველდღიური მიმოხილვის დაგეგმვა
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# სარეზერვო ბრძანების დაგეგმვა
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# ყოველკვირეული ანგარიში ყოველ ორშაბათს 10:00-ზე
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

cron ამოცანის წაშლა ID-ით ან სახელით.

```bash
prx cron remove <ID|NAME> [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--force` | `-f` | `false` | დადასტურების მოთხოვნის გამოტოვება |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

cron ამოცანის შეჩერება. ამოცანა რჩება დაკონფიგურირებული, მაგრამ არ შესრულდება განახლებამდე.

```bash
prx cron pause <ID|NAME>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

შეჩერებული cron ამოცანის განახლება.

```bash
prx cron resume <ID|NAME>
```

```bash
prx cron resume weekly-report
```

## Cron გამოსახულების ფორმატი

PRX იყენებს სტანდარტულ 5-ველიან cron გამოსახულებებს:

```
 ┌───────── წუთი (0-59)
 │ ┌───────── საათი (0-23)
 │ │ ┌───────── თვის დღე (1-31)
 │ │ │ ┌───────── თვე (1-12)
 │ │ │ │ ┌───────── კვირის დღე (0-7, 0 და 7 = კვირა)
 │ │ │ │ │
 * * * * *
```

გავრცელებული მაგალითები:

| გამოსახულება | აღწერა |
|-------------|--------|
| `0 9 * * *` | ყოველ დღე 9:00-ზე |
| `*/15 * * * *` | ყოველ 15 წუთში |
| `0 */6 * * *` | ყოველ 6 საათში |
| `0 10 * * 1` | ყოველ ორშაბათს 10:00-ზე |
| `0 0 1 * *` | ყოველი თვის პირველ დღეს შუაღამისას |

## დაკავშირებული

- [დაგეგმვის მიმოხილვა](/ka/prx/cron/) -- cron არქიტექტურა და heartbeat
- [Cron ამოცანები](/ka/prx/cron/tasks) -- ამოცანების ტიპები და შესრულების დეტალები
- [prx daemon](./daemon) -- დემონი, რომელიც აწარმოებს cron დამგეგმავს
