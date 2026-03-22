---
title: API Endpoint-ების ცნობარი
description: OpenPR-ის ყველა REST API endpoint-ის სრული ცნობარი ავთენტიფიკაციის, პროექტების, issue-ების, მმართველობის, AI-ისა და ადმინ-ოპერაციების ჩათვლით.
---

# API Endpoint-ების ცნობარი

ეს გვერდი OpenPR-ის ყველა REST API endpoint-ის სრულ ცნობარს გვაძლევს. ყველა endpoint-ს ავთენტიფიკაცია სჭირდება, თუ სხვა მითითებული არ არის.

## ავთენტიფიკაცია

| მეთოდი | Endpoint | აღწერა | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | ახალი ანგარიშის შექმნა | არა |
| POST | `/api/auth/login` | შესვლა და ტოკენ-მიღება | არა |
| POST | `/api/auth/refresh` | Access ტოკენ-განახლება | არა |
| GET | `/api/auth/me` | მიმდინარე მომხმარებლ-ინფოს მიღება | დიახ |

## სამუშაო სივრცეები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/workspaces` | მომხმარებლ-სამუშაო სივრცეების ჩამოთვლა |
| POST | `/api/workspaces` | სამუშაო სივრცის შექმნა |
| GET | `/api/workspaces/:id` | სამუშაო სივრც-დეტალების მიღება |
| PUT | `/api/workspaces/:id` | სამუშაო სივრცის განახლება |
| DELETE | `/api/workspaces/:id` | სამუშაო სივრცის წაშლა (მხოლოდ owner) |

## სამუშაო სივრც-წევრები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/members` | წევრების ჩამოთვლა |
| POST | `/api/workspaces/:id/members` | წევრის დამატება |
| PUT | `/api/workspaces/:id/members/:user_id` | წევრ-როლის განახლება |
| DELETE | `/api/workspaces/:id/members/:user_id` | წევრის ამოღება |

## ბოტ-ტოკენები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/bots` | ბოტ-ტოკენების ჩამოთვლა |
| POST | `/api/workspaces/:id/bots` | ბოტ-ტოკენის შექმნა |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | ბოტ-ტოკენის წაშლა |

## პროექტები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/workspaces/:ws_id/projects` | პროექტების ჩამოთვლა |
| POST | `/api/workspaces/:ws_id/projects` | პროექტის შექმნა |
| GET | `/api/workspaces/:ws_id/projects/:id` | რაოდენობ-მქონე პროექტ-მიღება |
| PUT | `/api/workspaces/:ws_id/projects/:id` | პროექტის განახლება |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | პროექტის წაშლა |

## Issue-ები (Work Item-ები)

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/projects/:id/issues` | issue-ების ჩამოთვლა (გვერდ-დანაწ., ფილტრები) |
| POST | `/api/projects/:id/issues` | issue-ს შექმნა |
| GET | `/api/issues/:id` | UUID-ის გავლით issue-ს მიღება |
| PATCH | `/api/issues/:id` | issue-ველების განახლება |
| DELETE | `/api/issues/:id` | issue-ს წაშლა |

### Issue-ველები (შექმნა/განახლება)

```json
{
  "title": "string (required on create)",
  "description": "string (markdown)",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "ISO 8601 datetime"
}
```

## Board

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/projects/:id/board` | Kanban-დაფ-სტატუსის მიღება |

## კომენტარები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/issues/:id/comments` | issue-ს კომენტარების ჩამოთვლა |
| POST | `/api/issues/:id/comments` | კომენტარის შექმნა |
| DELETE | `/api/comments/:id` | კომენტარის წაშლა |

## ეტიკეტები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/labels` | ყველა სამუშაო სივრც-ეტიკეტის ჩამოთვლა |
| POST | `/api/labels` | ეტიკეტის შექმნა |
| PUT | `/api/labels/:id` | ეტიკეტის განახლება |
| DELETE | `/api/labels/:id` | ეტიკეტის წაშლა |
| POST | `/api/issues/:id/labels` | issue-ზე ეტიკეტ-დამატება |
| DELETE | `/api/issues/:id/labels/:label_id` | issue-დან ეტიკეტ-ამოღება |

## Sprint-ები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/projects/:id/sprints` | sprint-ების ჩამოთვლა |
| POST | `/api/projects/:id/sprints` | sprint-ის შექმნა |
| PUT | `/api/sprints/:id` | sprint-ის განახლება |
| DELETE | `/api/sprints/:id` | sprint-ის წაშლა |

## წინადადებები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/proposals` | წინადადებების ჩამოთვლა |
| POST | `/api/proposals` | წინადადების შექმნა |
| GET | `/api/proposals/:id` | წინადადებ-დეტალების მიღება |
| POST | `/api/proposals/:id/vote` | ხმის მიცემა |
| POST | `/api/proposals/:id/submit` | ხმ-მიცემისთვის წარდგენა |
| POST | `/api/proposals/:id/archive` | წინადადებ-არქივაცია |

## მმართველობა

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/governance/config` | მმართველობ-კონფ-მიღება |
| PUT | `/api/governance/config` | მმართველობ-კონფ-განახლება |
| GET | `/api/governance/audit-logs` | მმართველობ-აუდიტ-ლოგების ჩამოთვლა |

## გადაწყვეტილებები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/decisions` | გადაწყვეტილებების ჩამოთვლა |
| GET | `/api/decisions/:id` | გადაწყვეტ-დეტალების მიღება |

## ნდობ-ქულები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/trust-scores` | ნდობ-ქულების ჩამოთვლა |
| GET | `/api/trust-scores/:user_id` | მომხმარებლ-ნდობ-ქულ-მიღება |
| GET | `/api/trust-scores/:user_id/history` | ქულ-ისტ-მიღება |
| POST | `/api/trust-scores/:user_id/appeals` | გასაჩივრების შეტანა |

## ვეტო

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/veto` | ვეტო-მოვლენების ჩამოთვლა |
| POST | `/api/veto` | ვეტოს შექმნა |
| POST | `/api/veto/:id/escalate` | ვეტოს ესკალაცია |

## AI-აგენტები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/projects/:id/ai-agents` | AI-აგენტების ჩამოთვლა |
| POST | `/api/projects/:id/ai-agents` | AI-აგენტ-რეგისტრაცია |
| GET | `/api/projects/:id/ai-agents/:agent_id` | აგენტ-დეტ-მიღება |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | აგენტ-განახლება |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | აგენტ-ამოღება |

## AI-ამოცანები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/projects/:id/ai-tasks` | AI-ამოცანების ჩამოთვლა |
| POST | `/api/projects/:id/ai-tasks` | AI-ამოცანის შექმნა |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | ამოცან-სტატ-განახლება |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | ამოცან-გამოძახება |

## ფაილ-ატვირთვა

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| POST | `/api/v1/upload` | ფაილ-ატვირთვა (multipart/form-data) |

მხარდაჭ. ტიპები: სურათები (PNG, JPG, GIF, WebP), დოკ-ები (PDF, TXT), მონაცემები (JSON, CSV, XML), არქივები (ZIP, GZ), ლოგები.

## Webhook-ები

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/workspaces/:id/webhooks` | webhook-ების ჩამოთვლა |
| POST | `/api/workspaces/:id/webhooks` | webhook-ის შექმნა |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | webhook-ის განახლება |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | webhook-ის წაშლა |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | გამოგ-ლოგი |

## ძებნა

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/search?q=<query>` | სრული-ტექსტ-ძებნა ყველა ერთეულში |

## ადმინი

| მეთოდი | Endpoint | აღწერა |
|--------|----------|-------------|
| GET | `/api/admin/users` | ყველა მომხმარებლის ჩამოთვლა (მხოლოდ admin) |
| PUT | `/api/admin/users/:id` | მომხმარებლ-განახლება (მხოლოდ admin) |

## ჯანმრთელობა

| მეთოდი | Endpoint | აღწერა | Auth |
|--------|----------|-------------|------|
| GET | `/health` | ჯანმრთელობ-შემოწმება | არა |

## შემდეგი ნაბიჯები

- [ავთენტიფიკაცია](./authentication) -- ტოკენ-მართვა და ბოტ-ტოკენები
- [API მიმოხილვა](./index) -- პასუხ-ფორმატი და კონვენციები
- [MCP სერვერი](../mcp-server/) -- AI-მოსახერხებელი ინტერფეისი
