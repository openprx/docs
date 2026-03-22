---
title: Webhook-ები
description: გამავალი webhook შეტყობინებები PRX-ის მოვლენებისა და ინტეგრაციებისთვის.
---

# Webhook-ები

PRX გამავალ webhook-ებს უჭერს მხარს გარე სერვისების აგენტის მოვლენების შესახებ შეტყობინებისთვის. Webhook-ები CI/CD სისტემებთან, მონიტორინგის ინსტრუმენტებთან და მორგებულ სამუშაო პროცესებთან ინტეგრაციას უზრუნველყოფს.

## მიმოხილვა

კონფიგურაციის შემთხვევაში PRX HTTP POST მოთხოვნებს აგზავნის რეგისტრირებულ webhook URL-ებზე კონკრეტული მოვლენების დროს:

- **session.created** -- ახალი აგენტის სესია დაიწყო
- **session.completed** -- აგენტის სესია დასრულდა
- **tool.executed** -- ინსტრუმენტი გამოძახებულ იქნა და დასრულდა
- **error.occurred** -- შეცდომა აღმოჩნდა

## კონფიგურაცია

```toml
[[gateway.webhooks]]
url = "https://example.com/webhook"
secret = "your-webhook-secret"
events = ["session.completed", "error.occurred"]
timeout_secs = 10
max_retries = 3
```

## დატვირთვის ფორმატი

Webhook დატვირთვები JSON ობიექტებია სტანდარტული ველებით:

```json
{
  "event": "session.completed",
  "timestamp": "2026-03-21T10:00:00Z",
  "data": { }
}
```

## ხელმოწერის ვერიფიკაცია

ყოველი webhook მოთხოვნა `X-PRX-Signature` ჰედერს შეიცავს, რომელიც კონფიგურირებული საიდუმლოს გამოყენებით დატვირთვის HMAC-SHA256 ხელმოწერას წარმოადგენს.

## დაკავშირებული გვერდები

- [გეითვეის მიმოხილვა](./)
- [HTTP API](./http-api)
