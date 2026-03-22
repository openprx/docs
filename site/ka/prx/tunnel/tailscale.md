---
title: Tailscale Funnel
description: PRX აგენტის ინტერნეტში გამოქვეყნება Tailscale Funnel-ით თქვენი Tailscale mesh ქსელის მეშვეობით.
---

# Tailscale Funnel

Tailscale Funnel საშუალებას გაძლევთ თქვენი ლოკალური PRX ინსტანცია საჯარო ინტერნეტში გამოაქვეყნოთ Tailscale-ის გადაცემის ინფრასტრუქტურის მეშვეობით. ტრადიციული გვირაბისგან განსხვავებით, რომელიც მესამე მხარის ზღვრულ ქსელს მოითხოვს, Funnel თქვენს არსებულ Tailscale mesh-ს იყენებს -- რაც შესანიშნავ არჩევანს წარმოადგენს, როდესაც თქვენი PRX კვანძები უკვე Tailscale-ით კომუნიცირებენ.

## მიმოხილვა

Tailscale ორ ურთიერთშემავსებელ ფუნქციას უზრუნველყოფს PRX კავშირისთვის:

| ფუნქცია | სფერო | გამოყენება |
|---------|-------|----------|
| **Tailscale Serve** | კერძო (მხოლოდ tailnet) | PRX-ის გამოქვეყნება თქვენი Tailscale ქსელის სხვა მოწყობილობებისთვის |
| **Tailscale Funnel** | საჯარო (ინტერნეტი) | PRX-ის გამოქვეყნება გარე webhook-ებისა და სერვისებისთვის |

PRX იყენებს Funnel-ს webhook შესვლისთვის და Serve-ს კვანძიდან კვანძზე კომუნიკაციისთვის tailnet-ის ფარგლებში.

### როგორ მუშაობს Funnel

```
გარე სერვისი (GitHub, Telegram და ა.შ.)
         │
         ▼ HTTPS
┌─────────────────────┐
│  Tailscale DERP Relay│
│  (Tailscale ინფრა)   │
└────────┬────────────┘
         │ WireGuard
┌────────▼────────────┐
│  tailscaled          │
│  (თქვენი მანქანა)    │
└────────┬────────────┘
         │ localhost
┌────────▼────────────┐
│  PRX გეითვეი         │
│  (127.0.0.1:8080)   │
└─────────────────────┘
```

ტრაფიკი მოდის თქვენი Tailscale MagicDNS ჰოსტნეიმზე (მაგ., `prx-host.tailnet-name.ts.net`), მარშრუტირდება Tailscale-ის DERP გადაცემის ქსელით WireGuard-ით და გადამისამართდება ლოკალურ PRX გეითვეიზე.

## წინაპირობები

1. Tailscale დაყენებული და ავთენტიფიცირებული PRX-ის გამშვებ მანქანაზე
2. Tailscale Funnel ჩართული თქვენი tailnet-ისთვის (მოითხოვს ადმინის დამტკიცებას)
3. მანქანის Tailscale კვანძს უნდა ჰქონდეს Funnel შესაძლებლობა ACL პოლიტიკაში

### Tailscale-ის დაყენება

```bash
# Debian / Ubuntu
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# ავთენტიფიკაცია
sudo tailscale up
```

### Funnel-ის ჩართვა ACL პოლიტიკაში

Funnel ცალსახად უნდა იყოს ნებადართული თქვენი tailnet-ის ACL პოლიტიკაში. დაამატეთ შემდეგი თქვენს Tailscale ACL ფაილში (ადმინის კონსოლით):

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

## კონფიგურაცია

### ბაზისური Funnel დაყენება

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
# Funnel სერვისს საჯარო ინტერნეტში გამოაქვეყნებს.
# false-ზე დაყენებისას Serve (მხოლოდ tailnet წვდომა) გამოიყენება.
funnel = true

# Funnel-ით გამოსაქვეყნებელი პორტი. Tailscale Funnel მხარს უჭერს
# პორტებს 443, 8443 და 10000.
port = 443
```

### მხოლოდ Tailnet (Serve) დაყენება

კერძო კვანძიდან კვანძზე კომუნიკაციისთვის საჯარო გამოქვეყნების გარეშე:

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
funnel = false
port = 443
```

## კონფიგურაციის მითითება

| პარამეტრი | ტიპი | ნაგულისხმევი | აღწერა |
|-----------|------|-------------|--------|
| `funnel` | boolean | `true` | `true` საჯარო Funnel-ისთვის, `false` მხოლოდ tailnet Serve-ისთვის |
| `port` | integer | `443` | საჯარო პორტი (Funnel მხარს უჭერს 443, 8443, 10000) |
| `tailscale_path` | string | `"tailscale"` | `tailscale` CLI ბინარის ბილიკი |
| `hostname` | string | ავტო-ამოცნობა | MagicDNS ჰოსტნეიმის გადაფარვა |
| `reset_on_stop` | boolean | `true` | Funnel/Serve კონფიგურაციის წაშლა PRX-ის შეჩერებისას |
| `background` | boolean | `true` | `tailscale serve`-ის ფონურ რეჟიმში გაშვება |

## როგორ მართავს PRX Tailscale-ს

გვირაბის დაწყებისას, PRX ასრულებს:

```bash
# Funnel-ისთვის (საჯარო)
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# Serve-ისთვის (კერძო)
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

`--bg` ფლაგი serve/funnel-ს ფონურ რეჟიმში უშვებს `tailscaled` დემონის ფარგლებში. PRX-ს შვილი პროცესის ცოცხლად შენარჩუნება არ სჭირდება -- `tailscaled` გადამისამართებას ამუშავებს.

PRX-ის შეჩერებისას, იგი ასუფთავებს:

```bash
tailscale funnel --https=443 off
# ან
tailscale serve --https=443 off
```

ეს ქცევა `reset_on_stop` პარამეტრით კონტროლირდება.

## საჯარო URL

Funnel-ის საჯარო URL MagicDNS შაბლონს მიჰყვება:

```
https://<machine-name>.<tailnet-name>.ts.net
```

## ჯანმრთელობის შემოწმებები

PRX Tailscale გვირაბს ორი შემოწმებით აკვირდება:

1. **Tailscale დემონის სტატუსი** -- `tailscale status --json` უნდა ანგარიშობდეს კვანძის დაკავშირებულობას
2. **Funnel-ის მისაწვდომობა** -- HTTP GET საჯარო URL-ზე უნდა დააბრუნოს 2xx პასუხი

ჯანმრთელობის შემოწმების წარუმატებლობისას, PRX ცდილობს Funnel-ის ხელახლა დამყარებას `tailscale funnel` ბრძანების ხელახლა გაშვებით.

## ACL გათვალისწინებები

Tailscale ACL-ები აკონტროლებს, რომელ მოწყობილობებს შეუძლიათ კომუნიკაცია და რომელებს -- Funnel-ის გამოყენება.

### Funnel-ის შეზღუდვა PRX კვანძებზე

მონიშნეთ თქვენი PRX მანქანები და შეზღუდეთ Funnel წვდომა:

```json
{
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  },
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ]
}
```

### კვანძიდან კვანძზე ტრაფიკის ნებართვა

განაწილებული PRX განთავსებისთვის, ნება დართეთ ტრაფიკს PRX კვანძებს შორის:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prx-agent"],
      "dst": ["tag:prx-agent:443"]
    }
  ]
}
```

## პრობლემების მოგვარება

| სიმპტომი | მიზეზი | გადაწყვეტა |
|----------|--------|-----------|
| "Funnel not available" | ACL პოლიტიკას funnel ატრიბუტი აკლია | დაამატეთ `funnel` ატრიბუტი კვანძზე ან მომხმარებელზე ACL-ში |
| "not connected" სტატუსი | `tailscaled` არ მუშაობს | Tailscale დემონის გაშვება: `sudo tailscale up` |
| სერტიფიკატის შეცდომა | DNS არ გავრცელებულა | დაელოდეთ MagicDNS-ის გავრცელებას (ჩვეულებრივ < 1 წუთი) |
| პორტი უკვე გამოიყენება | სხვა Serve/Funnel იმავე პორტზე | არსებულის წაშლა: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | PRX გეითვეი არ ისმენს | შეამოწმეთ `local_addr`-ის შესაბამისობა გეითვეის მოსმენის მისამართთან |

## დაკავშირებული გვერდები

- [გვირაბის მიმოხილვა](./)
- [Cloudflare გვირაბი](./cloudflare)
- [ngrok](./ngrok)
- [კვანძის დაწყვილება](/ka/prx/nodes/pairing)
- [უსაფრთხოების მიმოხილვა](/ka/prx/security/)
