---
title: DNS Proxy
description: "ლოკალური DNS proxy-ის გაშვება, რომელიც adblock ფილტრაციას, IOC დომენ feed-ებსა და მომხმარებლის blocklist-ებს ერთ resolver-ში ახვავებს სრული მოთხოვნა-ჟურნალირებით."
---

# DNS Proxy

`sd dns-proxy` ბრძანება ლოკალური DNS proxy სერვერს იწყებს, რომელიც DNS მოთხოვნებს ჩაჭრის და upstream resolver-ზე გადამისამართებამდე სამი ძრავის გავლით ფილტრავს:

1. **Adblock ძრავა** -- filter სიებიდან რეკლამებს, tracker-ებსა და მავნე დომენებს ბლოკავს
2. **IOC დომენ feed-ი** -- საფრთხის ინტელექტის კომპრომისის ინდიკატორებიდან დომენებს ბლოკავს
3. **მომხმარებლის DNS blocklist-ი** -- მომხმარებლის განსაზღვრული სიებიდან დომენებს ბლოკავს

ნებისმიერ ფილტრთან შემჯამებელი მოთხოვნები `0.0.0.0`-ით (NXDOMAIN) პასუხდება. ყველა სხვა მოთხოვნა კონფიგურირებულ upstream DNS სერვერზე გადაიგზავნება. ყოველი მოთხოვნა და მისი გადაჭრის სტატუსი JSONL ფაილში ჟურნალდება.

## სწრაფი დაწყება

```bash
# ნაგულისხმევი DNS proxy-ის გაშვება (listen 127.0.0.1:53, upstream 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
ნაგულისხმევად proxy 53-ე პორტს უსმენს, რაც root პრივილეგიებს საჭიროებს. არა-პრივილეგირებული ტესტირებისთვის `--listen 127.0.0.1:5353` მსგავსი მაღალი პორტის გამოყენება.
:::

## ბრძანების პარამეტრები

```bash
sd dns-proxy [OPTIONS]
```

| პარამეტრი | ნაგულისხმევი | აღწერა |
|--------|---------|-------------|
| `--listen` | `127.0.0.1:53` | მოსასმენი მისამართი და პორტი |
| `--upstream` | `8.8.8.8:53` | არა-დაბლოკილი მოთხოვნების გადასამისამართებელი upstream DNS სერვერი |
| `--log-path` | `/tmp/prx-sd-dns.log` | JSONL მოთხოვნა-ჟურნალ-ფაილის გზა |

## გამოყენების მაგალითები

### საბაზისო გამოყენება

ნაგულისხმევ მისამართზე Google DNS-ის upstream-ით proxy-ის გაშვება:

```bash
sudo sd dns-proxy
```

გამოტანა:

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### მომხმარებლის Listen მისამართი და Upstream

Cloudflare DNS-ის upstream-ით და მომხმარებლის პორტზე:

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### მომხმარებლის ჟურნალ-გზა

კონკრეტულ ადგილმდებარეობაზე მოთხოვნა-ჟურნალების ჩაწერა:

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### Adblock-თან კომბინირება

DNS proxy ავტომატურად `~/.prx-sd/adblock/`-დან adblock filter სიებს ტვირთავს. საუკეთესო გადაფარვისთვის:

```bash
# ნაბიჯი 1: adblock სიების ჩართვა და სინქრონიზება
sudo sd adblock enable
sd adblock sync

# ნაბიჯი 2: DNS proxy-ის გაშვება (adblock წესებს ავტომატურად იღებს)
sudo sd dns-proxy
```

Proxy `sd adblock`-ის მიერ გამოყენებულ ქეშ-filter სიებს კითხულობს. `sd adblock add`-ით დამატებული ნებისმიერი სია proxy-ის გადაშვების შემდეგ ავტომატურად ხელმისაწვდომია.

## სისტემის Proxy-ის გამოყენებისთვის კონფიგურაცია

### Linux (systemd-resolved)

`/etc/systemd/resolved.conf`-ის რედაქტირება:

```ini
[Resolve]
DNS=127.0.0.1
```

შემდეგ გადაშვება:

```bash
sudo systemctl restart systemd-resolved
```

### Linux (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

გასაუქმებლად:

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
ყველა DNS ტრაფიკის ლოკალური proxy-ისკენ გადამისამართება ნიშნავს, რომ proxy-ის გაჩერებისას DNS გადაჭრა ორიგინალ პარამეტრების აღდგენამდე ან proxy-ის გადაშვებამდე ვერ მოხდება.
:::

## ჟურნალ-ფორმატი

DNS proxy კონფიგურირებულ ჟურნალ-გზაზე JSONL-ს (სტრიქონზე ერთი JSON ობიექტი) წერს. ყოველი ჩანაწერი შეიცავს:

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| ველი | აღწერა |
|-------|-------------|
| `timestamp` | მოთხოვნის ISO 8601 timestamp |
| `query` | მოთხოვნილი დომენ-სახელი |
| `type` | DNS ჩანაწერის ტიპი (A, AAAA, CNAME და სხვ.) |
| `action` | `blocked` ან `forwarded` |
| `filter` | შემჯამებელი ფილტრი: `adblock`, `ioc`, `blocklist` ან `null` |
| `upstream_ms` | upstream DNS-ის round-trip დრო (null დაბლოკვისას) |

## არქიტექტურა

```
Client DNS Query (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> blocked? --> respond 0.0.0.0
  |  2. IOC domains  |---> blocked? --> respond 0.0.0.0
  |  3. DNS blocklist |---> blocked? --> respond 0.0.0.0
  |                  |
  |  Not blocked:    |
  |  Forward to      |---> upstream DNS (e.g. 8.8.8.8)
  |  upstream         |<--- response
  |                  |
  |  Log to JSONL    |
  +------------------+
        |
        v
  Client receives response
```

## სერვისად გაშვება

DNS proxy-ის მდგრადი systemd სერვისად გასაშვებად:

```bash
# systemd unit ფაილის შექმნა
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ჩართვა და გაშვება
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
სრულად მართული ფონური გამოცდილებისთვის სამაგიეროდ `sd daemon`-ის გამოყენება, რომელიც რეალურ დროში ფაილ-მონიტორინგს, სიგნატურების ავტომატური განახლებებს ახვავებს და DNS proxy ფუნქციონალობის ჩართვით გაფართოებასაც შეიძლება.
:::

## შემდეგი ნაბიჯები

- ყოვლისმომცველი დომენ-ბლოკვისთვის [Adblock filter სიების](./adblock) კონფიგურაცია
- DNS ფილტრაციასთან ერთად ფაილ-სისტემის დასაცავად [რეალურ დროში მონიტორინგის](../realtime/) დაყენება
- proxy-სთან დაკავშირებული პარამეტრებისთვის [კონფიგურაციის ცნობარის](../configuration/reference) გადახედვა
