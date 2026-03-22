---
title: ავთენტიფიკაცია
description: OpenPR მომხმარებლ-ავთენტიფიკაციისთვის JWT ტოკენებს და AI/MCP წვდომისთვის ბოტ-ტოკენებს იყენებს. რეგისტრაცია, შესვლა, ტოკენ-განახლება და ბოტ-ტოკენები.
---

# ავთენტიფიკაცია

OpenPR მომხმარებლ-ავთენტიფიკაციისთვის **JWT (JSON Web Tokens)**-ს და AI ასისტენტ-და MCP სერვერ-წვდომისთვის **ბოტ-ტოკენებს** იყენებს.

## მომხმარებლ-ავთენტიფიკაცია (JWT)

### რეგისტრაცია

ახალი ანგარიშის შექმნა:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

პასუხი:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip პირველი მომხმარებელი
პირველი დარეგისტრირებული მომხმარებელი ავტომატურად `admin` როლს იღებს. ყველა შემდეგი მომხმარებელი ნაგულისხმევად `user`-ია.
:::

### შესვლა

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

პასუხი `access_token`-ს, `refresh_token`-სა და `role`-ის მქონე მომხმარებლ-ინფოს შეიცავს.

### Access ტოკენის გამოყენება

ყველა ავთ-მოთხოვნაში `Authorization` header-ში access ტოკენის შეტანა:

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### ტოკენ-განახლება

Access ტოკენის ვადის ამოწურვისას refresh ტოკენი ახალ წყვილს მოიძიებს:

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### მიმდინარე მომხმარებლის მიღება

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

მიმდინარე მომხმარებლის პროფილს `role`-ის (admin/user) ჩათვლით აბრუნებს.

## ტოკენ-კონფიგურაცია

JWT ტოკენ-სიცოცხლეები გარემო-ცვლადებით კონფ:

| ცვლადი | ნაგულისხმევი | აღწერა |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production` | ტოკენ-ხელმოწერის საიდუმლო გასაღები |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 დღე) | Access ტოკენ-სიცოცხლე |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 დღე) | Refresh ტოკენ-სიცოცხლე |

::: danger წარმოებ-უსაფრთხოება
წარმოებაში `JWT_SECRET` ყოველთვის ძლიერ, შემთხვევით მნიშვნელობაზე დააყენე. ნაგულისხმევი მნიშვნელობა არა-უსაფრთხოა.
:::

## ბოტ-ტოკენ-ავთენტიფიკაცია

ბოტ-ტოკენები AI ასისტენტებს და ავტომატ-ინსტრუმენტებს ავთენტიფიკაციის საშუალებას აძლევს. ისინი სამუშაო სივრც-სკოპ-ულია და `opr_` პრეფიქსს იყენებს.

### ბოტ-ტოკენ-შექმნა

ბოტ-ტოკენები სამუშაო სივრც-პარამეტრ-UI-ის ან API-ის გავლით იმართება:

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude Assistant"}'
```

### ბოტ-ტოკენების გამოყენება

ბოტ-ტოკენები JWT ტოკენებივით გამოიყენება:

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### ბოტ-ტოკენ-თვისებები

| თვისება | აღწერა |
|----------|-------------|
| პრეფიქსი | `opr_` |
| სფერო | ერთი სამუშაო სივრცე |
| ერთეულ-ტიპი | `bot_mcp` მომხმარებლ-ერთეულს ქმნის |
| ნებართვები | სამუშაო სივრც-წევრისთვის ხელმისაწვდომი |
| აუდიტ-კვალი | ყველა ქმედება ბოტ-მომხმარებლის ქვეშ ლოგდება |

## Auth-Endpoint-შეჯამება

| Endpoint | მეთოდი | აღწერა |
|----------|--------|-------------|
| `/api/auth/register` | POST | ანგარიშის შექმნა |
| `/api/auth/login` | POST | შესვლა და ტოკენ-მიღება |
| `/api/auth/refresh` | POST | ტოკენ-წყვილ-განახლება |
| `/api/auth/me` | GET | მიმდინარე მომხმარებლ-ინფოს მიღება |

## შემდეგი ნაბიჯები

- [Endpoint-ების ცნობარი](./endpoints) -- სრული API-დოკ
- [MCP სერვერი](../mcp-server/) -- MCP-სთან ბოტ-ტოკენ-გამოყენება
- [წევრები & ნებართვები](../workspace/members) -- როლ-დაფუძნებული წვდომა
