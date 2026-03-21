---
title: prx config
description: PRX კონფიგურაციის შემოწმება და შეცვლა ბრძანების ხაზიდან.
---

# prx config

PRX კონფიგურაციის ფაილის კითხვა, ჩაწერა, ვალიდაცია და ტრანსფორმაცია TOML-ის ხელით რედაქტირების გარეშე.

## გამოყენება

```bash
prx config <SUBCOMMAND> [OPTIONS]
```

## ქვებრძანებები

### `prx config get`

კონფიგურაციის მნიშვნელობის წაკითხვა წერტილით გამოყოფილი გასაღების გზით.

```bash
prx config get <KEY> [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--config` | `-c` | `~/.config/prx/config.toml` | კონფიგურაციის ფაილის გზა |
| `--json` | `-j` | `false` | მნიშვნელობის გამოტანა JSON ფორმატში |

```bash
# ნაგულისხმევი პროვაიდერის მიღება
prx config get providers.default

# გეითვეის პორტის მიღება
prx config get gateway.port

# მთელი სექციის მიღება JSON ფორმატში
prx config get providers --json
```

### `prx config set`

კონფიგურაციის მნიშვნელობის დაყენება.

```bash
prx config set <KEY> <VALUE> [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--config` | `-c` | `~/.config/prx/config.toml` | კონფიგურაციის ფაილის გზა |

```bash
# ნაგულისხმევი პროვაიდერის შეცვლა
prx config set providers.default "anthropic"

# გეითვეის პორტის შეცვლა
prx config set gateway.port 8080

# ბულის მნიშვნელობის დაყენება
prx config set evolution.l1.enabled true

# ჩადგმული მნიშვნელობის დაყენება
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

სრული კონფიგურაციის JSON სქემის ჩვენება. სასარგებლოა რედაქტორის ავტოდასრულებისა და ვალიდაციისთვის.

```bash
prx config schema [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--output` | `-o` | stdout | სქემის ჩაწერა ფაილში |
| `--format` | | `json` | გამოტანის ფორმატი: `json` ან `yaml` |

```bash
# სქემის ჩვენება stdout-ში
prx config schema

# სქემის შენახვა რედაქტორის ინტეგრაციისთვის
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

მონოლითური კონფიგურაციის ფაილის დაყოფა სექციების მიხედვით ცალკეულ ფაილებად. ეს ქმნის კონფიგურაციის დირექტორიას ცალკეული ფაილებით პროვაიდერებისთვის, არხებისთვის, cron-ისთვის და ა.შ.

```bash
prx config split [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--config` | `-c` | `~/.config/prx/config.toml` | წყაროს კონფიგურაციის ფაილი |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | გამოტანის დირექტორია |

```bash
prx config split

# შედეგი:
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

დაყოფილი კონფიგურაციის დირექტორიის უკან შერწყმა ერთ ფაილში.

```bash
prx config merge [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | წყაროს დირექტორია |
| `--output` | `-o` | `~/.config/prx/config.toml` | გამოტანის ფაილი |
| `--force` | `-f` | `false` | არსებული გამოტანის ფაილის გადაწერა |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## მაგალითები

```bash
# კონფიგურაციის სწრაფი შემოწმება
prx config get .  # მთელი კონფიგურაციის ჩვენება

# პროვაიდერის გასაღების განახლება
prx config set providers.anthropic.api_key "sk-ant-..."

# სქემის გენერირება VS Code-ისთვის
prx config schema --output ~/.config/prx/schema.json
# შემდეგ VS Code settings.json-ში:
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# სარეზერვო ასლი და დაყოფა ვერსიის კონტროლისთვის
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## დაკავშირებული

- [კონფიგურაციის მიმოხილვა](/ka/prx/config/) -- კონფიგურაციის ფაილის ფორმატი და სტრუქტურა
- [სრული მითითება](/ka/prx/config/reference) -- ყველა კონფიგურაციის ვარიანტი
- [ცხელი გადატვირთვა](/ka/prx/config/hot-reload) -- კონფიგურაციის გადატვირთვა გაშვების დროს
- [გარემოს ცვლადები](/ka/prx/config/environment) -- გარემოს ცვლადებით ჩანაცვლება
