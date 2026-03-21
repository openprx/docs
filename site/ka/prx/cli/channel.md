---
title: prx channel
description: შეტყობინებების არხების კავშირების მართვა -- სია, დამატება, წაშლა, გაშვება და არხების დიაგნოსტიკა.
---

# prx channel

მართეთ შეტყობინებების არხები, რომლებთანაც PRX უკავშირდება. არხები არის ხიდები შეტყობინებების პლატფორმებს (Telegram, Discord, Slack და ა.შ.) და PRX აგენტის გაშვების გარემოს შორის.

## გამოყენება

```bash
prx channel <SUBCOMMAND> [OPTIONS]
```

## ქვებრძანებები

### `prx channel list`

ყველა დაკონფიგურირებული არხისა და მათი მიმდინარე სტატუსის ჩამოთვლა.

```bash
prx channel list [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--json` | `-j` | `false` | გამოტანა JSON ფორმატში |
| `--verbose` | `-v` | `false` | დეტალური კავშირის ინფორმაციის ჩვენება |

**გამოსავლის მაგალითი:**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

ახალი არხის კონფიგურაციის დამატება ინტერაქტიულად ან ფლაგებით.

```bash
prx channel add [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--type` | `-t` | | არხის ტიპი (მაგ., `telegram`, `discord`, `slack`) |
| `--name` | `-n` | ავტომატურად გენერირებული | არხის საჩვენებელი სახელი |
| `--token` | | | ბოტის ტოკენი ან API გასაღები |
| `--enabled` | | `true` | არხის დაუყოვნებლივ ჩართვა |
| `--interactive` | `-i` | `true` | ინტერაქტიული ოსტატის გამოყენება |

```bash
# ინტერაქტიული რეჟიმი (ნაბიჯ-ნაბიჯ მოთხოვნები)
prx channel add

# არაინტერაქტიული ფლაგებით
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

არხის კონფიგურაციის წაშლა.

```bash
prx channel remove <NAME> [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--force` | `-f` | `false` | დადასტურების მოთხოვნის გამოტოვება |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

კონკრეტული არხის გაშვება (ან გადატვირთვა) დემონის გადატვირთვის გარეშე.

```bash
prx channel start <NAME>
```

```bash
# შეცდომიანი არხის გადატვირთვა
prx channel start slack-team
```

ეს ბრძანება აგზავნის საკონტროლო შეტყობინებას გაშვებულ დემონთან. ამ ბრძანების მუშაობისთვის დემონი გაშვებული უნდა იყოს.

### `prx channel doctor`

არხის კავშირების დიაგნოსტიკის გაშვება. ამოწმებს ტოკენის ვალიდურობას, ქსელის კონექტივობას, webhook URL-ებს და უფლებებს.

```bash
prx channel doctor [NAME]
```

თუ `NAME` გამოტოვებულია, ყველა არხი მოწმდება.

```bash
# ყველა არხის შემოწმება
prx channel doctor

# კონკრეტული არხის შემოწმება
prx channel doctor telegram-main
```

**გამოსავლის მაგალითი:**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## მაგალითები

```bash
# სრული სამუშაო პროცესი: დამატება, შემოწმება, გაშვება
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# არხების სია JSON ფორმატში სკრიპტებისთვის
prx channel list --json | jq '.[] | select(.status == "error")'
```

## დაკავშირებული

- [არხების მიმოხილვა](/ka/prx/channels/) -- არხების დეტალური დოკუმენტაცია
- [prx daemon](./daemon) -- დემონი, რომელიც აწარმოებს არხის კავშირებს
- [prx doctor](./doctor) -- სრული სისტემის დიაგნოსტიკა არხების ჩათვლით
