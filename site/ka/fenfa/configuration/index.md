---
title: კონფიგურაციის ცნობარი
description: "Fenfa-ს სრული კონფიგურაციის ცნობარი: config ფაილის პარამეტრები, გარემოს ცვლადები, storage პარამეტრები და Apple Developer API სერთიფიკატები."
---

# კონფიგურაციის ცნობარი

Fenfa `config.json` ფაილის, გარემოს ცვლადების ან admin panel-ის (runtime პარამეტრებისთვის, storage-ისა და Apple API-ის მსგავსი) მეშვეობით კონფიგურდება.

## კონფიგურაციის პრიორიტეტი

1. **გარემოს ცვლადები** -- უმაღლესი პრიორიტეტი, ყველაფერს გადაფარავს
2. **config.json ფაილი** -- სტარტის დროს იტვირთება
3. **ნაგულისხმევი მნიშვნელობები** -- გამოიყენება, როდესაც არაფერია მითითებული

## Config ფაილი

შექმენით `config.json` სამუშაო დირექტორიაში (ან Docker-ში mount-ი):

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "Your Company Name",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## სერვერის პარამეტრები

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|---------|------|-------------|--------|
| `server.port` | string | `"8000"` | HTTP listening პორტი |
| `server.primary_domain` | string | `"http://localhost:8000"` | საჯარო URL manifest-ებში, callback-ებსა და ჩამოტვირთვის ბმულებში გამოსაყენებლად |
| `server.secondary_domains` | string[] | `[]` | დამატებითი დომენები (CDN, ალტერნატიული წვდომა) |
| `server.organization` | string | `"Fenfa Distribution"` | iOS mobile config profile-ებში ნაჩვენები ორგანიზაციის სახელი |
| `server.bundle_id_prefix` | string | `""` | გენერირებული profile-ებისთვის bundle ID პრეფიქსი |
| `server.data_dir` | string | `"data"` | SQLite მონაცემთა ბაზის დირექტორია |
| `server.db_path` | string | `"data/fenfa.db"` | Explicit მონაცემთა ბაზის ფაილის path |
| `server.dev_proxy_front` | string | `""` | საჯარო გვერდის Vite dev სერვერის URL (მხოლოდ განვითარება) |
| `server.dev_proxy_admin` | string | `""` | Admin panel-ის Vite dev სერვერის URL (მხოლოდ განვითარება) |

::: warning Primary Domain
`primary_domain` პარამეტრი iOS OTA განაწილებისთვის კრიტიკულია. ეს უნდა იყოს HTTPS URL, რომელსაც მომხმარებლები წვდებიან. iOS manifest ფაილები ამ URL-ს ჩამოტვირთვის ბმულებისთვის იყენებს, და UDID callback-ები ამ დომენზე გადამისამართდება.
:::

## ავთენტიფიკაცია

| გასაღები | ტიპი | ნაგულისხმევი | აღწერა |
|---------|------|-------------|--------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | Upload API-ის Token-ები |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | Admin API-ის Token-ები (upload ნებართვის ჩათვლით) |

::: danger ნაგულისხმევი Token-ების შეცვლა
ნაგულისხმევი token-ები (`dev-upload-token` და `dev-admin-token`) მხოლოდ განვითარებისთვისაა. production-ში განასახებამდე ყოველთვის შეცვალეთ.
:::

ყოველი scope-ისთვის მრავალი token-ი მხარდაჭერილია, სხვადასხვა CI/CD pipeline-ებს ან გუნდის წევრებს სხვადასხვა token-ების გაცემის და ცალ-ცალკე გაუქმების საშუალებას იძლევა.

## გარემოს ცვლადები

ნებისმიერი config მნიშვნელობის გარემოს ცვლადებით გადაფარვა:

| ცვლადი | Config-ის ეკვივალენტი | აღწერა |
|--------|----------------------|--------|
| `FENFA_PORT` | `server.port` | HTTP listening პორტი |
| `FENFA_DATA_DIR` | `server.data_dir` | მონაცემთა ბაზის დირექტორია |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | საჯარო დომენის URL |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | Admin token (პირველ token-ს ცვლის) |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | Upload token (პირველ token-ს ცვლის) |

მაგალითი:

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## Storage კონფიგურაცია

### ლოკალური Storage (ნაგულისხმევი)

ფაილები შენახულია `uploads/{product_id}/{variant_id}/{release_id}/filename.ext`-ში სამუშაო დირექტორიაზე შედარებით. დამატებითი კონფიგურაცია არ სჭირდება.

### S3-Compatible Storage

Admin panel-ში **Settings > Storage**-ში ან API-ის მეშვეობით S3 storage-ის კონფიგურაცია:

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

მხარდაჭერილი პროვაიდერები:
- **Cloudflare R2** -- Egress გადასახადი არ არის, S3-compatible
- **AWS S3** -- სტანდარტული S3
- **MinIO** -- Self-hosted S3-compatible storage
- ნებისმიერი S3-compatible პროვაიდერი

::: tip Upload დომენი
თქვენი primary დომენი CDN-ს ფაილის ზომის შეზღუდვებს ემყარება, კონფიგურირეთ `upload_domain` ცალკე დომენად, რომელიც დიდი ფაილის ატვირთვებისთვის CDN შეზღუდვებს ავლის.
:::

## Apple Developer API

ავტომატური მოწყობილობის რეგისტრაციისთვის Apple Developer API სერთიფიკატების კონფიგურაცია. Admin panel-ში **Settings > Apple Developer API**-ში ან API-ის მეშვეობით დაყენება:

| ველი | აღწერა |
|------|--------|
| `apple_key_id` | App Store Connect-ის API Key ID |
| `apple_issuer_id` | Issuer ID (UUID ფორმატი) |
| `apple_private_key` | PEM-ფორმატის private key კონტენტი |
| `apple_team_id` | Apple Developer Team ID |

კონფიგურაციის ინსტრუქციებისთვის იხ. [iOS განაწილება](../distribution/ios).

## მონაცემთა ბაზა

Fenfa SQLite-ს GORM-ის მეშვეობით იყენებს. მონაცემთა ბაზის ფაილი კონფიგურირებულ `db_path`-ზე ავტომატურად იქმნება. Migration-ები სტარტის დროს ავტომატურად გაშვდება.

::: info Backup
Fenfa-ს backup-ისთვის დააკოპირეთ SQLite მონაცემთა ბაზის ფაილი და `uploads/` დირექტორია. S3 storage-ის შემთხვევაში, ლოკალური backup-ი მხოლოდ მონაცემთა ბაზის ფაილს სჭირდება.
:::

## განვითარების პარამეტრები

ლოკალური განვითარებისთვის hot reload-ით:

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

`dev_proxy_front` ან `dev_proxy_admin`-ის დაყენებისას Fenfa embedded frontend-ის ნაცვლად Vite dev სერვერზე მოთხოვნებს გადამისამართებს. ეს განვითარების დროს hot module replacement-ს ჩართავს.

## შემდეგი ნაბიჯები

- [Docker განასახება](../deployment/docker) -- Docker კონფიგურაცია და volume-ები
- [Production განასახება](../deployment/production) -- Reverse proxy და უსაფრთხოების გამაგრება
- [API მიმოხილვა](../api/) -- API ავთენტიფიკაციის დეტალები
