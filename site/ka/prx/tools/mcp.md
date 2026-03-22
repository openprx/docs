---
title: MCP ინტეგრაცია
description: Model Context Protocol კლიენტი გარე MCP სერვერებთან stdio ან HTTP ტრანსპორტებით დაკავშირებისთვის დინამიური ინსტრუმენტების აღმოჩენითა და სახელთა სივრცით.
---

# MCP ინტეგრაცია

PRX Model Context Protocol (MCP) კლიენტს ახორციელებს, რომელიც გარე MCP სერვერებს უკავშირდება და მათ ინსტრუმენტებს აგენტისთვის ხელმისაწვდომს ხდის. MCP ღია პროტოკოლია, რომელიც სტანდარტიზებს LLM აპლიკაციების კომუნიკაციას გარე ინსტრუმენტების მიმწოდებლებთან.

`mcp` ინსტრუმენტი ფუნქციით გეითირებულია და მოითხოვს `mcp.enabled = true`-ს მინიმუმ ერთი განსაზღვრული სერვერით. PRX ორივე -- stdio (ლოკალური პროცესის კომუნიკაცია) და HTTP (დაშორებული სერვერის კომუნიკაცია) ტრანსპორტს უჭერს მხარს.

## კონფიგურაცია

### სერვერის განსაზღვრებები config.toml-ში

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
tool_name_prefix = "fs"

[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }
tool_name_prefix = "gh"

[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/sse"
tool_name_prefix = "api"
```

### სამუშაო სივრცის ლოკალური mcp.json

PRX MCP სერვერებს სამუშაო სივრცის ლოკალური `mcp.json` ფაილიდან აღმოაჩენს, VS Code და Claude Desktop-ის ფორმატის მსგავსად.

### ინსტრუმენტების სახელთა სივრცე

ყოველი MCP სერვერის ინსტრუმენტებს კონფიგურირებული `tool_name_prefix` პრეფიქსი ემატება სახელების კოლიზიის თავიდან ასაცილებლად:

- სერვერი `filesystem` პრეფიქსით `"fs"` ავრცელებს `fs_read_file`, `fs_write_file` და სხვ.
- სერვერი `github` პრეფიქსით `"gh"` ავრცელებს `gh_create_issue`, `gh_search_code` და სხვ.

## უსაფრთხოება

### გარემოს ცვლადების სანიტარიზაცია

PRX ავტომატურად ამოშლის საშიშ გარემოს ცვლადებს MCP სერვერის პროცესებიდან: `LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH` და სხვ.

### ბრძანებების თეთრი სია mcp.json-ისთვის

`mcp.json` ფაილის ბრძანებები ცნობილი უსაფრთხო გამშვებების თეთრ სიაზეა შეზღუდული: `npx`, `node`, `python3`, `uvx`, `docker`, `cargo` და სხვ.

### ინსტრუმენტების ნებართვა/უარყოფა სიები

```toml
[mcp.servers.filesystem]
allow_tools = ["read_file", "list_directory"]
deny_tools = ["write_file", "delete_file"]
```

## დაკავშირებული გვერდები

- [კონფიგურაციის მითითება](/ka/prx/config/reference) -- `[mcp]` და `[mcp.servers]` პარამეტრები
- [ინსტრუმენტების მიმოხილვა](/ka/prx/tools/) -- ჩაშენებული ინსტრუმენტები და MCP ინტეგრაციის მიმოხილვა
- [უსაფრთხოების სენდბოქსი](/ka/prx/security/sandbox) -- MCP სერვერის პროცესების სენდბოქსი
