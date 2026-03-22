---
title: პრობლემების მოგვარება
description: Fenfa-ს გაშვებისას გავრცელებული პრობლემები და გადაწყვეტები, iOS ინსტალაციის წარუმატებლობების, ატვირთვის შეცდომებისა და Docker პრობლემების ჩათვლით.
---

# პრობლემების მოგვარება

ეს გვერდი Fenfa-ს გაშვებისას გავრცელებულ პრობლემებს და გადაწყვეტებს მოიცავს.

## iOS ინსტალაცია

### "Unable to Install" / ინსტალაცია ვერ ხდება

**სიმპტომები:** iOS-ზე ინსტალის ღილაკის შეხებისას "Unable to Install" ჩანს ან არაფერი ხდება.

**მიზეზები და გადაწყვეტები:**

1. **HTTPS კონფიგურირებული არ არის.** iOS ვალიდური TLS სერთიფიკატით HTTPS-ს მოითხოვს OTA ინსტალაციისთვის. Self-signed სერთიფიკატები არ მუშაობს.
   - **გამოსწორება:** Reverse proxy ვალიდური TLS სერთიფიკატით დაყენება. იხ. [Production განასახება](../deployment/production).
   - **ტესტირებისთვის:** `ngrok`-ი HTTPS tunnel-ის შესაქმნელად: `ngrok http 8000`

2. **არასწორი primary_domain.** Manifest plist ჩამოტვირთვის URL-ებს `primary_domain`-ის მიხედვით შეიცავს. თუ ეს არასწორია, iOS-ს IPA გამოტანა ვერ შეუძლია.
   - **გამოსწორება:** `FENFA_PRIMARY_DOMAIN` ზუსტ HTTPS URL-ზე დაყენება, რომელსაც მომხმარებლები წვდებიან (მაგ., `https://dist.example.com`).

3. **სერთიფიკატის პრობლემები.** TLS სერთიფიკატი დომენს უნდა ფარავდეს და iOS-ის მიერ სანდო უნდა იყოს.
   - **გამოსწორება:** Let's Encrypt-ი გამოიყენეთ უფასო, სანდო სერთიფიკატებისთვის.

4. **IPA-ს ხელმოწერის ვადა ამოიწურა.** Provisioning profile ან signing სერთიფიკატი შეიძლება ვადასრულებული იყოს.
   - **გამოსწორება:** IPA ვალიდური სერთიფიკატით ხელახლა ხელმოწერა და ხელახლა ატვირთვა.

### UDID Binding არ მუშაობს

**სიმპტომები:** Mobileconfig profile-ი ინსტალდება, მაგრამ მოწყობილობა არ რეგისტრდება.

**მიზეზები და გადაწყვეტები:**

1. **Callback URL მიუწვდომელია.** UDID callback URL მოწყობილობიდან მიწვდომადი უნდა იყოს.
   - **გამოსწორება:** დარწმუნდით, რომ `primary_domain` სწორია და მოწყობილობის ქსელიდან მიწვდომადია.

2. **Nonce-ის ვადა ამოიწურა.** Profile nonce-ები timeout-ის შემდეგ ვადასრულდება.
   - **გამოსწორება:** Mobileconfig profile ხელახლა ჩამოტვირთეთ და ხელახლა ცადეთ.

## ატვირთვის პრობლემები

### ატვირთვა 401-ით ვერ ხდება

**სიმპტომი:** `{"ok": false, "error": {"code": "UNAUTHORIZED", ...}}`

**გამოსწორება:** გადაამოწმეთ `X-Auth-Token` header-ი ვალიდურ token-ს შეიცავს. Upload endpoint-ები upload-სა და admin token-ებს იღებს.

```bash
# Verify your token works
curl -H "X-Auth-Token: YOUR_TOKEN" http://localhost:8000/admin/api/products
```

### ატვირთვა 413-ით ვერ ხდება (Request Entity Too Large)

**სიმპტომი:** დიდი ფაილის ატვირთვები 413 შეცდომით ვერ ხდება.

**გამოსწორება:** ეს ჩვეულებრივ reverse proxy-ის ლიმიტია, არა Fenfa-ს. გაზარდეთ ლიმიტი:

**Nginx:**
```nginx
client_max_body_size 2G;
```

**Caddy:**
Caddy-ს ნაგულისხმევი body ზომის ლიმიტი არ აქვს, მაგრამ თუ დაყენებულია:
```
dist.example.com {
    request_body {
        max_size 2GB
    }
    reverse_proxy localhost:8000
}
```

### Smart Upload Metadata-ს ვერ გამოავლენს

**სიმპტომი:** ვერსია და build ნომერი smart upload-ის შემდეგ ცარიელია.

**გამოსწორება:** Smart upload-ის ავტო-გამოვლენა მხოლოდ IPA და APK ფაილებისთვის მუშაობს. Desktop ფორმატებისთვის (DMG, EXE, DEB და სხვ.) `version` და `build` upload მოთხოვნაში explicit მიუთითეთ.

## Docker პრობლემები

### კონტეინერი სტარტდება, მაგრამ Admin Panel ცარიელია

**სიმპტომი:** Admin panel იტვირთება, მაგრამ მონაცემებს ვერ ჩვენებს ან ცარიელი გვერდი ჩანს.

**გამოსწორება:** გადაამოწმეთ კონტეინერი მუშაობს და პორტი სწორია:

```bash
docker ps
docker logs fenfa
```

### კონტეინერის გადატვირთვის შემდეგ მონაცემები იკარგება

**სიმპტომი:** ყველა პროდუქტი, variant-ი და release-ი კონტეინერის გადატვირთვის შემდეგ ქრება.

**გამოსწორება:** მდგრადი volume-ების mount-ი:

```bash
docker run -d --name fenfa -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Mount-ებულ Volume-ებზე Permission Denied

**სიმპტომი:** Fenfa `/data`-ში ან `/app/uploads`-ში ჩაწერა ვერ ხდება.

**გამოსწორება:** დარწმუნდით, host-ის დირექტორიები არსებობს და სწორი ნებართვები აქვს:

```bash
mkdir -p data uploads
chmod 777 data uploads  # Or set appropriate UID/GID
```

## მონაცემთა ბაზის პრობლემები

### "database is locked" შეცდომა

**სიმპტომი:** SQLite "database is locked"-ს დიდი კონკურენტობის შემთხვევაში აბრუნებს.

**გამოსწორება:** SQLite კარგად ამუშავებს კონკურენტულ წაკითხვებს, მაგრამ ჩაწერებს სერიალიზებს. ეს შეცდომა ჩვეულებრივ ძალიან მაღალი write დატვირთვის შემთხვევაში ხდება. გადაწყვეტები:
- დარწმუნდით, ერთი Fenfa ინსტანცია ჩაწერს ერთ მონაცემთა ბაზის ფაილში.
- მრავალი ინსტანციის შემთხვევაში გამოიყენეთ S3 storage და გაზიარებული მონაცემთა ბაზა.

### დაზიანებული მონაცემთა ბაზა

**სიმპტომი:** Fenfa SQLite შეცდომებით ვერ სტარტდება.

**გამოსწორება:** backup-იდან აღდგენა:

```bash
# Stop Fenfa
docker stop fenfa

# Restore backup
cp /backups/fenfa-latest.db /path/to/data/fenfa.db

# Restart
docker start fenfa
```

::: tip პრევენცია
ყოველდღიური ავტომატური backup-ების კონფიგურაცია. backup სკრიპტისთვის იხ. [Production განასახება](../deployment/production).
:::

## ქსელის პრობლემები

### iOS Manifest-ი არასწორ URL-ებს აბრუნებს

**სიმპტომი:** iOS manifest plist `http://localhost:8000`-ს შეიცავს საჯარო დომენის ნაცვლად.

**გამოსწორება:** `FENFA_PRIMARY_DOMAIN` საჯარო HTTPS URL-ზე დაყენება:

```bash
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

### ჩამოტვირთვები ნელია ან timeout-ს განიცდის

**სიმპტომი:** დიდი ფაილის ჩამოტვირთვები ნელია ან ვერ ხდება.

**შესაძლო გამოსწორებები:**
- Reverse proxy-ის timeout-ის გაზრდა: `proxy_read_timeout 600s;` (Nginx)
- მოთხოვნის buffering-ის გათიშვა: `proxy_request_buffering off;` (Nginx)
- S3-compatible storage-ის CDN-თან ერთად განხილვა დიდი ფაილებისთვის

## დახმარების მიღება

თქვენი პრობლემა აქ არ არის განხილული:

1. [GitHub Issues](https://github.com/openprx/fenfa/issues)-ზე ცნობილი პრობლემების შემოწმება.
2. კონტეინერის ლოგების გადახედვა: `docker logs fenfa`
3. ახალი issue-ის გახსნა შემდეგით:
   - Fenfa ვერსია (`docker inspect fenfa | grep Image`)
   - შესაბამისი ლოგის გამოტანა
   - პრობლემის გამეორების ნაბიჯები
