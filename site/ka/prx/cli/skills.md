---
title: prx skills
description: PRX აგენტის შესაძლებლობების გამაფართოებელი ინსტალირებადი უნარების მართვა.
---

# prx skills

მართეთ უნარები -- მოდულური შესაძლებლობების პაკეტები, რომლებიც აფართოებენ PRX აგენტის მოქმედების სფეროს. უნარები აერთიანებენ პრომფთებს, ინსტრუმენტების კონფიგურაციებსა და WASM დანამატებს ინსტალირებად ერთეულებში.

## გამოყენება

```bash
prx skills <SUBCOMMAND> [OPTIONS]
```

## ქვებრძანებები

### `prx skills list`

დაინსტალირებული უნარებისა და რეესტრიდან ხელმისაწვდომი უნარების ჩამოთვლა.

```bash
prx skills list [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--installed` | | `false` | მხოლოდ დაინსტალირებული უნარების ჩვენება |
| `--available` | | `false` | მხოლოდ ხელმისაწვდომი (ჯერ არ დაინსტალირებული) უნარების ჩვენება |
| `--json` | `-j` | `false` | გამოტანა JSON ფორმატში |

**გამოსავლის მაგალითი:**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

უნარის ინსტალაცია რეესტრიდან ან ლოკალური გზიდან.

```bash
prx skills install <NAME|PATH> [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--version` | `-v` | უახლესი | ინსტალაციისთვის კონკრეტული ვერსია |
| `--force` | `-f` | `false` | ხელახალი ინსტალაცია, თუნდაც უკვე დაინსტალირებულია |

```bash
# ინსტალაცია რეესტრიდან
prx skills install code-review

# კონკრეტული ვერსიის ინსტალაცია
prx skills install web-research --version 1.0.2

# ინსტალაცია ლოკალური გზიდან
prx skills install ./my-custom-skill/

# იძულებითი ხელახალი ინსტალაცია
prx skills install code-review --force
```

### `prx skills remove`

უნარის დეინსტალაცია.

```bash
prx skills remove <NAME> [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--force` | `-f` | `false` | დადასტურების მოთხოვნის გამოტოვება |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## უნარის სტრუქტურა

უნარის პაკეტი შეიცავს:

```
my-skill/
  skill.toml          # უნარის მეტამონაცემები და კონფიგურაცია
  system_prompt.md    # დამატებითი სისტემური პრომფთის ინსტრუქციები
  tools.toml          # ინსტრუმენტების განსაზღვრებები და უფლებები
  plugin.wasm         # არასავალდებულო WASM დანამატის ბინარი
```

`skill.toml` მანიფესტი:

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## უნარების დირექტორია

დაინსტალირებული უნარები ინახება:

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## დაკავშირებული

- [დანამატების მიმოხილვა](/ka/prx/plugins/) -- WASM დანამატების სისტემა
- [ინსტრუმენტების მიმოხილვა](/ka/prx/tools/) -- ჩაშენებული ინსტრუმენტები
- [დეველოპერის სახელმძღვანელო](/ka/prx/plugins/developer-guide) -- მორგებული დანამატების შექმნა
