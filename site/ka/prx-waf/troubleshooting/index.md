---
title: პრობლემების მოგვარება
description: "PRX-WAF-ის გავრცელებული პრობლემების გადაწყვეტა: მონაცემ-ბაზ-კავშირი, წეს-ჩატვირთვა, ყალბ-დადებითები, cluster-სინქრონიზაცია, SSL სერთიფიკატები და შესრულების გამართვა."
---

# პრობლემების მოგვარება

ეს გვერდი PRX-WAF-ის მუშაობისას შეხვედრილ ყველაზე გავრცელებულ პრობლემებს, მათ მიზეზებსა და გადაწყვეტებს მოიცავს.

## მონაცემ-ბაზ-კავშირი ვერ ხერხდება

**სიმპტომები:** PRX-WAF ვერ იწყება "connection refused" ან "authentication failed" შეცდომებით.

**გადაწყვეტები:**

1. **PostgreSQL-ის მუშაობის გადამოწმება:**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **კავშირ-ტესტი:**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. **კავშირ-სტრინგის შემოწმება** TOML კონფ-ფაილში:

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. **მიგრაციების გაშვება** მონაცემ-ბაზ-არსებობისას, მაგრამ ცხრილ-არარსებობის შემთხვევაში:

```bash
prx-waf -c configs/default.toml migrate
```

## წესები არ იტვირთება

**სიმპტომები:** PRX-WAF იწყება, მაგრამ წესები აქტიური არ არის. შეტევები არ გამოვლინდება.

**გადაწყვეტები:**

1. **წეს-სტატისტიკის შემოწმება:**

```bash
prx-waf rules stats
```

გამოსავლენი 0 წეს-ს აჩვენებს -- წეს-დირექტორია შეიძლება ცარიელი ან არასწორად კონფიგურირებული იყოს.

2. **წეს-დირექტორიის გზის გადამოწმება** კონფ-ფაილში:

```toml
[rules]
dir = "rules/"
```

3. **წეს-ფაილების ვალიდაცია:**

```bash
python rules/tools/validate.py rules/
```

4. **YAML სინტაქს-შეცდომების შემოწმება** -- ერთი დეფექტური ფაილი ყველა წეს-ჩატვირთვას შეიძლება ხელს უშლიდეს:

```bash
# Validate one file at a time to find the problem
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **ჩაშენებული წეს-ების ჩართვის გადამოწმება:**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Hot-Reload არ მუშაობს

**სიმპტომები:** წეს-ფაილები შეიცვალა, მაგრამ ცვლილებები ძალაში არ შევიდა.

**გადაწყვეტები:**

1. **Hot-reload-ის ჩართვის გადამოწმება:**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **ხელით გადატვირთვის გამოძახება:**

```bash
prx-waf rules reload
```

3. **SIGHUP-ის გაგზავნა:**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **ფაილ-სისტემ-ყურების ლიმიტის შემოწმება** (Linux):

```bash
cat /proc/sys/fs/inotify/max_user_watches
# If too low, increase:
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## ყალბ-დადებითები

**სიმპტომები:** ლეგიტიმური მოთხოვნები იბლოკება (403 Forbidden).

**გადაწყვეტები:**

1. **დამბლოკავი წეს-ის გამოვლენა** უსაფრთხოების მოვლენებიდან:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

მოვლენაში `rule_id` ველის ძებნა.

2. **კონკრეტული წეს-ის გამორთვა:**

```bash
prx-waf rules disable CRS-942100
```

3. **პარანოიის დონის შემცირება.** პარანოიის 2+ დონეზე მუშაობისას 1-ზე დაწევა:

```toml
# In your rules config, only load paranoia level 1 rules
```

4. **წეს-ის log-რეჟიმზე გადართვა** ბლოკვის ნაცვლად მონიტორინგისთვის:

წეს-ფაილის რედაქტირება და `action: "block"`-ის `action: "log"`-ად შეცვლა, შემდეგ გადატვირთვა:

```bash
prx-waf rules reload
```

5. **IP allowlist-ის დამატება** სანდო წყაროებისთვის:

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
ახალი წეს-ების განასახებისას ჯერ `action: log` გამოიყენე ყალბ-დადებითების სამონიტოროდ, შემდეგ `action: block`-ზე გადართვამდე.
:::

## SSL სერთიფიკატ-პრობლემები

**სიმპტომები:** HTTPS კავშირები ვერ ხდება, სერთიფიკატ-შეცდომები ან Let's Encrypt-განახლება ვერ ხდება.

**გადაწყვეტები:**

1. **სერთიფიკატ-სტატუსის შემოწმება** ადმინ UI-ის **SSL Certificates** სექციაში.

2. **80-ე პორტის ინტერნეტიდან ხელმისაწვდომობის გადამოწმება** ACME HTTP-01 challenge-ებისთვის.

3. **სერთიფიკატ-გზების შემოწმება** ხელით სერთიფიკატების გამოყენებისას:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **სერთიფიკატ-დომენ-შესაბამისობის გადამოწმება:**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## Cluster კვანძები ვერ უკავშირდება

**სიმპტომები:** სამუშაო კვანძები cluster-ს ვერ შეუერთდება. სტატუსი "disconnected" peer-ებს აჩვენებს.

**გადაწყვეტები:**

1. **ქსელ-კავშირის გადამოწმება** cluster-პორტზე (ნაგულისხმევი: UDP 16851):

```bash
# From worker to main
nc -zuv node-a 16851
```

2. **Firewall-წეს-ების შემოწმება** -- cluster-კომუნიკაცია UDP-ს იყენებს:

```bash
sudo ufw allow 16851/udp
```

3. **სერთიფიკატების გადამოწმება** -- ყველა კვანძი ერთი CA-ით ხელმოწერილ სერთიფიკატებს უნდა იყენებდეს:

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. **Seed-კონფიგურაციის შემოწმება** სამუშაო კვანძებზე:

```toml
[cluster]
seeds = ["node-a:16851"]   # Must resolve to the main node
```

5. **ლოგ-ების გადახედვა** debug-სიხშირით:

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## მაღალი მეხსიერება-მოხმარება

**სიმპტომები:** PRX-WAF-ის პროცესი მოსალოდნელზე მეტ მეხსიერებას მოიხმარს.

**გადაწყვეტები:**

1. **პასუხ-ქეშ-ზომის შემცირება:**

```toml
[cache]
max_size_mb = 128    # Reduce from default 256
```

2. **მონაცემ-ბაზ-კავშირ-პულის შემცირება:**

```toml
[storage]
max_connections = 10   # Reduce from default 20
```

3. **სამუშაო ნაკადების შემცირება:**

```toml
[proxy]
worker_threads = 2    # Reduce from CPU count
```

4. **მეხსიერება-მოხმარების მონიტორინგი:**

```bash
ps aux | grep prx-waf
```

## CrowdSec კავშირ-პრობლემები

**სიმპტომები:** CrowdSec ინტეგრაცია "disconnected"-ს აჩვენებს ან გადაწყვეტილებები არ იტვირთება.

**გადაწყვეტები:**

1. **LAPI-კავშირ-ტესტი:**

```bash
prx-waf crowdsec test
```

2. **API გასაღების გადამოწმება:**

```bash
# On the CrowdSec machine
cscli bouncers list
```

3. **LAPI URL-ის შემოწმება:**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. **უსაფრთხო fallback-ქმედების დაყენება** LAPI-მიუწვდომლობისათვის:

```toml
[crowdsec]
fallback_action = "log"    # Don't block when LAPI is down
```

## შესრულების გამართვა

### ნელი პასუხ-დრო

1. **პასუხ-ქეშ-ის ჩართვა:**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **სამუშაო ნაკადების გაზრდა:**

```toml
[proxy]
worker_threads = 8
```

3. **მონაცემ-ბაზ-კავშირების გაზრდა:**

```toml
[storage]
max_connections = 50
```

### მაღალი CPU-მოხმარება

1. **აქტიური წეს-ების რაოდენობის შემცირება.** 3-4 პარანოიის-დონის წეს-ების გამორთვა საჭიროების არარსებობის შემთხვევაში.

2. **გამოუყენებელი გამოვლენ-ფაზების გამორთვა.** მაგალითად, CrowdSec-ის გამოუყენებლობისას:

```toml
[crowdsec]
enabled = false
```

## დახმარების მიღება

ზემოთ მოყვანილი გადაწყვეტები პრობლემის ვერ მოგვარების შემთხვევაში:

1. **არსებული პრობლემების შემოწმება:** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. **ახალი პრობლემის შეტანა** შემდეგით:
   - PRX-WAF ვერსია
   - ოპერაციული სისტემა და ბირთვ-ვერსია
   - კონფ-ფაილი (პაროლ-გასაუქმებლად)
   - შესაბამისი ლოგ-გამოსავალი
   - გამეორების ნაბიჯები

## შემდეგი ნაბიჯები

- [კონფ-ცნობარი](../configuration/reference) -- ყველა პარამეტრის გამართვა
- [წეს-ძრავა](../rules/) -- წეს-შეფასების გაგება
- [Cluster-ის რეჟიმი](../cluster/) -- cluster-სპეციფიკური პრობლემ-მოგვარება
