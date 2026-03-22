---
title: MCP სერვერი
description: "OpenPR HTTP, stdio და SSE სატრანსპორტო პროტოკოლებზე 34 ინსტრუმენტიანი ჩაშენებული MCP სერვერს შეიცავს. Claude, Codex და Cursor-ის მსგავსი AI ასისტენტების პროექტ-მართვასთან ინტეგრაცია."
---

# MCP სერვერი

OpenPR ჩაშენებულ **MCP (Model Context Protocol) სერვერს** შეიცავს, რომელიც AI ასისტენტებს პროექტების, issue-ების, sprint-ების, ეტიკეტების, კომენტარების, წინადადებებისა და ფაილების მართვის 34 ინსტრუმენტს გვაძლევს. სერვერი სამ სატრანსპორტო პროტოკოლს ერთდროულად მხარს უჭერს.

## სატრანსპორტო პროტოკოლები

| პროტოკოლი | გამოყენ-შემთხვ | Endpoint |
|----------|----------|----------|
| **HTTP** | ვებ-ინტეგრაციები, OpenClaw plugin-ები | `POST /mcp/rpc` |
| **stdio** | Claude Desktop, Codex, ლოკ-CLI | stdin/stdout JSON-RPC |
| **SSE** | სტრიმინგ-კლიენტები, რეალ-დრო UI | `GET /sse` + `POST /messages` |

::: tip მულტი-პროტოკოლი
HTTP რეჟიმში ყველა სამი პროტოკოლი ერთ პორტზეა ხელმისაწვდომი: `/mcp/rpc` (HTTP), `/sse` + `/messages` (SSE) და `/health` (ჯანმრთელ-შემოწმება).
:::

## კონფიგურაცია

### გარემო-ცვლადები

| ცვლადი | სავალდ | აღწერა | მაგალითი |
|----------|----------|-------------|---------|
| `OPENPR_API_URL` | დიახ | API სერვერ-base URL | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | დიახ | ბოტ-ტოკენი `opr_` პრეფიქსით | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | დიახ | ნაგულისხმევი სამუშაო სივრც-UUID | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex (stdio)

MCP კლიენტ-კონფ-ში დამატება:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

### HTTP რეჟიმი

```bash
# Start the MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# Verify
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### SSE რეჟიმი

```bash
# 1. Connect SSE stream (returns session endpoint)
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. POST request to the returned endpoint
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> Response arrives via SSE stream as event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## ინსტრუმენტ-ცნობარი (34 ინსტრუმენტი)

### პროექტები (5)

| ინსტრუმენტი | სავალდ-პარამეტრები | აღწერა |
|------|-----------------|-------------|
| `projects.list` | -- | სამუშაო სივრცის ყველა პროექტის ჩამოთვლა |
| `projects.get` | `project_id` | issue-რაოდენობ-მქონე პროექტ-დეტ-მიღება |
| `projects.create` | `key`, `name` | პროექტის შექმნა |
| `projects.update` | `project_id` | სახელ/აღწ-განახლება |
| `projects.delete` | `project_id` | პროექტის წაშლა |

### Work Item-ები / Issue-ები (11)

| ინსტრუმენტი | სავალდ-პარამეტრები | აღწერა |
|------|-----------------|-------------|
| `work_items.list` | `project_id` | პროექტის issue-ების ჩამოთვლა |
| `work_items.get` | `work_item_id` | UUID-ის გავლით issue-ს მიღება |
| `work_items.get_by_identifier` | `identifier` | ადამიანUR-ID-ის გავლით (მაგ., `API-42`) |
| `work_items.create` | `project_id`, `title` | სურვილისამ-სტ/პრ/აღ/პასუხ/ვადა/დანართ-issue-შექმნა |
| `work_items.update` | `work_item_id` | ნებისმიერ ველ-განახლება |
| `work_items.delete` | `work_item_id` | issue-ს წაშლა |
| `work_items.search` | `query` | ყველა პროექტ-სრული-ტექსტ-ძებნა |
| `work_items.add_label` | `work_item_id`, `label_id` | ერთი ეტიკეტ-დამატება |
| `work_items.add_labels` | `work_item_id`, `label_ids` | მრავალი ეტიკეტ-დამატება |
| `work_items.remove_label` | `work_item_id`, `label_id` | ეტიკეტ-ამოღება |
| `work_items.list_labels` | `work_item_id` | issue-ს ეტიკეტების ჩამოთვლა |

### კომენტარები (3)

| ინსტრუმენტი | სავალდ-პარამეტრები | აღწერა |
|------|-----------------|-------------|
| `comments.create` | `work_item_id`, `content` | სურვილ-დანართ-კომენტარ-შექმნა |
| `comments.list` | `work_item_id` | issue-ს კომენტარების ჩამოთვლა |
| `comments.delete` | `comment_id` | კომენტარის წაშლა |

### ფაილები (1)

| ინსტრუმენტი | სავალდ-პარამეტრები | აღწერა |
|------|-----------------|-------------|
| `files.upload` | `filename`, `content_base64` | ფაილ-ატვირთვა (base64), URL-ს და სახელს აბრუნებს |

### ეტიკეტები (5)

| ინსტრუმენტი | სავალდ-პარამეტრები | აღწერა |
|------|-----------------|-------------|
| `labels.list` | -- | ყველა სამუშაო სივრც-ეტიკეტის ჩამოთვლა |
| `labels.list_by_project` | `project_id` | პროექტ-ეტიკეტების ჩამოთვლა |
| `labels.create` | `name`, `color` | ეტიკეტ-შექმნა (ფერი: hex, მაგ., `#2563eb`) |
| `labels.update` | `label_id` | სახელ/ფერ/აღწ-განახლება |
| `labels.delete` | `label_id` | ეტიკეტ-წაშლა |

### Sprint-ები (4)

| ინსტრუმენტი | სავალდ-პარამეტრები | აღწერა |
|------|-----------------|-------------|
| `sprints.list` | `project_id` | პროექტის sprint-ების ჩამოთვლა |
| `sprints.create` | `project_id`, `name` | სურვ-start_date/end_date-sprint-შ |
| `sprints.update` | `sprint_id` | სახელ/თარ/სტ-განახლება |
| `sprints.delete` | `sprint_id` | sprint-ის წაშლა |

### წინადადებები (3)

| ინსტრუმენტი | სავალდ-პარამეტრები | აღწერა |
|------|-----------------|-------------|
| `proposals.list` | `project_id` | სურვ-სტ-ფილტ-წინადადებების ჩამოთვლა |
| `proposals.get` | `proposal_id` | წინადადებ-დეტ-მიღება |
| `proposals.create` | `project_id`, `title`, `description` | მმართველობ-წინადადებ-შექმნა |

### წევრები & ძებნა (2)

| ინსტრუმენტი | სავალდ-პარამეტრები | აღწერა |
|------|-----------------|-------------|
| `members.list` | -- | სამუშ-სივრც-წ/როლ-ჩამოთვ |
| `search.all` | `query` | გლობ-ძ-პრ/issue/კომ |

## პასუხ-ფორმატი

ყველა MCP ინსტრუმენტ-პასუხი ამ სტრუქტურას მიჰყვება:

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
  "message": "error description"
}
```

## ბოტ-ტოკენ-ავთენტიფიკაცია

MCP სერვერი **ბოტ-ტოკენებით** (`opr_` პრეფიქსი) ავთ. ბოტ-ტოკენები **Workspace Settings** > **Bot Tokens**-ში შექმენი.

ყოველი ბოტ-ტოკენი:
- ჩვენ-სახელს შეიცავს (საქმიანობ-feed-ებში ნაჩვენები)
- ერთ სამუშაო სივრცეზე სკოპირდება
- `bot_mcp` მომხმარებლ-ერთეულს ქმნის აუდ-კვ-მთლიანობისთვის
- სამუშ-სივრც-წ-ყველა კითხ-ჩ-ოპ-მხარს უჭ

## აგენტ-ინტეგრაცია

კოდ-აგენტებისთვის OpenPR გვაძლევს:

- **AGENTS.md** (`apps/mcp-server/AGENTS.md`) -- სამუშ-ნ-შ-ინსტ-მ-აგ.
- **Skill Package** (`skills/openpr-mcp/SKILL.md`) -- სამ-ნ-შ-სკ-script-ებიანი მართ-skill.

რეკომ-აგ-სამ-ნ:
1. ინსტ-სემ-AGENTS.md-ის ჩატვ.
2. runtime-ხელმ-ინსტ-ENUM-ისთ `tools/list`.
3. სამ-ნ-შ-მიყ: ძ -> შ -> ეტ -> კომ.

## შემდეგი ნაბიჯები

- [API მიმოხილვა](../api/) -- REST API ცნობარი
- [წევრები & ნებართვები](../workspace/members) -- ბოტ-ტოკენ-მართვა
- [კონფიგურაცია](../configuration/) -- ყველა გარემო-ცვლადი
