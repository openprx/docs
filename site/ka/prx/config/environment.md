---
title: გარემოს ცვლადები
description: PRX კონფიგურაციის გარემოს ცვლადები -- API გასაღებები, გზები და გაშვების დროის ჩანაცვლებები.
---

# გარემოს ცვლადები

PRX კითხულობს გარემოს ცვლადებს API გასაღებებისთვის, კონფიგურაციის გზებისთვის და გაშვების დროის ჩანაცვლებებისთვის. გარემოს ცვლადები უპირატესობას ანიჭებენ `config.toml`-ის მნიშვნელობებს უსაფრთხოებისთვის მგრძნობიარე ველებისთვის, როგორიცაა API გასაღებები.

## კონფიგურაციის გზები

| ცვლადი | ნაგულისხმევი | აღწერა |
|--------|-------------|--------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | კონფიგურაციის დირექტორიის ჩანაცვლება. PRX ეძებს `config.toml`-ს და `config.d/`-ს ამ დირექტორიის შიგნით |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | სამუშაო სივრცის დირექტორიის ჩანაცვლება (მეხსიერება, სესიები, მონაცემები) |

როდესაც `OPENPRX_CONFIG_DIR` დაყენებულია, ის უპირატესობას ანიჭებს `OPENPRX_WORKSPACE`-ს და აქტიური სამუშაო სივრცის მარკერს.

კონფიგურაციის დირექტორიის განსაზღვრის თანმიმდევრობა:

1. `OPENPRX_CONFIG_DIR` (უმაღლესი პრიორიტეტი)
2. `OPENPRX_WORKSPACE`
3. აქტიური სამუშაო სივრცის მარკერი (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (ნაგულისხმევი)

## პროვაიდერის API გასაღებები

ყველა პროვაიდერს აქვს გამოყოფილი გარემოს ცვლადი. PRX ჯერ ამათ ამოწმებს, სანამ `config.toml`-ის `api_key` ველზე გადავა.

### ძირითადი პროვაიდერები

| ცვლადი | პროვაიდერი |
|--------|-----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini (ალტერნატივა) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama (ჩვეულებრივ არ არის საჭირო) |
| `GLM_API_KEY` | Zhipu GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### OAuth ტოკენები

ზოგიერთი პროვაიდერი მხარს უჭერს OAuth ავთენტიფიკაციას API გასაღებების გარდა (ან ნაცვლად):

| ცვლადი | პროვაიდერი | აღწერა |
|--------|-----------|--------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | Claude Code OAuth ტოკენი |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | Claude Code წვდომის ტოკენი (ალტერნატივა) |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | Claude Code განახლების ტოკენი ავტომატური განახლებისთვის |
| `MINIMAX_OAUTH_TOKEN` | Minimax | Minimax OAuth წვდომის ტოკენი |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | Minimax OAuth განახლების ტოკენი |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | OAuth კლიენტის ID-ის ჩანაცვლება |
| `MINIMAX_OAUTH_REGION` | Minimax | OAuth რეგიონი (`global` ან `cn`) |
| `QWEN_OAUTH_TOKEN` | Qwen | Qwen OAuth წვდომის ტოკენი |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | Qwen OAuth განახლების ტოკენი |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | Qwen OAuth კლიენტის ID-ის ჩანაცვლება |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | Qwen OAuth რესურსის URL-ის ჩანაცვლება |

### თავსებადი / მესამე მხარის პროვაიდერები

| ცვლადი | პროვაიდერი |
|--------|-----------|
| `GROQ_API_KEY` | Groq |
| `MISTRAL_API_KEY` | Mistral |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `XAI_API_KEY` | xAI (Grok) |
| `TOGETHER_API_KEY` | Together AI |
| `FIREWORKS_API_KEY` | Fireworks AI |
| `PERPLEXITY_API_KEY` | Perplexity |
| `COHERE_API_KEY` | Cohere |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `VENICE_API_KEY` | Venice |
| `LLAMACPP_API_KEY` | llama.cpp სერვერი |
| `KIMI_CODE_API_KEY` | Kimi Code (Moonshot) |
| `QIANFAN_API_KEY` | Baidu Qianfan |
| `CLOUDFLARE_API_KEY` | Cloudflare AI |
| `VERCEL_API_KEY` | Vercel AI |

### სარეზერვო

| ცვლადი | აღწერა |
|--------|--------|
| `API_KEY` | ზოგადი სარეზერვო, რომელიც გამოიყენება, როდესაც პროვაიდერის სპეციფიკური ცვლადი არ არის დაყენებული |

## ინსტრუმენტებისა და არხების ცვლადები

| ცვლადი | აღწერა |
|--------|--------|
| `BRAVE_API_KEY` | Brave Search API გასაღები (`[web_search]`-ისთვის `provider = "brave"`-ით) |
| `GITHUB_TOKEN` | GitHub პირადი წვდომის ტოკენი (გამოიყენება უნარებისა და ინტეგრაციების მიერ) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud ADC ფაილის გზა (Gemini სერვისის ანგარიშის მეშვეობით) |

## გაშვების დროის ცვლადები

| ცვლადი | აღწერა |
|--------|--------|
| `OPENPRX_VERSION` | შეტყობინებული ვერსიის სტრიქონის ჩანაცვლება |
| `OPENPRX_AUTOSTART_CHANNELS` | დააყენეთ `"1"` არხის მსმენელების ჩატვირთვისას ავტომატურად დასაწყებად |
| `OPENPRX_EVOLUTION_CONFIG` | ევოლუციის კონფიგურაციის გზის ჩანაცვლება |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | ნედლი ევოლუციის debug ლოგირების ჩართვა |

## ცვლადების ჩანაცვლება კონფიგურაციაში

PRX **არ** აფართოებს ნატიურად `${VAR_NAME}` სინტაქსს `config.toml`-ის შიგნით. თუმცა, გარემოს ცვლადების ჩანაცვლება შეგიძლიათ შემდეგი მიდგომებით:

### 1. გამოიყენეთ გარემოს ცვლადები პირდაპირ

API გასაღებებისთვის PRX ავტომატურად ამოწმებს შესაბამის გარემოს ცვლადს. მათზე მითითება კონფიგურაციის ფაილში არ არის საჭირო:

```toml
# api_key არ არის საჭირო -- PRX ავტომატურად ამოწმებს ANTHROPIC_API_KEY-ს
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. გამოიყენეთ Shell-ის გამომტანი

შექმენით `config.toml` შაბლონიდან `envsubst`-ის ან მსგავსი ინსტრუმენტის გამოყენებით:

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. გამოიყენეთ გაყოფილი კონფიგურაცია საიდუმლოებებით

შეინახეთ საიდუმლოებები ცალკე ფაილში, რომელიც გენერირდება გარემოს ცვლადებიდან განთავსების დროს:

```bash
# საიდუმლოებების ფრაგმენტის გენერირება
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## `.env` ფაილის მხარდაჭერა

PRX ავტომატურად არ ჩატვირთავს `.env` ფაილებს. თუ `.env` ფაილის მხარდაჭერა გჭირდებათ, გამოიყენეთ ერთ-ერთი მიდგომა:

### systemd-ით

დაამატეთ `EnvironmentFile` თქვენს სერვისის ერთეულში:

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### Shell-ის გამომტანით

წაიკითხეთ `.env` ფაილი PRX-ის გაშვებამდე:

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### direnv-ით

თუ იყენებთ [direnv](https://direnv.net/)-ს, განათავსეთ `.envrc` ფაილი თქვენს სამუშაო დირექტორიაში:

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## უსაფრთხოების რეკომენდაციები

- **არასოდეს შეინახოთ API გასაღებები** ვერსიის კონტროლში. გამოიყენეთ გარემოს ცვლადები ან დაშიფრული საიდუმლოებები.
- PRX-ის `[secrets]` ქვესისტემა შიფრავს მგრძნობიარე ველებს `config.toml`-ში ChaCha20-Poly1305-ით. ჩართეთ `[secrets] encrypt = true`-ით (ნაგულისხმევად ჩართულია).
- PRX-თან მოწოდებული `.dockerignore` გამორიცხავს `.env` და `.env.*` ფაილებს კონტეინერის აგებიდან.
- აუდიტის ლოგები ავტომატურად ხაზავენ API გასაღებებსა და ტოკენებს.
- `OPENPRX_CONFIG_DIR`-ის გამოყენებისას გაზიარებულ დირექტორიაზე მითითებისთვის, უზრუნველყავით სათანადო ფაილის უფლებები (`chmod 600 config.toml`).
