---
title: AWS Bedrock
description: AWS Bedrock-ის კონფიგურაცია PRX-ში LLM პროვაიდერად
---

# AWS Bedrock

> ფუნდამენტურ მოდელებზე (Claude, Titan, Llama, Mistral და სხვები) წვდომა AWS Bedrock-ის Converse API-ით SigV4 ავტენტიფიკაციით, მშობლიური ინსტრუმენტების გამოძახებითა და პრომპტ ქეშირებით.

## წინაპირობები

- AWS ანგარიში Bedrock მოდელებზე წვდომის ჩართვით
- AWS ავტორიზაციის მონაცემები (Access Key ID + Secret Access Key) `bedrock:InvokeModel` ნებართვით

## სწრაფი დაყენება

### 1. მოდელზე წვდომის ჩართვა

1. გახსენით [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. გადახვიდეთ **Model access** განყოფილებაში მარცხენა გვერდითა პანელზე
3. მოითხოვეთ წვდომა სასურველ მოდელებზე (მაგ., Anthropic Claude, Meta Llama)

### 2. AWS ავტორიზაციის მონაცემების კონფიგურაცია

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # არასავალდებულო, ნაგულისხმევი us-east-1
```

### 3. PRX-ის კონფიგურაცია

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. შემოწმება

```bash
prx doctor models
```

## ხელმისაწვდომი მოდელები

მოდელის ID-ები Bedrock ფორმატს მიჰყვება `<პროვაიდერი>.<მოდელი>-<ვერსია>`:

| მოდელის ID | პროვაიდერი | კონტექსტი | ვიზუალი | ინსტრუმენტები | შენიშვნები |
|----------|----------|---------|--------|----------|-------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | დიახ | დიახ | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | დიახ | დიახ | უახლესი Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | დიახ | დიახ | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | დიახ | დიახ | სწრაფი Claude მოდელი |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | არა | დიახ | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | არა | დიახ | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | არა | არა | Amazon Titan |

შეამოწმეთ [AWS Bedrock დოკუმენტაცია](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) თქვენს რეგიონში ხელმისაწვდომი მოდელების სრული სიისთვის.

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `model` | string | სავალდებულო | Bedrock მოდელის ID (მაგ., `anthropic.claude-sonnet-4-6`) |

ავტენტიფიკაცია მთლიანად AWS გარემოს ცვლადებით ხორციელდება:

| გარემოს ცვლადი | სავალდებულო | აღწერა |
|---------------------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | დიახ | AWS წვდომის გასაღების ID |
| `AWS_SECRET_ACCESS_KEY` | დიახ | AWS საიდუმლო წვდომის გასაღები |
| `AWS_SESSION_TOKEN` | არა | დროებითი სესიის ტოკენი (მინიჭებული როლებისთვის) |
| `AWS_REGION` | არა | AWS რეგიონი (ნაგულისხმევი: `us-east-1`) |
| `AWS_DEFAULT_REGION` | არა | სარეზერვო რეგიონი, თუ `AWS_REGION` დაყენებული არ არის |

## ფუნქციები

### ნულოვანი დამოკიდებულების SigV4 ხელმოწერა

PRX AWS SigV4 მოთხოვნის ხელმოწერას მხოლოდ `hmac` და `sha2` crate-ების გამოყენებით ახორციელებს, AWS SDK-ზე დამოკიდებულების გარეშე. ეს ბინარულ ფაილს პატარას ინარჩუნებს და SDK ვერსიების კონფლიქტებს თავიდან აიცილებს. ხელმოწერა მოიცავს:

- HMAC-SHA256 გასაღების წარმოების ჯაჭვს
- კანონიკური მოთხოვნის კონსტრუქციას დახარისხებული ჰედერებით
- `x-amz-security-token` მხარდაჭერას დროებითი ავტორიზაციის მონაცემებისთვის

### Converse API

PRX იყენებს Bedrock-ის Converse API-ს (არა მოძველებულ InvokeModel API-ს), რომელიც უზრუნველყოფს:
- ერთიან შეტყობინების ფორმატს ყველა მოდელის პროვაიდერზე
- სტრუქტურირებულ ინსტრუმენტების გამოძახებას `toolUse` და `toolResult` ბლოკებით
- სისტემური პრომპტის მხარდაჭერას
- თანმიმდევრული პასუხის ფორმატს

### მშობლიური ინსტრუმენტების გამოძახება

ინსტრუმენტები Bedrock-ის მშობლიურ `toolConfig` ფორმატში იგზავნება `toolSpec` განსაზღვრებებით, რომლებიც მოიცავს `name`, `description` და `inputSchema`. ინსტრუმენტის შედეგები შეფუთულია როგორც `toolResult` კონტენტ ბლოკები `user` შეტყობინებებში.

### პრომპტ ქეშირება

PRX Bedrock-ის პრომპტ ქეშირების ევრისტიკას იყენებს (Anthropic პროვაიდერის იგივე ზღვრულ მნიშვნელობებით):
- 3 KB-ზე მეტი სისტემური პრომპტები `cachePoint` ბლოკს იღებს
- 4-ზე მეტი არა-სისტემური შეტყობინების მქონე საუბრებში ბოლო შეტყობინება `cachePoint`-ით არის მონიშნული

### URL კოდირება მოდელის ID-ებისთვის

ორწერტილების შემცველი Bedrock მოდელის ID-ები (მაგ., `v1:0`) სპეციალურ დამუშავებას მოითხოვს. PRX:
- ნედლ ორწერტილებს HTTP URL-ში აგზავნის (როგორც reqwest აკეთებს)
- ორწერტილებს `%3A`-ით კოდირებს კანონიკურ URI-ში SigV4 ხელმოწერისთვის
- ეს ორმაგი მიდგომა HTTP მარშრუტიზაციისა და ხელმოწერის ვერიფიკაციის წარმატებას უზრუნველყოფს

## პროვაიდერის მეტსახელები

შემდეგი სახელები Bedrock პროვაიდერზე მიუთითებს:

- `bedrock`
- `aws-bedrock`

## პრობლემების მოგვარება

### "AWS Bedrock credentials not set"

დარწმუნდით, რომ `AWS_ACCESS_KEY_ID` და `AWS_SECRET_ACCESS_KEY` ორივე გარემოს ცვლადებად არის დაყენებული. PRX არ კითხულობს `~/.aws/credentials`-ს ან `~/.aws/config`-ს.

### 403 AccessDeniedException

გავრცელებული მიზეზები:
- IAM მომხმარებელს/როლს არ აქვს `bedrock:InvokeModel` ნებართვა
- Bedrock კონსოლში მოდელზე წვდომა არ მოგითხოვიათ
- მოდელი ხელმისაწვდომი არ არის თქვენს კონფიგურირებულ რეგიონში

### SignatureDoesNotMatch

ეს ჩვეულებრივ საათის გადახრას მიანიშნებს. დარწმუნდით, რომ თქვენი სისტემის საათი სინქრონიზებულია:
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```

### მოდელი რეგიონში ხელმისაწვდომი არ არის

ყველა მოდელი ყველა რეგიონში ხელმისაწვდომი არ არის. შეამოწმეთ [Bedrock მოდელების ხელმისაწვდომობის მატრიცა](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) და შესაბამისად შეცვალეთ `AWS_REGION`.

### დროებითი ავტორიზაციის მონაცემების გამოყენება (STS)

თუ AWS STS-ს (მინიჭებული როლები, SSO) იყენებთ, დააყენეთ სამივე ცვლადი:
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

სესიის ტოკენი ავტომატურად შედის SigV4 ხელმოწერაში როგორც `x-amz-security-token` ჰედერი.
