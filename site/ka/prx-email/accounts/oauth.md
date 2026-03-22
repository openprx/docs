---
title: OAuth ავთენტიფიკაცია
description: "PRX-Email-ისთვის OAuth 2.0 XOAUTH2 ავთენტიფიკაციის კონფიგურაცია Gmail-სა და Outlook-თთან: ტოკენის lifecycle მართვა, refresh პროვაიდერები და hot-reload."
---

# OAuth ავთენტიფიკაცია

PRX-Email OAuth 2.0 ავთენტიფიკაციას XOAUTH2 მეკანიზმის მეშვეობით IMAP-ისა და SMTP-ისთვის მხარს უჭერს. ეს Outlook/Office 365-ისთვის სავალდებულოა და Gmail-ისთვის სასურველია. Plugin-ი ტოკენის ვადის გასვლის თვალყურს, pluggable refresh პროვაიდერებს და გარემო-ზე დაფუძნებულ hot-reload-ს უზრუნველყოფს.

## XOAUTH2-ის მოქმედების პრინციპი

XOAUTH2 ტრადიციულ პაროლის ავთენტიფიკაციას OAuth access token-ით ცვლის. კლიენტი სპეციალურ ფორმატირებულ სტრინგს აგზავნის IMAP AUTHENTICATE ან SMTP AUTH-ის დროს:

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

PRX-Email ამას ავტომატურად ამუშავებს, როდესაც `auth.oauth_token` დაყენებულია.

## Gmail OAuth კონფიგურაცია

### 1. Google Cloud სერთიფიკატების შექმნა

1. გადადით [Google Cloud Console](https://console.cloud.google.com/)-ზე
2. შექმენით პროექტი ან აირჩიეთ არსებული
3. ჩართეთ Gmail API
4. შექმენით OAuth 2.0 სერთიფიკატები (Desktop application ტიპი)
5. დაიმახსოვრეთ **Client ID** და **Client Secret**

### 2. Access Token-ის მიღება

გამოიყენეთ Google-ის OAuth playground ან საკუთარი OAuth flow access token-ის მისაღებად შემდეგი scopes-ებით:

- `https://mail.google.com/` (სრული IMAP/SMTP წვდომა)

### 3. PRX-Email-ის კონფიგურაცია

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Outlook OAuth კონფიგურაცია

PRX-Email Outlook/Office 365 OAuth-ისთვის bootstrap სკრიპტს მოიცავს, რომელიც ავტორიზაციის კოდის სრულ flow-ს ამუშავებს.

### 1. Azure App-ის რეგისტრაცია

1. გადადით [Azure Portal App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)-ზე
2. დარეგისტრირეთ ახალი აპლიკაცია
3. დააყენეთ redirect URI (მაგ., `http://localhost:53682/callback`)
4. დაიმახსოვრეთ **Application (client) ID** და **Directory (tenant) ID**
5. API Permissions-ში დაამატეთ:
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. Bootstrap სკრიპტის გაშვება

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

სკრიპტი:
1. ავტორიზაციის URL-ს დაბეჭდავს -- გახსენით ბრაუზერში
2. callback URL-ის ან ავტორიზაციის კოდის ჩასვას დაელოდება
3. კოდს access და refresh token-ებად გაცვლის
4. Token-ებს `./outlook_oauth.local.env`-ში `chmod 600`-ით შეინახავს

### სკრიპტის პარამეტრები

| ფლაგი | აღწერა |
|-------|--------|
| `--output <file>` | Custom output path (ნაგულისხმევი: `./outlook_oauth.local.env`) |
| `--dry-run` | ავტორიზაციის URL-ის დაბეჭდვა და გამოსვლა |
| `-h`, `--help` | გამოყენების ინფორმაციის ჩვენება |

### გარემოს ცვლადები

| ცვლადი | სავალდებულო | აღწერა |
|--------|-------------|--------|
| `CLIENT_ID` | დიახ | Azure-ის აპლიკაციის client ID |
| `TENANT` | დიახ | Tenant ID ან `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | დიახ | Azure app-ში რეგისტრირებული redirect URI |
| `SCOPE` | არა | Custom scopes (ნაგულისხმევი: IMAP + SMTP + offline_access) |

::: warning უსაფრთხოება
გენერირებული token ფაილი არასოდეს commit-ოთ. დაამატეთ `*.local.env` თქვენს `.gitignore`-ს.
:::

### 3. Token-ების ჩატვირთვა

Bootstrap სკრიპტის მიერ token-ების გენერირების შემდეგ, source-ი env ფაილი და კონფიგურირეთ PRX-Email:

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## ტოკენის Lifecycle მართვა

### ვადის გასვლის თვალყური

PRX-Email OAuth token-ების ვადის გასვლის timestamp-ებს პროტოკოლის (IMAP/SMTP) მიხედვით თვალს ადევნებს:

```rust
// Set expiry via environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

ყოველი ოპერაციის წინ plugin-ი ამოწმებს, ეწურება თუ არა token 60 წამში. თუ ეწურება, განახლების მცდელობა ხდება.

### Pluggable Refresh Provider

განახორციელეთ `OAuthRefreshProvider` trait ავტომატური ტოკენის განახლებისთვის:

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // Call your OAuth provider's token endpoint
        // Return the new access token and optional expiry
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

პროვაიდერის plugin-ის შექმნისას მიმაგრება:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### გარემოდან Hot-Reload

OAuth token-ების runtime-ში გადატვირთვა გადატვირთვის გარეშე:

```rust
// Set new tokens in environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// Trigger reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

`reload_auth_from_env` მეთოდი მოცემული პრეფიქსის გარემოს ცვლადებს კითხულობს და IMAP/SMTP OAuth token-ებსა და ვადის გასვლის timestamp-ებს განაახლებს. OAuth token-ის ჩატვირთვისას შესაბამისი პაროლი გაიწმინდება ორი-ავთენტიფიკაცია-ერთ-ერთის ინვარიანტის შესანარჩუნებლად.

### სრული კონფიგურაციის Reload

ტრანსპორტის სრული რეკონფიგურაციისთვის:

```rust
plugin.reload_config(new_transport_config)?;
```

ეს ახალ კონფიგს ვალიდაციას გაუწევს და ტრანსპორტის მთლიანი კონფიგურაციას ატომურად შეცვლის.

## OAuth გარემოს ცვლადები

| ცვლადი | აღწერა |
|--------|--------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth access token |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth access token |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP token-ის ვადის გასვლა (Unix წამები) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP token-ის ვადის გასვლა (Unix წამები) |

პრეფიქსი `reload_auth_from_env()`-ს გადაეცემა. PRX-Email-ის ნაგულისხმევი კონფიგურაციისთვის გამოიყენეთ `PRX_EMAIL` პრეფიქსად.

## უსაფრთხოების საუკეთესო პრაქტიკა

1. **Token-ები არასოდეს დალოგოთ.** PRX-Email debug შეტყობინებებს სანიტაციას უწევს და ავტორიზაციასთან დაკავშირებულ კონტენტს ასახავს.
2. **გამოიყენეთ refresh token-ები.** Access token-ები ვადასრულდება; სამუშაო გამოყენებისთვის ყოველთვის განახორციელეთ refresh provider.
3. **Token-ები უსაფრთხოდ შეინახეთ.** გამოიყენეთ ფაილის ნებართვები (`chmod 600`) და token ფაილები version control-ში არასოდეს commit-ოთ.
4. **Token-ები რეგულარულად განაახლეთ.** ავტომატური განახლების მიუხედავად, პერიოდულად გადაამოწმეთ token-ების rotation.

## შემდეგი ნაბიჯები

- [ანგარიშის მართვა](./index) -- ანგარიშებისა და ფუნქციის ნიშნების მართვა
- [კონფიგურაციის ცნობარი](../configuration/) -- ყველა გარემოს ცვლადი და პარამეტრი
- [პრობლემების მოგვარება](../troubleshooting/) -- OAuth-თან დაკავშირებული შეცდომების მოგვარება
