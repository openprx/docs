---
title: WhatsApp (Cloud API)
description: PRX-ის დაკავშირება WhatsApp-თან Business Cloud API-ის მეშვეობით
---

# WhatsApp (Cloud API)

> დაუკავშირეთ PRX WhatsApp-ს Meta Business Cloud API-ის გამოყენებით webhook-ზე დაფუძნებული შეტყობინებებისთვის WhatsApp Business პლატფორმასთან.

## წინაპირობები

- [Meta Business ანგარიში](https://business.facebook.com/)
- WhatsApp Business API აპლიკაცია, გამართული [Meta დეველოპერ პორტალში](https://developers.facebook.com/)
- ტელეფონის ნომრის ID და წვდომის ტოკენი WhatsApp Business API-დან
- საჯაროდ ხელმისაწვდომი HTTPS ენდფოინთი webhook-ებისთვის

## სწრაფი დაყენება

### 1. WhatsApp Business API-ის გამართვა

1. გადადით [Meta დეველოპერ პორტალში](https://developers.facebook.com/) და შექმენით აპლიკაცია
2. დაამატეთ "WhatsApp" პროდუქტი თქვენს აპლიკაციას
3. "WhatsApp > API Setup"-ში ჩაინიშნეთ თქვენი **Phone Number ID** და შექმენით **Permanent Access Token**

### 2. PRX-ის კონფიგურაცია

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxxxxxxxxxxxxxxxxxxx"
phone_number_id = "123456789012345"
verify_token = "my-secret-verify-token"
allowed_numbers = ["+1234567890"]
```

### 3. Webhook-ების გამართვა

1. Meta დეველოპერ პორტალში გადადით "WhatsApp > Configuration"
2. მიუთითეთ webhook URL `https://your-domain.com/whatsapp`
3. შეიყვანეთ იგივე `verify_token`, რომელიც PRX-ში კონფიგურირებული გაქვთ
4. გამოიწერეთ `messages` webhook ველი

### 4. შემოწმება

```bash
prx channel doctor whatsapp
```

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `access_token` | `String` | *სავალდებულო* | მუდმივი წვდომის ტოკენი Meta Business API-დან |
| `phone_number_id` | `String` | *სავალდებულო* | ტელეფონის ნომრის ID Meta Business API-დან. ამ ველის არსებობა ირჩევს Cloud API რეჟიმს |
| `verify_token` | `String` | *სავალდებულო* | საერთო საიდუმლო webhook ვერიფიკაციის ხელის ჩამორთმევისთვის |
| `app_secret` | `String` | `null` | აპლიკაციის საიდუმლო webhook ხელმოწერის ვერიფიკაციისთვის (HMAC-SHA256). ასევე შეიძლება `ZEROCLAW_WHATSAPP_APP_SECRET` env ცვლადით |
| `allowed_numbers` | `[String]` | `[]` | ნებადართული ტელეფონის ნომრები E.164 ფორმატში (მაგ., `"+1234567890"`). `"*"` = ყველას დაშვება |

## ფუნქციები

- **Webhook-ზე დაფუძნებული შეტყობინებები** -- შეტყობინებების მიღება Meta webhook push შეტყობინებების მეშვეობით
- **E.164 ტელეფონის ნომრის ფილტრაცია** -- წვდომის შეზღუდვა კონკრეტულ ტელეფონის ნომრებზე
- **HTTPS აღსრულება** -- უარს ამბობს მონაცემების გადაცემაზე არა-HTTPS URL-ებით
- **Webhook ხელმოწერის ვერიფიკაცია** -- არასავალდებულო HMAC-SHA256 ვალიდაცია `app_secret`-ით
- **ტექსტური და მედია შეტყობინებები** -- ამუშავებს შემომავალ ტექსტს, სურათებსა და სხვა მედია ტიპებს

## შეზღუდვები

- საჭიროა საჯაროდ ხელმისაწვდომი HTTPS ენდფოინთი webhook-ების მიტანისთვის
- Meta-ს Cloud API-ს აქვს რეიტ ლიმიტები თქვენი ბიზნეს დონის მიხედვით
- 24-საათიანი შეტყობინებების ფანჯარა: პასუხის გაცემა მხოლოდ მომხმარებლის ბოლო შეტყობინებიდან 24 საათში შეგიძლიათ (შეტყობინების შაბლონების გამოყენების გარდა)
- ტელეფონის ნომრები ნებადართულ სიაში E.164 ფორმატში უნდა იყოს

## პრობლემების მოგვარება

### Webhook ვერიფიკაცია ვერ ხერხდება
- დარწმუნდით, რომ PRX კონფიგურაციაში `verify_token` ზუსტად ემთხვევა Meta დეველოპერ პორტალში შეყვანილს
- Webhook ენდფოინთმა GET მოთხოვნებს `hub.challenge` პარამეტრით უნდა უპასუხოს

### შეტყობინებები არ მიიღება
- შეამოწმეთ, რომ webhook გამოწერა მოიცავს `messages` ველს
- შეამოწმეთ webhook URL საჯაროდ ხელმისაწვდომია HTTPS-ით
- გადახედეთ webhook მიტანის ლოგებს Meta დეველოპერ პორტალში

### "Refusing to transmit over non-HTTPS" შეცდომა
- WhatsApp Cloud API-ის მთელი კომუნიკაცია HTTPS-ს მოითხოვს
- დარწმუნდით, რომ თქვენი PRX გეითვეი TLS-ის შემწყვეტ პროქსის უკანაა (მაგ., Caddy, Nginx SSL-ით)

::: tip WhatsApp Web რეჟიმი
ნატიური WhatsApp Web კლიენტისთვის, რომელიც არ საჭიროებს Meta Business API-ის გამართვას, იხილეთ [WhatsApp Web](./whatsapp-web).
:::
