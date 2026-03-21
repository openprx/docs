---
title: შუალედური ფენა
description: გეითვეის middleware სტეკი ავთენტიფიკაციის, სიჩქარის შეზღუდვის, CORS-ისა და ლოგირებისთვის.
---

# შუალედური ფენა

PRX გეითვეი კომპოზიციურ middleware სტეკს იყენებს ჯვარედინი საკითხების, როგორიცაა ავთენტიფიკაცია, სიჩქარის შეზღუდვა, CORS და მოთხოვნების ლოგირება, დასამუშავებლად.

## Middleware სტეკი

მოთხოვნები middleware სტეკში თანმიმდევრობით გადის:

1. **მოთხოვნების ლოგირება** -- შემომავალი მოთხოვნების ლოგირება დროის გაზომვით
2. **CORS** -- ჯვარ-ორიგინის რესურსების გაზიარების ჰედერების დამუშავება
3. **ავთენტიფიკაცია** -- bearer ტოკენების ან API გასაღებების ვალიდაცია
4. **სიჩქარის შეზღუდვა** -- კლიენტზე მოთხოვნების ლიმიტების აღსრულება
5. **მოთხოვნის მარშრუტიზაცია** -- შესაბამის ჰენდლერზე გადამისამართება

## ავთენტიფიკაციის შუალედური ფენა

```toml
[gateway.auth]
enabled = true
method = "bearer"  # "bearer" | "api_key" | "none"
token_secret = "your-secret-key"
```

## სიჩქარის შეზღუდვა

```toml
[gateway.rate_limit]
enabled = true
requests_per_minute = 60
burst_size = 10
```

## CORS

```toml
[gateway.cors]
allowed_origins = ["https://app.example.com"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
allowed_headers = ["Authorization", "Content-Type"]
max_age_secs = 86400
```

## მოთხოვნების ლოგირება

ყველა API მოთხოვნა ლოგირდება მეთოდით, ბილიკით, სტატუს კოდითა და პასუხის დროით. ლოგის დონე კონფიგურირებადია:

```toml
[gateway.logging]
level = "info"  # "debug" | "info" | "warn" | "error"
format = "json"  # "json" | "pretty"
```

## დაკავშირებული გვერდები

- [გეითვეის მიმოხილვა](./)
- [HTTP API](./http-api)
- [უსაფრთხოება](/ka/prx/security/)
