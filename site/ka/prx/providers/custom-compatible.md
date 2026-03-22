---
title: მორგებული თავსებადი
description: ნებისმიერი OpenAI-თავსებადი API ენდფოინთის კონფიგურაცია PRX-ში LLM პროვაიდერად
---

# მორგებული თავსებადი

> PRX-ის დაკავშირება ნებისმიერ LLM API-სთან, რომელიც OpenAI Chat Completions ფორმატს მიჰყვება. მუშაობს LiteLLM-ით, vLLM-ით, Groq-ით, Mistral-ით, xAI-ით, Venice-ით, Vercel AI-ით, Cloudflare AI-ით, HuggingFace Inference-ით და ნებისმიერი სხვა OpenAI-თავსებადი სერვისით.

## წინაპირობები

- გაშვებული LLM API, რომელიც OpenAI Chat Completions ფორმატს ახორციელებს (`/v1/chat/completions` ან `/chat/completions`)
- API გასაღები (თუ სერვისი მოითხოვს)

## სწრაფი დაყენება

### 1. თქვენი ენდფოინთის იდენტიფიკაცია

განსაზღვრეთ თქვენი API-ის საბაზისო URL და ავტენტიფიკაციის მეთოდი. მაგალითად:

- Groq: `https://api.groq.com/openai/v1`
- Mistral: `https://api.mistral.ai/v1`
- xAI: `https://api.x.ai/v1`
- ლოკალური vLLM: `http://localhost:8000/v1`
- LiteLLM პროქსი: `http://localhost:4000`

### 2. კონფიგურაცია

```toml
[default]
provider = "compatible"
model = "your-model-name"

[providers.compatible]
api_key = "${YOUR_API_KEY}"
api_url = "https://api.your-provider.com/v1"
```

### 3. შემოწმება

```bash
prx doctor models
```

## ჩაშენებული თავსებადი პროვაიდერები

PRX მოიცავს წინასწარ კონფიგურირებულ მეტსახელებს პოპულარული OpenAI-თავსებადი სერვისებისთვის:

| პროვაიდერის სახელი | მეტსახელები | საბაზისო URL | ავტენტიფიკაციის სტილი |
|--------------|---------|----------|------------|
| Venice | `venice` | `https://api.venice.ai` | Bearer |
| Vercel AI | `vercel`, `vercel-ai` | `https://api.vercel.ai` | Bearer |
| Cloudflare AI | `cloudflare`, `cloudflare-ai` | `https://gateway.ai.cloudflare.com/v1` | Bearer |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Bearer |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Bearer |
| xAI | `xai`, `grok` | `https://api.x.ai/v1` | Bearer |
| Qianfan | `qianfan`, `baidu` | `https://aip.baidubce.com` | Bearer |
| Synthetic | `synthetic` | `https://api.synthetic.com` | Bearer |
| OpenCode Zen | `opencode`, `opencode-zen` | `https://opencode.ai/zen/v1` | Bearer |
| LiteLLM | `litellm`, `lite-llm` | კონფიგურირებადი | Bearer |
| vLLM | `vllm`, `v-llm` | კონფიგურირებადი | Bearer |
| HuggingFace | `huggingface`, `hf` | კონფიგურირებადი | Bearer |

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `api_key` | string | არასავალდებულო | API ავტენტიფიკაციის გასაღები |
| `api_url` | string | სავალდებულო | API ენდფოინთის საბაზისო URL |
| `model` | string | სავალდებულო | მოდელის სახელი/ID |
| `auth_style` | string | `"bearer"` | ავტენტიფიკაციის ჰედერის სტილი (იხილეთ ქვემოთ) |

### ავტენტიფიკაციის სტილები

| სტილი | ჰედერის ფორმატი | გამოყენება |
|-------|---------------|-------|
| `bearer` | `Authorization: Bearer <key>` | უმეტესი პროვაიდერები (ნაგულისხმევი) |
| `x-api-key` | `x-api-key: <key>` | ზოგიერთი ჩინური პროვაიდერი |
| `custom` | მორგებული ჰედერის სახელი | სპეციალური შემთხვევები |

## ფუნქციები

### ენდფოინთის ავტომატური ამოცნობა

PRX ავტომატურად ამატებს `/chat/completions`-ს თქვენს საბაზისო URL-ს. ენდფოინთის ბილიკის ჩართვა არ გჭირდებათ:

```toml
# სწორი - PRX ამატებს /chat/completions
api_url = "https://api.groq.com/openai/v1"

# ასევე სწორი - ექსპლიციტური ბილიკი მუშაობს
api_url = "https://api.groq.com/openai/v1/chat/completions"
```

### Responses API სარეზერვო ვარიანტი

პროვაიდერებისთვის, რომლებიც OpenAI-ის უფრო ახალ Responses API-ს უჭერენ მხარს, PRX-ს შეუძლია `/v1/responses`-ზე გადავიდეს, როცა `/v1/chat/completions` 404-ს აბრუნებს. ეს ნაგულისხმევად ჩართულია, მაგრამ შეიძლება გამოირთოს პროვაიდერებისთვის, რომლებიც მას არ უჭერენ მხარს (მაგ., GLM/Zhipu).

### მშობლიური ინსტრუმენტების გამოძახება

ინსტრუმენტები OpenAI-ის სტანდარტულ ფუნქციების გამოძახების ფორმატში იგზავნება:

```json
{
  "type": "function",
  "function": {
    "name": "tool_name",
    "description": "Tool description",
    "parameters": { "type": "object", "properties": {...} }
  }
}
```

პროვაიდერი მხარს უჭერს `tool_choice: "auto"`-ს და სწორად დესერიალიზებს სტრუქტურირებულ `tool_calls` პასუხებს.

### ვიზუალის მხარდაჭერა

ვიზუალის შესაძლებლობის მქონე მოდელებისთვის, შეტყობინებებში `[IMAGE:data:image/png;base64,...]` მარკერებით ჩაშენებული სურათები ავტომატურად გარდაიქმნება OpenAI ვიზუალის ფორმატში `image_url` კონტენტ ბლოკებით.

### ნაკადის მხარდაჭერა

თავსებადი პროვაიდერი მხარს უჭერს SSE ნაკადს ტოკენების რეალურ დროში მიწოდებისთვის. ნაკადის მოვლენები ინკრემენტულად იპარსება შემდეგი მხარდაჭერით:
- `delta.content` ტექსტის ფრაგმენტები
- `delta.tool_calls` ინკრემენტული ინსტრუმენტის გამოძახების აგებისთვის
- `[DONE]` მარკერის ამოცნობა
- დროის ამოწურვის მეგობრული დამუშავება

### სისტემური შეტყობინებების გაერთიანება

ზოგიერთი პროვაიდერი (მაგ., MiniMax) უარყოფს `role: system` შეტყობინებებს. PRX-ს შეუძლია ავტომატურად გააერთიანოს სისტემური შეტყობინების კონტენტი პირველ მომხმარებლის შეტყობინებაში. ეს ნაგულისხმევად ჩართულია ცნობილი არათავსებადი პროვაიდერებისთვის.

### HTTP/1.1 იძულებითი რეჟიმი

ზოგიერთი პროვაიდერი (კერძოდ, DashScope/Qwen) მოითხოვს HTTP/1.1-ს HTTP/2-ის ნაცვლად. PRX ავტომატურად ამოიცნობს ამ ენდფოინთებს და აიძულებს HTTP/1.1-ს კავშირის სანდოობისთვის.

### მსჯელობის კონტენტის სარეზერვო ვარიანტი

მსჯელობის მოდელებისთვის, რომლებიც გამოსავალს `reasoning_content`-ში აბრუნებენ `content`-ის ნაცვლად, PRX ავტომატურად გადადის მსჯელობის ტექსტის ამოღებაზე.

## გაფართოებული კონფიგურაცია

### ლოკალური LLM სერვერი (vLLM, llama.cpp და სხვ.)

```toml
[default]
provider = "compatible"
model = "meta-llama/Llama-3.1-8B-Instruct"

[providers.compatible]
api_url = "http://localhost:8000/v1"
# ლოკალური სერვერებისთვის api_key არ არის საჭირო
```

### LiteLLM პროქსი

```toml
[default]
provider = "litellm"
model = "gpt-4o"

[providers.litellm]
api_key = "${LITELLM_API_KEY}"
api_url = "http://localhost:4000"
```

### მრავალი მორგებული პროვაიდერი

გამოიყენეთ მოდელის როუტერი მრავალი თავსებადი პროვაიდერის კონფიგურაციისთვის:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[[model_routes]]
pattern = "groq/*"
provider = "compatible"
api_url = "https://api.groq.com/openai/v1"
api_key = "${GROQ_API_KEY}"

[[model_routes]]
pattern = "mistral/*"
provider = "compatible"
api_url = "https://api.mistral.ai/v1"
api_key = "${MISTRAL_API_KEY}"
```

## პრობლემების მოგვარება

### კავშირი უარყოფილია

დარწმუნდით, რომ API ენდფოინთი მისაწვდომია:
```bash
curl -v https://api.your-provider.com/v1/models
```

### 401 Unauthorized

- დარწმუნდით, რომ თქვენი API გასაღები სწორია
- შეამოწმეთ, შეესაბამება თუ არა ავტენტიფიკაციის სტილი თქვენს პროვაიდერს (Bearer vs x-api-key)
- ზოგიერთი პროვაიდერი დამატებით ჰედერებს მოითხოვს; გამოიყენეთ დასახელებული პროვაიდერის მეტსახელი, თუ ხელმისაწვდომია

### "role: system" უარყოფილია

თუ თქვენი პროვაიდერი სისტემურ შეტყობინებებს არ უჭერს მხარს, PRX ეს ცნობილი პროვაიდერებისთვის ავტომატურად უნდა დაამუშავოს. მორგებული ენდფოინთებისთვის ეს პროვაიდერის შეზღუდვაა. გამოსავალი: ჩართეთ სისტემური ინსტრუქციები პირველ მომხმარებლის შეტყობინებაში.

### ნაკადი არ მუშაობს

ყველა OpenAI-თავსებადი API არ უჭერს მხარს ნაკადს. თუ ნაკადი ვერ ხერხდება, PRX ავტომატურად გადადის არა-ნაკადურ რეჟიმზე.

### მოდელი ვერ მოიძებნა

შეამოწმეთ ზუსტი მოდელის სახელი/ID, რომელსაც თქვენი პროვაიდერი მოითხოვს. სხვადასხვა პროვაიდერი სხვადასხვა სახელთა კონვენციას იყენებს:
- Groq: `llama-3.3-70b-versatile`
- Mistral: `mistral-large-latest`
- xAI: `grok-2`

სწორი მოდელის იდენტიფიკატორებისთვის შეამოწმეთ თქვენი პროვაიდერის დოკუმენტაცია.
