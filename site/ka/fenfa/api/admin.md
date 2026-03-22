---
title: Admin API
description: Fenfa admin API-ის სრული ცნობარი პროდუქტების, variant-ების, release-ების, მოწყობილობების, პარამეტრებისა და ექსპორტების სამართავად.
---

# Admin API

ყველა admin endpoint-ი admin-scoped token-ით `X-Auth-Token` header-ს მოითხოვს. Admin token-ებს ყველა API ოპერაციაზე სრული წვდომა აქვს, upload-ის ჩათვლით.

## პროდუქტები

### პროდუქტების ჩამოთვლა

```
GET /admin/api/products
```

ყველა პროდუქტს საბაზო ინფორმაციით აბრუნებს.

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### პროდუქტის შექმნა

```
POST /admin/api/products
Content-Type: application/json
```

| ველი | სავალდებულო | აღწერა |
|------|-------------|--------|
| `name` | დიახ | პროდუქტის ჩვენების სახელი |
| `slug` | დიახ | URL იდენტიფიკატორი (უნიკალური) |
| `description` | არა | პროდუქტის აღწერა |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "Cross-platform app"}'
```

### პროდუქტის მიღება

```
GET /admin/api/products/:productID
```

პროდუქტს ყველა variant-ით აბრუნებს.

### პროდუქტის განახლება

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### პროდუქტის წაშლა

```
DELETE /admin/api/products/:productID
```

::: danger Cascading წაშლა
პროდუქტის წაშლა მის ყველა variant-ს, release-სა და ატვირთულ ფაილს სამუდამოდ შლის.
:::

## Variant-ები

### Variant-ის შექმნა

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| ველი | სავალდებულო | აღწერა |
|------|-------------|--------|
| `platform` | დიახ | `ios`, `android`, `macos`, `windows`, `linux` |
| `display_name` | დიახ | ადამიანის-წასაკითხი სახელი |
| `identifier` | დიახ | Bundle ID ან package name |
| `arch` | არა | CPU არქიტექტურა |
| `installer_type` | არა | ფაილის ტიპი (`ipa`, `apk`, `dmg` და სხვ.) |
| `min_os` | არა | OS-ის მინიმალური ვერსია |
| `sort_order` | არა | ჩვენების თანმიმდევრობა (ნაკლები = პირველი) |

### Variant-ის განახლება

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### Variant-ის წაშლა

```
DELETE /admin/api/variants/:variantID
```

::: danger Cascading წაშლა
Variant-ის წაშლა მის ყველა release-სა და ატვირთულ ფაილს სამუდამოდ შლის.
:::

### Variant-ის სტატისტიკა

```
GET /admin/api/variants/:variantID/stats
```

Variant-ის ჩამოტვირთვის რაოდენობასა და სხვა სტატისტიკას აბრუნებს.

## Release-ები

### Release-ის წაშლა

```
DELETE /admin/api/releases/:releaseID
```

Release-სა და ატვირთულ ბინარულ ფაილს შლის.

## გამოქვეყნება

კონტროლი, ხილულია თუ არა პროდუქტი/app საჯარო ჩამოტვირთვის გვერდზე.

### გამოქვეყნება

```
PUT /admin/api/apps/:appID/publish
```

### გამოქვეყნების გაუქმება

```
PUT /admin/api/apps/:appID/unpublish
```

## Event-ები

### Event-ების მოკითხვა

```
GET /admin/api/events
```

ვიზიტის, კლიკის და ჩამოტვირთვის event-ებს აბრუნებს. ფილტრაციისთვის query პარამეტრებს მხარს უჭერს.

| პარამეტრი | აღწერა |
|-----------|--------|
| `type` | Event-ის ტიპი (`visit`, `click`, `download`) |
| `variant_id` | Variant-ის მიხედვით ფილტრი |
| `release_id` | Release-ის მიხედვით ფილტრი |

## iOS მოწყობილობები

### მოწყობილობების ჩამოთვლა

```
GET /admin/api/ios_devices
```

UDID binding-ი დასრულებული ყველა iOS მოწყობილობას აბრუნებს.

### Apple-ში მოწყობილობის რეგისტრაცია

```
POST /admin/api/devices/:deviceID/register-apple
```

ერთ მოწყობილობას Apple Developer ანგარიşşთან არარეგისტრირებს.

### Batch მოწყობილობების რეგისტრაცია

```
POST /admin/api/devices/register-apple
```

ყველა გაუარარეგისტრირებელ მოწყობილობას Apple-ში ერთი batch ოპერაციით არარეგისტრირებს.

## Apple Developer API

### სტატუსის შემოწმება

```
GET /admin/api/apple/status
```

აბრუნებს, კონფიგურირებული და ვალიდურია თუ არა Apple Developer API სერთიფიკატები.

### Apple მოწყობილობების ჩამოთვლა

```
GET /admin/api/apple/devices
```

Apple Developer ანგარიşşში რეგისტრირებულ მოწყობილობებს აბრუნებს.

## პარამეტრები

### პარამეტრების მიღება

```
GET /admin/api/settings
```

მიმდინარე სისტემის პარამეტრებს (დომენები, ორგანიზაცია, storage ტიპი) აბრუნებს.

### პარამეტრების განახლება

```
PUT /admin/api/settings
Content-Type: application/json
```

განახლებადი ველები:
- `primary_domain` -- manifest-ებისა და callback-ებისთვის საჯარო URL
- `secondary_domains` -- CDN ან ალტერნატიული დომენები
- `organization` -- ორგანიზაციის სახელი iOS profile-ებში
- `storage_type` -- `local` ან `s3`
- S3 კონფიგურაცია (endpoint, bucket, გასაღებები, საჯარო URL)
- Apple Developer API სერთიფიკატები

### Upload კონფიგურაციის მიღება

```
GET /admin/api/upload-config
```

მიმდინარე upload კონფიგურაციას storage ტიპისა და ლიმიტების ჩათვლით აბრუნებს.

## ექსპორტები

ექსტერნალური ანალიზისთვის მონაცემების CSV ფაილებად ექსპორტი:

| Endpoint | მონაცემები |
|----------|-----------|
| `GET /admin/exports/releases.csv` | ყველა release metadata-ით |
| `GET /admin/exports/events.csv` | ყველა event |
| `GET /admin/exports/ios_devices.csv` | ყველა iOS მოწყობილობა |

```bash
# Example: export all releases
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## შემდეგი ნაბიჯები

- [Upload API](./upload) -- Upload endpoint-ის ცნობარი
- [კონფიგურაცია](../configuration/) -- სერვერის კონფიგურაციის პარამეტრები
- [Production განასახება](../deployment/production) -- Admin API-ის დაცვა
