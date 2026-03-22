---
title: Cloudflare გვირაბი
description: PRX-ის Cloudflare Tunnel-თან ინტეგრაცია ნულოვანი ნდობის შესვლისთვის cloudflared-ის გამოყენებით.
---

# Cloudflare გვირაბი

Cloudflare Tunnel (ყოფილი Argo Tunnel) ქმნის დაშიფრულ, მხოლოდ გამავალ კავშირს თქვენი PRX ინსტანციიდან Cloudflare-ის ზღვრულ ქსელამდე. საჯარო IP, ღია firewall პორტები ან პორტის გადამისამართება არ არის საჭირო. Cloudflare წყვეტს TLS-ს და ტრაფიკს ლოკალურ აგენტზე მარშრუტირებს გვირაბის მეშვეობით.

## მიმოხილვა

Cloudflare Tunnel არის რეკომენდებული ბექენდი PRX-ის პროდაქშენ განთავსებისთვის, რადგან უზრუნველყოფს:

- **ნულოვანი ნდობის წვდომა** -- ინტეგრაცია Cloudflare Access-თან, რათა მოითხოვოს იდენტობის ვერიფიკაცია აგენტთან მიღწევამდე
- **მორგებული დომენები** -- საკუთარი დომენის გამოყენება ავტომატური HTTPS სერტიფიკატებით
- **DDoS დაცვა** -- ტრაფიკი Cloudflare-ის ქსელზე გადის, რაც წყაროს იცავს
- **მაღალი საიმედოობა** -- Cloudflare ინარჩუნებს მრავალ ზღვრულ კავშირს სარეზერვოსთვის
- **უფასო დონე** -- Cloudflare Tunnels ხელმისაწვდომია უფასო გეგმაზე

## წინაპირობები

1. Cloudflare ანგარიში (უფასო დონე საკმარისია)
2. `cloudflared` CLI დაყენებული PRX-ის გამშვებ მანქანაზე
3. თქვენს Cloudflare ანგარიშზე დამატებული დომენი (სახელდებული გვირაბებისთვის)

### cloudflared-ის დაყენება

```bash
# Debian / Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# macOS
brew install cloudflared

# ბინარის ჩამოტვირთვა (ყველა პლატფორმა)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## კონფიგურაცია

### სწრაფი გვირაბი (დომენი არ არის საჭირო)

ყველაზე მარტივი დაყენება იყენებს Cloudflare-ის სწრაფ გვირაბს, რომელიც შემთხვევით `*.trycloudflare.com` ქვედომენს ანიჭებს. `cloudflared`-ის დაყენების გარდა Cloudflare ანგარიშის კონფიგურაცია არ არის საჭირო:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
# სწრაფი გვირაბის რეჟიმი: ტოკენის გარეშე, სახელდებული გვირაბის გარეშე.
# შემთხვევითი trycloudflare.com URL ენიჭება ყოველ გაშვებაზე.
mode = "quick"
```

სწრაფი გვირაბები იდეალურია დეველოპმენტისა და ტესტირებისთვის. URL ყოველ გადატვირთვაზე იცვლება, ამიტომ webhook რეგისტრაციების შესაბამისად განახლება დაგჭირდებათ.

### სახელდებული გვირაბი (მუდმივი დომენი)

პროდაქშენისთვის, გამოიყენეთ სახელდებული გვირაბი სტაბილური ჰოსტნეიმით:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
mode = "named"

# გვირაბის ტოკენი, მიღებული `cloudflared tunnel create`-დან.
# ასევე შეიძლება მითითდეს CLOUDFLARE_TUNNEL_TOKEN გარემოს ცვლადით.
token = "eyJhIjoiNjY..."

# საჯარო ჰოსტნეიმი, რომელიც ამ გვირაბზე მარშრუტირდება.
# უნდა იყოს კონფიგურირებული Cloudflare-ის დაშბორდში ან cloudflared CLI-ით.
hostname = "agent.example.com"
```

### სახელდებული გვირაბის შექმნა

```bash
# 1. cloudflared-ის ავთენტიფიკაცია Cloudflare ანგარიშით
cloudflared tunnel login

# 2. სახელდებული გვირაბის შექმნა
cloudflared tunnel create prx-agent
# გამოტანა: Created tunnel prx-agent with id <TUNNEL_ID>

# 3. DNS ჩანაწერის შექმნა გვირაბზე მიმართული
cloudflared tunnel route dns prx-agent agent.example.com

# 4. გვირაბის ტოკენის მიღება (config.toml-ისთვის)
cloudflared tunnel token prx-agent
# გამოტანა: eyJhIjoiNjY...
```

## კონფიგურაციის მითითება

| პარამეტრი | ტიპი | ნაგულისხმევი | აღწერა |
|-----------|------|-------------|--------|
| `mode` | string | `"quick"` | `"quick"` შემთხვევითი URL-ებისთვის, `"named"` მუდმივი ჰოსტნეიმებისთვის |
| `token` | string | -- | სახელდებული გვირაბის ტოკენი (სავალდებულო `mode = "named"`-ისთვის) |
| `hostname` | string | -- | საჯარო ჰოსტნეიმი სახელდებული გვირაბისთვის |
| `cloudflared_path` | string | `"cloudflared"` | `cloudflared` ბინარის ბილიკი |
| `protocol` | string | `"auto"` | ტრანსპორტის პროტოკოლი: `"auto"`, `"quic"`, `"http2"` |
| `edge_ip_version` | string | `"auto"` | IP ვერსია ზღვრული კავშირებისთვის: `"auto"`, `"4"`, `"6"` |
| `retries` | integer | `5` | კავშირის ხელახალი მცდელობების რაოდენობა უარის თქმამდე |
| `grace_period_secs` | integer | `30` | წამები აქტიური კავშირების დახურვამდე ლოდინის |
| `metrics_port` | integer | -- | დაყენებისას, `cloudflared` მეტრიკების გამოქვეყნება ამ პორტზე |
| `log_level` | string | `"info"` | `cloudflared` ლოგის დონე: `"debug"`, `"info"`, `"warn"`, `"error"` |

## ნულოვანი ნდობის წვდომა

Cloudflare Access ამატებს იდენტობის ფენას თქვენი გვირაბის წინ. მომხმარებლებმა უნდა გაიარონ ავთენტიფიკაცია (SSO-ით, ელ-ფოსტის OTP-ით ან სერვისის ტოკენებით) PRX ინსტანციამდე მიღწევამდე.

### წვდომის პოლიტიკების დაყენება

1. გადასვლა Cloudflare Zero Trust დაშბორდზე
2. Access Application-ის შექმნა თქვენი გვირაბის ჰოსტნეიმისთვის
3. Access Policy-ის დამატება სასურველი იდენტობის მოთხოვნებით

```
Cloudflare Access Policy მაგალითი:
  Application: agent.example.com
  Rule: Allow
  Include:
    - Email ends with: @yourcompany.com
    - Service Token: prx-webhook-token
```

სერვისის ტოკენები სასარგებლოა ავტომატიზებული webhook გამგზავნებისთვის (GitHub, Slack), რომლებიც ინტერაქტიულ ავთენტიფიკაციას ვერ ახორციელებენ. ტოკენი კონფიგურირეთ თქვენი webhook პროვაიდერის ჰედერებში:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

## ჯანმრთელობის შემოწმებები

PRX აკვირდება Cloudflare გვირაბის ჯანმრთელობას:

1. `cloudflared` შვილი პროცესის მუშაობის შემოწმება
2. HTTP GET-ის გაგზავნა საჯარო URL-ზე და 2xx პასუხის ვერიფიკაცია
3. `cloudflared` მეტრიკების პარსინგი (`metrics_port`-ის კონფიგურაციისას) კავშირის სტატუსისთვის

გვირაბის არაჯანსაღობისას, PRX ლოგავს გაფრთხილებას და ცდილობს `cloudflared`-ის გადატვირთვას. გადატვირთვა ექსპონენციური შეყოვნების სტრატეგიას მიჰყვება: 5წ, 10წ, 20წ, 40წ, მაქსიმუმ 5 წუთის ინტერვალამდე მცდელობებს შორის.

## ლოგები და გამართვა

`cloudflared`-ის stdout და stderr `TunnelProcess`-ის მიერ ფიქსირდება და PRX ლოგში `DEBUG` დონეზე იწერება. სიტყვიერების გასაზრდელად:

```toml
[tunnel.cloudflare]
log_level = "debug"
```

გავრცელებული ლოგ შეტყობინებები და მათი მნიშვნელობა:

| ლოგ შეტყობინება | მნიშვნელობა |
|---------------|-----------|
| `Connection registered` | გვირაბი დამყარდა Cloudflare-ის ზღვარზე |
| `Retrying connection` | ზღვრული კავშირი გაწყდა, ხელახლა დაკავშირების მცდელობა |
| `Serve tunnel error` | ფატალური შეცდომა, გვირაბი გადაიტვირთება |
| `Registered DNS record` | DNS მარშრუტი წარმატებით შეიქმნა |

## მაგალითი: სრული პროდაქშენ დაყენება

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"
health_check_interval_secs = 30
max_failures = 3

[tunnel.cloudflare]
mode = "named"
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.mycompany.com"
protocol = "quic"
retries = 5
grace_period_secs = 30
log_level = "info"
```

```bash
# ტოკენის მითითება გარემოს ცვლადით
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjY..."

# PRX-ის გაშვება -- გვირაბი ავტომატურად იწყება
prx start
```

## უსაფრთხოების შენიშვნები

- გვირაბის ტოკენი ანიჭებს სრულ წვდომას სახელდებულ გვირაბზე. შეინახეთ PRX-ის საიდუმლოებების მენეჯერში ან გადაეცით გარემოს ცვლადით. არასოდეს ჩაატანოთ ვერსიის კონტროლში.
- სწრაფი გვირაბები არ უჭერს მხარს Access პოლიტიკებს. გამოიყენეთ სახელდებული გვირაბები პროდაქშენისთვის.
- `cloudflared` შვილ პროცესად ეშვება PRX-ის იგივე მომხმარებლის ნებართვებით. განიხილეთ PRX-ის გაშვება მინიმალური პრივილეგიების მქონე გამოყოფილი სერვისის ანგარიშით.
- ყველა ტრაფიკი `cloudflared`-სა და Cloudflare-ის ზღვარს შორის დაშიფრულია TLS 1.3 ან QUIC-ით.

## დაკავშირებული გვერდები

- [გვირაბის მიმოხილვა](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [უსაფრთხოების მიმოხილვა](/ka/prx/security/)
- [საიდუმლოებების მართვა](/ka/prx/security/secrets)
