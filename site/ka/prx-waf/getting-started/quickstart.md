---
title: სწრაფი დაწყება
description: "PRX-WAF-ის თქვენი ვებ-პროგრამის დასაცავად 5 წუთში გაშვება. Proxy-ის დაწყება, backend ჰოსტის დამატება, დაცვის გადამოწმება და უსაფრთხოების მოვლენების მონიტორინგი."
---

# სწრაფი დაწყება

ეს სახელმძღვანელო 5 წუთზე ნაკლებ დროში ნულიდან სრულად დაცულ ვებ-პროგრამამდე გგვიყვანს. ბოლოს PRX-WAF backend-ზე ტრაფიკს proxy-ს გახდება, გავრცელებულ შეტევებს ბლოკავს და უსაფრთხოების მოვლენებს ჟურნალავს.

::: tip წინაპირობები
Docker და Docker Compose ინსტალირებული გჭირდება. სხვა მეთოდებისთვის [ინსტალაციის სახელმძღვანელოს](./installation) ნახე.
:::

## ნაბიჯი 1: PRX-WAF-ის გაშვება

საცავის კლონირება და ყველა სერვისის გაშვება:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

ყველა კონტეინერის გაშვების გადამოწმება:

```bash
docker compose ps
```

მოსალოდნელი გამოტანა:

```
NAME         SERVICE     STATUS
prx-waf      prx-waf     running
postgres     postgres    running
```

## ნაბიჯი 2: ადმინ UI-ში შესვლა

გახსენი ბრაუზერი და გადადი `http://localhost:9527`-ზე. შედი ნაგულისხმევი სერთიფიკატებით:

- **მომხმარებლის სახელი:** `admin`
- **პაროლი:** `admin`

::: warning
ნაგულისხმევი პაროლი პირველი შესვლის შემდეგ დაუყოვნებლივ შეცვალე.
:::

## ნაბიჯი 3: Backend ჰოსტის დამატება

პირველი დაცული ჰოსტის ადმინ UI-ით ან API-ის გავლით დამატება:

**ადმინ UI-ის გავლით:**
1. გადადი **Hosts**-ზე sidebar-ში
2. დააჭირე **Add Host**
3. შეავსე:
   - **Host:** `example.com` (დასაცავი დომენი)
   - **Remote Host:** `192.168.1.100` (backend სერვერის IP)
   - **Remote Port:** `8080` (backend სერვერის პორტი)
   - **Guard Status:** Enabled
4. დააჭირე **Save**

**API-ის გავლით:**

```bash
# Obtain a JWT token
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# Add a host
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "192.168.1.100",
    "remote_port": 8080,
    "guard_status": true
  }'
```

## ნაბიჯი 4: დაცვის ტესტირება

ლეგიტიმური მოთხოვნის proxy-ის გავლით გაგზავნა:

```bash
curl -H "Host: example.com" http://localhost/
```

backend-ის ნორმალური პასუხი მიიღება. ახლა ტესტი, WAF SQL injection-ს ბლოკავს თუ არა:

```bash
curl -H "Host: example.com" "http://localhost/?id=1%20OR%201=1--"
```

მოსალოდნელი პასუხი: **403 Forbidden**

XSS-ის მცდელობის ტესტი:

```bash
curl -H "Host: example.com" "http://localhost/?q=<script>alert(1)</script>"
```

მოსალოდნელი პასუხი: **403 Forbidden**

path traversal-ის მცდელობის ტესტი:

```bash
curl -H "Host: example.com" "http://localhost/../../etc/passwd"
```

მოსალოდნელი პასუხი: **403 Forbidden**

## ნაბიჯი 5: უსაფრთხოების მოვლენების მონიტორინგი

ადმინ UI-ში დაბლოკილი შეტევების ნახვა:

1. გადადი **Security Events**-ზე sidebar-ში
2. 4-ე ნაბიჯის დაბლოკილი მოთხოვნები ჩანს
3. ყოველი მოვლენა შეტევის ტიპს, წყაროს IP-ს, შემჯამებელ წესს და timestamp-ს აჩვენებს

ან API-ის გავლით მოვლენების მიღება:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/security-events
```

```json
{
  "events": [
    {
      "id": 1,
      "host": "example.com",
      "source_ip": "172.18.0.1",
      "attack_type": "sqli",
      "rule_id": "CRS-942100",
      "action": "block",
      "timestamp": "2026-03-21T10:05:32Z"
    }
  ]
}
```

## ნაბიჯი 6: რეალურ დროში მონიტორინგის ჩართვა (სურვილისამებრ)

WebSocket endpoint-ზე live უსაფრთხოების მოვლენებთან დაკავშირება:

```bash
# Using websocat or similar WebSocket client
websocat ws://localhost:9527/ws/events
```

მოვლენები რეალურ დროში სტრიმდება შეტევების გამოვლენისა და ბლოკვის მიხედვით.

## რა გაქვს ახლა

ამ ნაბიჯების დასრულების შემდეგ გამართვა შეიცავს:

| კომპონენტი | სტატუსი |
|-----------|--------|
| Reverse proxy | 80/443 პორტზე მოსასმენელი |
| WAF ძრავა | 16-ფაზიანი გამოვლენის პაიფლაინი აქტიურია |
| ჩაშენებული წესები | OWASP CRS (310+ წესი) ჩართულია |
| ადმინ UI | 9527 პორტზე მუშაობს |
| PostgreSQL | კონფიგს, წესებსა და მოვლენებს ინახავს |
| რეალურ დროში მონიტორინგი | WebSocket მოვლენ-სტრიმი ხელმისაწვდომია |

## შემდეგი ნაბიჯები

- [წეს-ძრავა](../rules/) -- YAML წეს-ძრავის მუშაობის გაგება
- [YAML სინტაქსი](../rules/yaml-syntax) -- მომხმარებლის წესების წეს-სქემის შესწავლა
- [Reverse Proxy](../gateway/reverse-proxy) -- დატვირთვის განაწილებისა და upstream-ის მარშრუტიზების კონფიგურაცია
- [SSL/TLS](../gateway/ssl-tls) -- HTTPS-ის Let's Encrypt-ის ავტომატური სერთიფიკატებით ჩართვა
- [კონფიგურაციის ცნობარი](../configuration/reference) -- PRX-WAF-ის ყოველი ასპექტის დაზუსტება
