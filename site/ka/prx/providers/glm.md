---
title: GLM (Zhipu AI)
description: GLM-ისა და მასთან დაკავშირებული ჩინური AI პროვაიდერების (Minimax, Moonshot, Qwen, Z.AI) კონფიგურაცია PRX-ში
---

# GLM (Zhipu AI)

> Zhipu GLM მოდელებზე და ჩინური AI პროვაიდერების ოჯახზე წვდომა ერთიანი კონფიგურაციით. მოიცავს მეტსახელებს Minimax-ისთვის, Moonshot-ისთვის (Kimi), Qwen-ისთვის (DashScope) და Z.AI-სთვის.

## წინაპირობები

- Zhipu AI API გასაღები [open.bigmodel.cn](https://open.bigmodel.cn/)-დან (GLM მოდელებისთვის), **ან**
- API გასაღებები იმ კონკრეტული პროვაიდერისთვის, რომლის გამოყენებაც გსურთ (Minimax, Moonshot, Qwen და სხვ.)

## სწრაფი დაყენება

### 1. API გასაღების მიღება

1. დარეგისტრირდით [open.bigmodel.cn](https://open.bigmodel.cn/)-ზე
2. გადახვიდეთ API Keys განყოფილებაში
3. შექმენით ახალი გასაღები (ფორმატი: `id.secret`)

### 2. კონფიგურაცია

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

ან დააყენეთ გარემოს ცვლადი:

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. შემოწმება

```bash
prx doctor models
```

## ხელმისაწვდომი მოდელები

### GLM მოდელები

| მოდელი | კონტექსტი | ვიზუალი | ინსტრუმენტები | შენიშვნები |
|-------|---------|--------|----------|-------|
| `glm-4-plus` | 128K | დიახ | დიახ | ყველაზე შეძლებული GLM მოდელი |
| `glm-4` | 128K | დიახ | დიახ | სტანდარტული GLM-4 |
| `glm-4-flash` | 128K | დიახ | დიახ | სწრაფი და ეკონომიური |
| `glm-4v` | 128K | დიახ | დიახ | ვიზუალისთვის ოპტიმიზებული |

### მეტსახელებით მითითებული პროვაიდერები

PRX ასევე მხარს უჭერს ამ პროვაიდერებს მეტსახელებით, რომლებიც OpenAI-თავსებადი ინტერფეისის გავლით მუშაობენ:

| პროვაიდერი | მეტსახელები | საბაზისო URL | ძირითადი მოდელები |
|----------|-------------|----------|------------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1` (საერთაშ.), `api.minimaxi.com/v1` (ჩინეთი) | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1` (საერთაშ.), `api.moonshot.cn/v1` (ჩინეთი) | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com` (ჩინეთი), `dashscope-intl.aliyuncs.com` (საერთაშ.) | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4` (გლობალური), `open.bigmodel.cn/api/coding/paas/v4` (ჩინეთი) | Z.AI კოდინგის მოდელები |

## კონფიგურაციის მითითება

### GLM (მშობლიური პროვაიდერი)

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `api_key` | string | სავალდებულო | GLM API გასაღები `id.secret` ფორმატში |
| `model` | string | სავალდებულო | GLM მოდელის სახელი |

### მეტსახელებით მითითებული პროვაიდერები (OpenAI-თავსებადი)

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `api_key` | string | სავალდებულო | პროვაიდერის სპეციფიკური API გასაღები |
| `api_url` | string | ავტომატურად ამოცნობილი | ნაგულისხმევი საბაზისო URL-ის გადაფარვა |
| `model` | string | სავალდებულო | მოდელის სახელი |

## ფუნქციები

### JWT ავტენტიფიკაცია

GLM JWT-ზე დაფუძნებულ ავტენტიფიკაციას იყენებს უბრალო API გასაღებების ნაცვლად. PRX ავტომატურად:

1. ჰყოფს API გასაღებს `id` და `secret` კომპონენტებად
2. წარმოქმნის JWT ტოკენს:
   - ჰედერი: `{"alg":"HS256","typ":"JWT","sign_type":"SIGN"}`
   - პეილოადი: `{"api_key":"<id>","exp":<expiry_ms>,"timestamp":<now_ms>}`
   - ხელმოწერა: HMAC-SHA256 საიდუმლო გასაღებით
3. ქეშირებს JWT-ს 3 წუთით (ტოკენის ვადა 3.5 წუთში იწურება)
4. აგზავნის როგორც `Authorization: Bearer <jwt>`

### რეგიონული ენდფოინთები

მეტსახელებით მითითებული პროვაიდერების უმეტესობა საერთაშორისო და ჩინეთის კონტინენტურ ენდფოინთებს სთავაზობს:

```toml
# საერთაშორისო (ნაგულისხმევი უმეტესისთვის)
provider = "moonshot-intl"

# ჩინეთის კონტინენტი
provider = "moonshot-cn"

# ექსპლიციტური რეგიონული ვარიანტები
provider = "qwen-us"      # აშშ რეგიონი
provider = "qwen-intl"    # საერთაშორისო
provider = "qwen-cn"      # ჩინეთის კონტინენტი
```

### Minimax OAuth მხარდაჭერა

Minimax მხარს უჭერს OAuth ტოკენის ავტენტიფიკაციას:

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

დააყენეთ `provider = "minimax-oauth"` ან `provider = "minimax-oauth-cn"` OAuth-ის გამოსაყენებლად API გასაღების ავტენტიფიკაციის ნაცვლად.

### Qwen OAuth და კოდინგის რეჟიმები

Qwen დამატებით წვდომის რეჟიმებს სთავაზობს:

- **Qwen OAuth**: `provider = "qwen-oauth"` ან `provider = "qwen-code"` OAuth-ზე დაფუძნებული წვდომისთვის
- **Qwen Coding**: `provider = "qwen-coding"` ან `provider = "dashscope-coding"` კოდინგისთვის სპეციალიზებული API ენდფოინთისთვის

## პროვაიდერის მეტსახელების მითითება

| მეტსახელი | მიუთითებს | ენდფოინთი |
|-------|-------------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM (გლობალური) | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM (ჩინეთი) | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax (საერთაშ.) | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax (ჩინეთი) | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot (ჩინეთი) | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot (საერთაშ.) | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen (ჩინეთი) | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen (საერთაშ.) | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen (აშშ) | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI (გლობალური) | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI (ჩინეთი) | `open.bigmodel.cn/api/coding/paas/v4` |

## პრობლემების მოგვარება

### "GLM API key not set or invalid format"

GLM API გასაღები `id.secret` ფორმატში უნდა იყოს (ზუსტად ერთ წერტილს შეიცავს). შეამოწმეთ თქვენი გასაღების ფორმატი:
```
abc123.secretXYZ  # სწორი
abc123secretXYZ   # არასწორი - წერტილი აკლია
```

### JWT წარმოქმნა ვერ ხერხდება

დარწმუნდით, რომ თქვენი სისტემის საათი ზუსტია. JWT ტოკენები მოიცავს დროის ნიშნულს და 3.5 წუთის შემდეგ ვადა ეწურება.

### MiniMax "role: system" უარყოფილია

MiniMax არ იღებს `role: system` შეტყობინებებს. PRX ავტომატურად აერთიანებს სისტემური შეტყობინების კონტენტს პირველ მომხმარებლის შეტყობინებაში MiniMax პროვაიდერების გამოყენებისას.

### Qwen/DashScope-ის დროის ამოწურვა

Qwen-ის DashScope API მოითხოვს HTTP/1.1-ს (არა HTTP/2-ს). PRX ავტომატურად აიძულებს HTTP/1.1-ს DashScope ენდფოინთებისთვის. თუ დროის ამოწურვას განიცდით, დარწმუნდით, რომ თქვენი ქსელი HTTP/1.1 კავშირებს იძლევა.

### რეგიონული ენდფოინთის შეცდომები

თუ კავშირის შეცდომებს იღებთ, სცადეთ რეგიონულ ენდფოინთებს შორის გადართვა:
- ჩინეთის მომხმარებლები: გამოიყენეთ `*-cn` ვარიანტები
- საერთაშორისო მომხმარებლები: გამოიყენეთ `*-intl` ან საბაზისო ვარიანტები
- აშშ-ში მყოფი მომხმარებლები: სცადეთ `qwen-us` Qwen-ისთვის
