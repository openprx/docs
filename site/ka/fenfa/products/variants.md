---
title: პლატფორმის Variant-ები
description: Fenfa-ს პროდუქტის ქვეშ iOS, Android, macOS, Windows და Linux-ისთვის პლატფორმა-სპეციფიკური variant-ების კონფიგურაცია.
---

# პლატფორმის Variant-ები

Variant წარმოადგენს პლატფორმა-სპეციფიკური build target-ს პროდუქტის ქვეშ. ყოველ variant-ს აქვს საკუთარი პლატფორმა, იდენტიფიკატორი (bundle ID ან package name), არქიტექტურა და installer ტიპი. Release-ები სპეციფიკური variant-ებისთვის ატვირთდება.

## მხარდაჭერილი პლატფორმები

| პლატფორმა | იდენტიფიკატორის მაგალითი | Installer ტიპი | არქიტექტურა |
|-----------|------------------------|---------------|------------|
| `ios` | `com.example.myapp` | `ipa` | `arm64` |
| `android` | `com.example.myapp` | `apk` | `universal`, `arm64-v8a`, `armeabi-v7a` |
| `macos` | `com.example.myapp` | `dmg`, `pkg`, `zip` | `arm64`, `x86_64`, `universal` |
| `windows` | `com.example.myapp` | `exe`, `msi`, `zip` | `x64`, `arm64` |
| `linux` | `com.example.myapp` | `deb`, `rpm`, `appimage`, `tar.gz` | `x86_64`, `aarch64` |

## Variant-ის შექმნა

### Admin Panel-ის მეშვეობით

1. გახსენით პროდუქტი, რომელსაც variant-ს დაამატებთ.
2. დააჭირეთ **Add Variant**.
3. შეავსეთ ველები:

| ველი | სავალდებულო | აღწერა |
|------|-------------|--------|
| Platform | დიახ | სამიზნე პლატფორმა (`ios`, `android`, `macos`, `windows`, `linux`) |
| Display Name | დიახ | ადამიანის-წასაკითხი სახელი (მაგ., "iOS", "Android ARM64") |
| Identifier | დიახ | Bundle ID ან package name |
| Architecture | არა | CPU არქიტექტურა |
| Installer Type | არა | ფაილის ტიპი (`ipa`, `apk`, `dmg` და სხვ.) |
| Minimum OS | არა | OS-ის მინიმალური ვერსიის მოთხოვნა |
| Sort Order | არა | ჩამოტვირთვის გვერდზე ჩვენების თანმიმდევრობა (ნაკლები = პირველი) |

4. დააჭირეთ **Save**.

### API-ის მეშვეობით

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0"
  }'
```

პასუხი:

```json
{
  "ok": true,
  "data": {
    "id": "var_def456",
    "product_id": "prd_abc123",
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0",
    "published": true,
    "sort_order": 0
  }
}
```

## ტიპიური პროდუქტის კონფიგურაცია

ტიპიურ მრავალ-პლატფორმიანი პროდუქტს შეიძლება ჰქონდეს ეს variant-ები:

```
MyApp (Product)
├── iOS (com.example.myapp, ipa, arm64)
├── Android (com.example.myapp, apk, universal)
├── macOS Apple Silicon (com.example.myapp, dmg, arm64)
├── macOS Intel (com.example.myapp, dmg, x86_64)
├── Windows (com.example.myapp, exe, x64)
└── Linux (com.example.myapp, appimage, x86_64)
```

::: tip ერთი არქიტექტურა vs. მრავალი
Universal ბინარების მხარდამჭერი პლატფორმებისთვის (Android ან macOS) შეგიძლიათ შექმნათ ერთი variant `universal` არქიტექტურით. პლატფორმებისთვის, სადაც ცალ-ცალკე ბინარულებს აგზავნით არქიტექტურის მიხედვით, შექმენით ერთი variant თითო arch-ზე.
:::

## Variant-ის განახლება

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "iOS (Ad-Hoc)",
    "min_os": "16.0"
  }'
```

## Variant-ის წაშლა

::: danger Cascading წაშლა
Variant-ის წაშლა მის ყველა release-სა და ატვირთულ ფაილს სამუდამოდ შლის.
:::

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Variant-ის სტატისტიკა

კონკრეტული variant-ის ჩამოტვირთვის სტატისტიკის მიღება:

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## ID ფორმატი

Variant ID-ები `var_` პრეფიქსს იყენებს რანდომული სტრინგით (მაგ., `var_def456`).

## შემდეგი ნაბიჯები

- [Release მართვა](./releases) -- Build-ების ატვირთვა variant-ებზე
- [iOS განაწილება](../distribution/ios) -- OTA და UDID binding-ისთვის iOS-სპეციფიკური variant-ის კონფიგურაცია
- [Desktop განაწილება](../distribution/desktop) -- macOS, Windows და Linux განაწილების მოსაზრებები
