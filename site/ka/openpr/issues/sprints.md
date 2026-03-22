---
title: Sprint-მართვა
description: OpenPR-ის sprint-ებით დროში შეზღუდულ გამეორებებში სამუშაოს დაგეგმვა და თვალყური. sprint-ების შექმნა, issue-ების მინიჭება და პროგრეს-მონიტორინგი.
---

# Sprint-მართვა

Sprint-ები სამუშაოს ორგანიზება-თვალყურის დროში შეზღუდული გამეორებებია. ყოველი sprint პროექტს ეკუთვნის და დაწყებ-თარიღს, დამთავრ-თარიღს და მინიჭებული issue-ების ნაკრებს შეიცავს.

## Sprint-ის შექმნა

### ვებ UI-ის გავლით

1. პროექტში გადასვლა.
2. **Sprints** სექციაზე გადასვლა.
3. **New Sprint**-ზე დაჭერა.
4. sprint-სახელის, დაწყებ-თარიღისა და დამთავრ-თარიღის შეყვანა.

### API-ის გავლით

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sprint 1",
    "start_date": "2026-03-24",
    "end_date": "2026-04-07"
  }'
```

### MCP-ის გავლით

```json
{
  "method": "tools/call",
  "params": {
    "name": "sprints.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "name": "Sprint 1",
      "start_date": "2026-03-24",
      "end_date": "2026-04-07"
    }
  }
}
```

## Sprint-ველები

| ველი | ტიპი | სავალდებულო | აღწერა |
|-------|------|----------|-------------|
| სახელი | string | დიახ | Sprint-სახელი (მაგ., "Sprint 1", "Q1 Week 3") |
| დაწყებ-თარიღი | date | არა | Sprint-ის დაწყებ-თარიღი |
| დამთავრ-თარიღი | date | არა | Sprint-ის დამთავრ-თარიღი |
| სტატუსი | enum | ავტო | აქტიური, დასრულებული ან დაგეგმილი |

## Sprint-ზე Issue-ების მინიჭება

Issue-ების sprint-ზე მინიჭება issue-ს `sprint_id`-ის განახლებით:

```bash
curl -X PATCH http://localhost:8080/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sprint_id": "<sprint_uuid>"}'
```

ან ვებ UI-ის გავლით, issue-ების sprint-სექციაში გადათრევა ან issue-დეტალ-პანელის გამოყენება.

## Sprint-დაგეგმვის სამუშაო ნაკადი

ტიპური sprint-დაგეგმვის სამუშაო ნაკადი:

1. **Sprint-ის შექმნა** დაწყებ-და დამთავრ-თარიღებით.
2. **Backlog-ის გადახედვა** -- შესატანი issue-ების გამოვლენა.
3. **Issue-ების გადაყვანა** Backlog/To Do-დან sprint-ში.
4. **პრიორიტეტებისა და პასუხისმგებლების დაყენება** sprint-issue-ებისთვის.
5. **Sprint-ის დაწყება** -- გუნდი სამუშაოს იწყებს.
6. **პროგრეს-თვალყური** board-სა და sprint-ხედში.
7. **Sprint-ის დასრულება** -- done/remaining ერთეულების მიმოხილვა.

## MCP ინსტრუმენტები

| ინსტრუმენტი | პარამეტრები | აღწერა |
|------|--------|-------------|
| `sprints.list` | `project_id` | პროექტის sprint-ების ჩამოთვლა |
| `sprints.create` | `project_id`, `name` | სურვილისამებრ-თარიღებიანი sprint-ის შექმნა |
| `sprints.update` | `sprint_id` | სახელის, თარიღების ან სტატუსის განახლება |
| `sprints.delete` | `sprint_id` | sprint-ის წაშლა |

## შემდეგი ნაბიჯები

- [სამუშაო ნაკად-სტატუსები](./workflow) -- issue-სტატუს-გადასვლების გაგება
- [ეტიკეტები](./labels) -- sprint-issue-ების კატეგორიზება
- [Issues მიმოხილვა](./index) -- issue-ველის სრული ცნობარი
