---
title: Issues & თვალყური
description: OpenPR-ის issue-ები ძირითადი სამუშაო ერთეულია. ამოცანების, ბაგების და ფუნქციების თვალყური სტატუსებით, პრიორიტეტებით, პასუხისმგებლებით, ეტიკეტებითა და კომენტარებით.
---

# Issues & თვალყური

Issue-ები (ასევე work item-ები) OpenPR-ის ძირითადი სამუშაო ერთეულია. ისინი ამოცანებს, ბაგებს, ფუნქციებს ან პროექტში ნებისმიერ თვალსადევ სამუშაოს წარმოადგენს.

## Issue-ველები

| ველი | ტიპი | სავალდებულო | აღწერა |
|-------|------|----------|-------------|
| სათაური | string | დიახ | სამუშაოს მოკლე აღწერა |
| აღწერა | markdown | არა | დეტალური აღწერა ფორმატირებით |
| სტატუსი | enum | დიახ | სამუშაო ნაკად-სტატუსი (იხ. [სამუშაო ნაკადი](./workflow)) |
| პრიორიტეტი | enum | არა | `low`, `medium`, `high`, `urgent` |
| პასუხისმგებელი | user | არა | issue-ზე პასუხისმგებელი გუნდ-წევრი |
| ეტიკეტები | list | არა | კატეგორ-ტეგები (იხ. [ეტიკეტები](./labels)) |
| Sprint | sprint | არა | issue-ს მიკუთვნებული sprint-ციკლი |
| ვადა | datetime | არა | სამიზნე დასრულებ-თარიღი |
| დანართები | files | არა | დართული ფაილები (სურათები, დოკ-ები, ლოგები) |

## Issue-იდენტიფიკატორები

ყოველ issue-ს ადამიან-წასაკითხი იდენტიფიკატორი აქვს, პროექტ-კლუჩისა და თანმიმდევრული ნომრისგან:

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

ნებისმიერი issue-ს სამუშაო სივრცის ყველა პროექტში იდენტიფიკატორის გავლით ძებნა შეიძლება.

## Issue-ების შექმნა

### ვებ UI-ის გავლით

1. პროექტში გადასვლა.
2. **New Issue**-ზე დაჭერა.
3. სათაურის, აღწერისა და სურვილისამებრ ველების შევსება.
4. **Create**-ზე დაჭერა.

### REST API-ის გავლით

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement user settings page",
    "description": "Add a settings page where users can update their profile.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### MCP-ის გავლით

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Implement user settings page",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## კომენტარები

Issue-ები markdown-ფორმატირებისა და ფაილ-დანართების მქონე ნიჟ-კომენტარებს მხარს უჭერს:

```bash
# Add a comment
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Fixed in commit abc123. Ready for review."}'
```

კომენტარები MCP ინსტრუმენტებითაც ხელმისაწვდომია: `comments.create`, `comments.list`, `comments.delete`.

## საქმიანობ-Feed

Issue-ში ყოველი ცვლილება საქმიანობ-feed-ში ჩაიწერება:

- სტატუს-ცვლილებები
- პასუხისმგებლ-ცვლილებები
- ეტიკეტ-დამატება/ამოღება
- კომენტარები
- პრიორიტეტ-განახლებები

საქმიანობ-feed ყოველი issue-სთვის სრულ აუდიტ-კვალს გვაძლევს.

## ფაილ-დანართები

Issue-ები და კომენტარები ფაილ-დანართებს მხარს უჭერს, სურათების, დოკ-ების, ლოგებისა და არქივების ჩათვლით. API-ის გავლით ატვირთვა:

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

ან MCP-ის გავლით:

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<base64_encoded_content>"
    }
  }
}
```

მხარდაჭერილი ფაილ-ტიპები: სურათები (PNG, JPG, GIF, WebP), დოკ-ები (PDF, TXT), მონაცემები (JSON, CSV, XML), არქივები (ZIP, GZ) და ლოგები.

## ძებნა

OpenPR PostgreSQL FTS-ის გამოყენებით ყველა issue-ში, კომენტარსა და წინადადებაში სრულ-ტექსტ-ძებნას უზრუნველყოფს:

```bash
# Search via API
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# Search via MCP
# work_items.search: search within a project
# search.all: global search across all projects
```

## MCP ინსტრუმენტები

| ინსტრუმენტი | პარამეტრები | აღწერა |
|------|--------|-------------|
| `work_items.list` | `project_id` | პროექტის issue-ების ჩამოთვლა |
| `work_items.get` | `work_item_id` | UUID-ის გავლით issue-ს მიღება |
| `work_items.get_by_identifier` | `identifier` | ადამიან-ID-ის გავლით (მაგ., `API-42`) |
| `work_items.create` | `project_id`, `title` | issue-ს შექმნა |
| `work_items.update` | `work_item_id` | ნებისმიერი ველის განახლება |
| `work_items.delete` | `work_item_id` | issue-ს წაშლა |
| `work_items.search` | `query` | სრული-ტექსტ-ძებნა |
| `comments.create` | `work_item_id`, `content` | კომენტარის დამატება |
| `comments.list` | `work_item_id` | კომენტარების ჩამოთვლა |
| `comments.delete` | `comment_id` | კომენტარის წაშლა |
| `files.upload` | `filename`, `content_base64` | ფაილის ატვირთვა |

## შემდეგი ნაბიჯები

- [სამუშაო ნაკად-სტატუსები](./workflow) -- issue-სიცოცხლ-ციკლის გაგება
- [Sprint-დაგეგმვა](./sprints) -- issue-ების sprint-ციკლებად ორგანიზება
- [ეტიკეტები](./labels) -- issue-ების ეტიკეტებით კატეგორიზება
