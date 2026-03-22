---
title: API მიმოხილვა
description: "Fenfa REST API ცნობარი: Token-ზე დაფუძნებული ავთენტიფიკაცია, JSON პასუხები და build-ების ატვირთვის, პროდუქტების მართვისა და ანალიტიკის endpoint-ები."
---

# API მიმოხილვა

Fenfa REST API-ს build-ების ატვირთვის, პროდუქტების მართვისა და ანალიტიკის მოკითხვისთვის ექსპოზდება. CI/CD ატვირთვებიდან admin panel-ის ოპერაციებამდე ყველა პროგრამული ინტერაქცია ამ API-ს გადის.

## ბაზის URL

ყველა API endpoint Fenfa სერვერის URL-ის შედარებითია:

```
https://your-domain.com
```

## ავთენტიფიკაცია

დაცული endpoint-ები `X-Auth-Token` header-ს მოითხოვს. Fenfa ორ token scope-ს იყენებს:

| Scope | შეუძლია | Header |
|-------|---------|--------|
| `upload` | Build-ების ატვირთვა | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | სრული admin წვდომა (upload-ის ჩათვლით) | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

Token-ები `config.json`-ში ან გარემოს ცვლადებით კონფიგურდება. იხ. [კონფიგურაცია](../configuration/).

::: warning
ვალიდური token-ის გარეშე დაცული endpoint-ებზე მოთხოვნები `401 Unauthorized` პასუხს იღებს.
:::

## პასუხის ფორმატი

ყველა JSON პასუხი ერთიანი სტრუქტურით:

**წარმატება:**

```json
{
  "ok": true,
  "data": { ... }
}
```

**შეცდომა:**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### შეცდომის კოდები

| კოდი | HTTP სტატუსი | აღწერა |
|------|-------------|--------|
| `BAD_REQUEST` | 400 | არასწორი მოთხოვნის პარამეტრები |
| `UNAUTHORIZED` | 401 | token-ი არ არის ან არასწორია |
| `FORBIDDEN` | 403 | Token-ს საჭირო scope-ი არ აქვს |
| `NOT_FOUND` | 404 | რესურსი ვერ მოიძებნა |
| `INTERNAL_ERROR` | 500 | სერვერის შეცდომა |

## Endpoint-ების შეჯამება

### საჯარო Endpoint-ები (ავთენტიფიკაცია არ სჭირდება)

| მეთოდი | Path | აღწერა |
|--------|------|--------|
| GET | `/products/:slug` | პროდუქტის ჩამოტვირთვის გვერდი (HTML) |
| GET | `/d/:releaseID` | ფაილის პირდაპირი ჩამოტვირთვა |
| GET | `/ios/:releaseID/manifest.plist` | iOS OTA manifest |
| GET | `/udid/profile.mobileconfig?variant=:id` | UDID binding profile |
| POST | `/udid/callback` | UDID callback (iOS-იდან) |
| GET | `/udid/status?variant=:id` | UDID binding სტატუსი |
| GET | `/healthz` | Health check |

### Upload Endpoint-ები (Upload Token)

| მეთოდი | Path | აღწერა |
|--------|------|--------|
| POST | `/upload` | Build ფაილის ატვირთვა |

### Admin Endpoint-ები (Admin Token)

| მეთოდი | Path | აღწერა |
|--------|------|--------|
| POST | `/admin/api/smart-upload` | Smart ატვირთვა ავტო-გამოვლენით |
| GET | `/admin/api/products` | პროდუქტების ჩამოთვლა |
| POST | `/admin/api/products` | პროდუქტის შექმნა |
| GET | `/admin/api/products/:id` | პროდუქტის მიღება variant-ებით |
| PUT | `/admin/api/products/:id` | პროდუქტის განახლება |
| DELETE | `/admin/api/products/:id` | პროდუქტის წაშლა |
| POST | `/admin/api/products/:id/variants` | Variant-ის შექმნა |
| PUT | `/admin/api/variants/:id` | Variant-ის განახლება |
| DELETE | `/admin/api/variants/:id` | Variant-ის წაშლა |
| GET | `/admin/api/variants/:id/stats` | Variant-ის სტატისტიკა |
| DELETE | `/admin/api/releases/:id` | Release-ის წაშლა |
| PUT | `/admin/api/apps/:id/publish` | App-ის გამოქვეყნება |
| PUT | `/admin/api/apps/:id/unpublish` | App-ის გამოქვეყნების გაუქმება |
| GET | `/admin/api/events` | Event-ების მოკითხვა |
| GET | `/admin/api/ios_devices` | iOS მოწყობილობების ჩამოთვლა |
| POST | `/admin/api/devices/:id/register-apple` | Apple-ში მოწყობილობის რეგისტრაცია |
| POST | `/admin/api/devices/register-apple` | Batch მოწყობილობების რეგისტრაცია |
| GET | `/admin/api/settings` | პარამეტრების მიღება |
| PUT | `/admin/api/settings` | პარამეტრების განახლება |
| GET | `/admin/api/upload-config` | Upload კონფიგურაციის მიღება |
| GET | `/admin/api/apple/status` | Apple API სტატუსი |
| GET | `/admin/api/apple/devices` | Apple-ში რეგისტრირებული მოწყობილობები |

### ექსპორტის Endpoint-ები (Admin Token)

| მეთოდი | Path | აღწერა |
|--------|------|--------|
| GET | `/admin/exports/releases.csv` | Release-ების ექსპორტი |
| GET | `/admin/exports/events.csv` | Event-ების ექსპორტი |
| GET | `/admin/exports/ios_devices.csv` | iOS მოწყობილობების ექსპორტი |

## ID ფორმატი

ყველა რესურსის ID-ები პრეფიქსი + რანდომული სტრინგის ფორმატს იყენებს:

| პრეფიქსი | რესურსი |
|---------|---------|
| `prd_` | Product |
| `var_` | Variant |
| `rel_` | Release |
| `app_` | App (legacy) |

## დეტალური ცნობარები

- [Upload API](./upload) -- Upload endpoint-ი ველის ცნობარითა და მაგალითებით
- [Admin API](./admin) -- სრული admin endpoint-ის დოკუმენტაცია
