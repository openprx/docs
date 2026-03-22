---
title: REST API მიმოხილვა
description: "OpenPR სამუშაო სივრცეების, პროექტების, issue-ების, მმართველობისა და სხვის მართვის ყოვლისმომცველ REST API-ს გვაძლევს. Rust-ისა და Axum-ის გამოყენებით."
---

# REST API მიმოხილვა

OpenPR პლატფორმ-ყველა ფუნქციაზე პროგრამული წვდომისთვის **Rust**-ისა და **Axum**-ის გამოყენებით RESTful API-ს გვაძლევს. API JSON-მოთხოვნა-პასუხ-ფორმატებსა და JWT-დაფუძნებულ ავთენტიფიკაციას მხარს უჭერს.

## Base URL

```
http://localhost:8080/api
```

წარმოებ-განასახებებში reverse proxy-ის (Caddy/Nginx) მიღმა API ჩვეულებრივ frontend URL-ის გავლით proxied.

## პასუხ-ფორმატი

API-ის ყველა პასუხი თანმიმდევრულ JSON-სტრუქტურას მიჰყვება:

### წარმატება

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### შეცდომა

```json
{
  "code": 400,
  "message": "Detailed error description"
}
```

გავრცელებული შეცდომ-კოდები:

| კოდი | მნიშვნელობა |
|------|---------|
| 400 | ცუდი მოთხოვნა (ვალიდ-შეცდომა) |
| 401 | ავტ-გარეშე (ტოკენი არარსებობს ან არასწორია) |
| 403 | Forbidden (არასაკმარისი ნებართვები) |
| 404 | ვერ მოიძებნა |
| 500 | შიდა სერვერ-შეცდომა |

## API-კატეგორიები

| კატეგორია | Base Path | აღწერა |
|----------|-----------|-------------|
| [ავთენტიფიკაცია](./authentication) | `/api/auth/*` | რეგისტრაცია, შესვლა, ტოკენ-განახლება |
| პროექტები | `/api/workspaces/*/projects/*` | CRUD, წევრები, პარამეტრები |
| Issue-ები | `/api/projects/*/issues/*` | CRUD, მინიჭება, ეტიკეტი, კომენტარი |
| Board | `/api/projects/*/board` | Kanban-დაფ-სტატუსი |
| Sprint-ები | `/api/projects/*/sprints/*` | Sprint-CRUD და დაგეგმვა |
| ეტიკეტები | `/api/labels/*` | ეტიკეტ-CRUD |
| ძებნა | `/api/search` | სრული-ტექსტ-ძებნა |
| წინადადებები | `/api/proposals/*` | შექმნა, ხმ-მიცემა, წარდგენა, არქივაცია |
| მმართველობა | `/api/governance/*` | კონფ-ი, აუდიტ-ლოგები |
| გადაწყვეტილებები | `/api/decisions/*` | გადაწყვეტილებ-ჩანაწერები |
| ნდობ-ქულები | `/api/trust-scores/*` | ქულები, ისტორია, გასაჩივრებები |
| ვეტო | `/api/veto/*` | ვეტო, ესკალაცია |
| AI-აგენტები | `/api/projects/*/ai-agents/*` | აგენტ-მართვა |
| AI-ამოცანები | `/api/projects/*/ai-tasks/*` | ამოცან-მინიჭება |
| ბოტ-ტოკენები | `/api/workspaces/*/bots` | ბოტ-ტოკენ-CRUD |
| ფაილ-ატვირთვა | `/api/v1/upload` | Multipart ფაილ-ატვირთვა |
| Webhook-ები | `/api/workspaces/*/webhooks/*` | Webhook-CRUD |
| ადმინი | `/api/admin/*` | სისტემ-მართვა |

სრული API ცნობარისთვის იხ. [Endpoint-ების ცნობარი](./endpoints).

## Content Type

ყველა POST/PUT/PATCH მოთხოვნა `Content-Type: application/json`-ს იყენებს, ფაილ-ატვირთვების გარდა, რომლებიც `multipart/form-data`-ს იყენებს.

## გვერდ-დანაწილება

List-endpoint-ები გვერდ-დანაწილებას მხარს უჭერს:

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## სრული-ტექსტ-ძებნა

Search-endpoint PostgreSQL სრული-ტექსტ-ძებნას issue-ებში, კომენტარებსა და წინადადებებში იყენებს:

```bash
curl "http://localhost:8080/api/search?q=authentication+bug" \
  -H "Authorization: Bearer <token>"
```

## ჯანმრთელობ-შემოწმება

API სერვერი ჯანმრთელობ-endpoint-ს გამოაქვს, ავთენტ-საჭიროების გარეშე:

```bash
curl http://localhost:8080/health
```

## შემდეგი ნაბიჯები

- [ავთენტიფიკაცია](./authentication) -- JWT-ავთენტიფიკაცია და ბოტ-ტოკენები
- [Endpoint-ების ცნობარი](./endpoints) -- სრული endpoint-დოკ
- [MCP სერვერი](../mcp-server/) -- AI-მოსახერხებელი ინტერფეისი 34 ინსტრუმენტით
