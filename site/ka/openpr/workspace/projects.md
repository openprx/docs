---
title: პროექტ-მართვა
description: პროექტები issue-ებს, sprint-ებსა და ეტიკეტებს სამუშაო სივრცეში ანაწილებს. OpenPR-ში პროექტების შექმნა და მართვა.
---

# პროექტ-მართვა

**პროექტი** სამუშაო სივრცეში ცხოვრობს და issue-ების, sprint-ების, ეტიკეტებისა და მმართველობ-წინადადებების კონტეინერია. ყოველ პროექტს უნიკალური **კლუჩი** (მაგ., `API`, `FRONT`, `OPS`) აქვს, რომელიც issue-იდენტიფიკატორებს უსწრებს.

## პროექტის შექმნა

სამუშაო სივრცეში გადასვლა და **New Project**-ზე დაჭერა:

| ველი | სავალდებულო | აღწერა | მაგალითი |
|-------|----------|-------------|---------|
| სახელი | დიახ | ჩვენ-სახელი | "Backend API" |
| კლუჩი | დიახ | 2-5 სიმბოლოიანი issue-პრეფიქსი | "API" |
| აღწერა | არა | პროექტ-შეჯამება | "REST API and business logic" |

კლუჩი სამუშაო სივრცეში უნიკალური უნდა იყოს და issue-იდენტიფიკატორებს განსაზღვრავს: `API-1`, `API-2` და ა.შ.

## პროექტ-Dashboard

ყოველი პროექტი გვაძლევს:

- **Board** -- Kanban-ხედი გადათრევ-სვეტებით (Backlog, To Do, In Progress, Done).
- **Issues** -- სია-ხედი ფილტრაციით, დახარისხებით და სრული-ტექსტ-ძებნით.
- **Sprints** -- Sprint-დაგეგმვა და ციკლ-მართვა. იხ. [Sprint-ები](../issues/sprints).
- **Labels** -- პროექტ-სკოპ-ეტიკეტები კატეგორიზაციისთვის. იხ. [ეტიკეტები](../issues/labels).
- **Settings** -- პროექტ-სახელი, კლუჩი, აღწერა და წევრ-პარამეტრები.

## Issue-რაოდენობა

პროექტ-მიმოხილვა issue-რაოდენობებს სტატუსის მიხედვით აჩვენებს:

| სტატუსი | აღწერა |
|-------|-------------|
| Backlog | იდეები და მომავლის სამუშაო |
| To Do | მიმდინარე ციკლისთვის დაგეგმილი |
| In Progress | აქტიურად მიმდინარე |
| Done | დასრულებული სამუშაო |

## API ცნობარი

```bash
# List projects in a workspace
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# Create a project
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Backend API", "key": "API"}'

# Get project with issue counts
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## MCP ინსტრუმენტები

| ინსტრუმენტი | პარამეტრები | აღწერა |
|------|--------|-------------|
| `projects.list` | -- | სამუშაო სივრცეში ყველა პროექტის ჩამოთვლა |
| `projects.get` | `project_id` | issue-რაოდენობებიანი პროექტ-დეტალების მიღება |
| `projects.create` | `key`, `name` | ახალი პროექტის შექმნა |
| `projects.update` | `project_id` | სახელის ან აღწერის განახლება |
| `projects.delete` | `project_id` | პროექტის წაშლა |

## შემდეგი ნაბიჯები

- [Issues](../issues/) -- პროექტებში issue-ების შექმნა და მართვა
- [წევრები](./members) -- სამუშაო სივრც-როლების გავლით პროექტ-წვდომის მართვა
