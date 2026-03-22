---
title: მომხმარებლის წესები
description: "PRX-WAF-ისთვის მომხმარებლის გამოვლენის წესების დაწერა. ნაბიჯ-ნაბიჯ სახელმძღვანელო წვდომ-კონტროლის, ბოტ-ბლოკვის, rate limiting-ისა და პროგრამ-სპეციფიკური დაცვის მაგალითებით."
---

# მომხმარებლის წესები

PRX-WAF კონკრეტული პროგრამისთვის მომხმარებლის გამოვლენის წესების დაწერას ამარტივებს. მომხმარებლის წესები YAML-ში დაიწერება და `rules/custom/` დირექტორიაში მოიქცევა.

## დაწყება

1. ახალი YAML ფაილის შექმნა `rules/custom/`-ში:

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. [YAML წეს-სქემის](./yaml-syntax) მიხედვით ფაილის რედაქტირება.

3. განასახებამდე ვალიდაცია:

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. წესები ავტომატურად hot-reload ხდება, ან ხელით-reload-ის გამოძახება:

```bash
prx-waf rules reload
```

## მაგალითი: შიდა გზებზე წვდომის ბლოკვა

შიდა API endpoint-ებზე გარე წვდომის თავიდან აცილება:

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## მაგალითი: საეჭვო User-Agent-ების გამოვლენა

ავტომატიზირებული ხელსაწყოებიდან მოთხოვნების მონიტორინგისთვის ჟურნალირება:

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## მაგალითი: Query პარამეტრებით Rate Limiting

ზედმეტი query პარამეტრების მქონე მოთხოვნების ბლოკვა (DoS შეტევებში გავრცელებული):

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## მაგალითი: კონკრეტული ფაილ-გაფართოებების ბლოკვა

Backup-ისა ან კონფიგ-ფაილებზე წვდომის თავიდან აცილება:

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## მაგალითი: Credential Stuffing-ის გამოვლენა

სწრაფ-ცეცხლის შესვლ-მცდელობების გამოვლენა (ჩაშენებულ rate limiter-თან ერთად სასარგებლო):

```yaml
  - id: "CUSTOM-AUTH-001"
    name: "Log login endpoint access for monitoring"
    category: "access-control"
    severity: "low"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(api/)?(login|signin|authenticate|auth/token)"
    action: "log"
    tags: ["custom", "authentication", "monitoring"]
```

## მაგალითი: CVE ვირტუალური პაჩი

კონკრეტული დაუცველობისთვის სწრაფი ვირტუალური პაჩის შექმნა:

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## Rhai სკრიპტების გამოყენება რთული ლოგიკისთვის

შაბლონ-შემჯამებაზე მეტი მოთხოვნის მქონე წესებისთვის PRX-WAF ფაზა 12-ში Rhai სკრიპტინგს მხარს უჭერს:

```rhai
// rules/custom/scripts/geo-block.rhai
// Block requests from specific countries during maintenance
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
Rhai სკრიპტები sandbox-ის გარემოში სრულდება. მათ ფაილ-სისტემაზე, ქსელზე ან მოთხოვნ-კონტექსტის გარეთ სისტემ-რესურსებზე წვდომა არ შეუძლიათ.
:::

## საუკეთესო პრაქტიკები

1. **`action: log`-ით დაიწყე** -- ბლოკვამდე ჩართვამდე მცდარ-დადებითებს ადრე გამოვლენისთვის მონიტორინგი.

2. **სპეციფიკური regex-ის anchors-ების გამოყენება** -- ნაწილობრივ შემჯამებებისგან მიმდინარე მცდარ-დადებითებისთვის `^` და `$`-ის გამოყენება.

3. **შესაბამისი paranoia დონეების დაყენება** -- წესი ლეგიტიმური ტრაფიკის შემჯამების საშუალება თუ მისცემს, 1-ის ნაცვლად paranoia 2 ან 3-ად დაყენება ბლოკვის ნაცვლად.

4. **არა-ჩამჭერი ჯგუფების გამოყენება** -- სიცხადისა და შესრულებისთვის `(...)` ნაცვლად `(?:...)`-ის გამოყენება.

5. **აღწერითი ტეგების დამატება** -- ტეგები ადმინ UI-ში ჩნდება და უსაფრთხოების მოვლენების ფილტრაციაში ეხმარება.

6. **ცნობარ-URL-ების შეტანა** -- `reference` URL-ის დამატება შესაბამის CVE-ზე, OWASP-ის სტატიაზე ან შიდა დოკუმენტაციაზე.

7. **Regex-ის ტესტირება** -- განასახებამდე regex-შაბლონების ვალიდაცია:

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **განასახებამდე ვალიდაცია** -- ყოველთვის ვალიდატორის გაშვება:

```bash
python rules/tools/validate.py rules/custom/
```

## CLI-ის გავლით იმპორტი

CLI-ის გამოყენებით ფაილებიდან ან URL-ებიდან წესების იმპორტი:

```bash
# Import from a local file
prx-waf rules import /path/to/rules.yaml

# Import from a URL
prx-waf rules import https://example.com/rules/custom.yaml

# Validate a rule file
prx-waf rules validate /path/to/rules.yaml
```

## ModSecurity წესების იმპორტი

არსებული ModSecurity `.conf` წესების PRX-WAF-ის YAML ფორმატში გადაყვანა:

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
ModSecurity-ის კონვერტერი SecRule დირექტივების ბაზისურ ქვეჯგუფს (ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY) მხარს უჭერს. Chaining-ის ან Lua სკრიპტებიანი რთული ModSecurity წესები არ მხარდაჭერილია და ხელით ხელახლა-დაწერა სჭირდება.
:::

## შემდეგი ნაბიჯები

- [YAML სინტაქსი](./yaml-syntax) -- წეს-სქემის სრული ცნობარი
- [ჩაშენებული წესები](./builtin-rules) -- ახალი წესების დაწერამდე არსებულ წესებთან გაცნობა
- [წეს-ძრავის მიმოხილვა](./index) -- პაიფლაინში წეს-შეფასების გაგება
