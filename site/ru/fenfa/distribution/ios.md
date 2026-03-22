---
title: Дистрибуция iOS
description: "iOS OTA дистрибуция в Fenfa: itms-services, привязка UDID, интеграция Apple Developer API и регистрация тестовых устройств."
---

# Дистрибуция iOS

Fenfa поддерживает iOS OTA (Over-The-Air) установку через протокол `itms-services://`. Это позволяет распространять IPA-файлы напрямую, без App Store.

## Требования iOS OTA

- **HTTPS обязателен**: iOS требует валидного TLS-сертификата. Самоподписанные сертификаты не поддерживаются.
- **Корректный `FENFA_PRIMARY_DOMAIN`**: Манифест plist использует этот URL для ссылок на IPA.
- **Подписанный IPA**: Файл IPA должен быть подписан действующим Apple-сертификатом.

## Поток OTA установки

```mermaid
sequenceDiagram
    participant iPhone
    participant Safari
    participant Fenfa

    iPhone->>Safari: Открывает /d/{slug}
    Safari->>Fenfa: GET /d/{slug}
    Fenfa->>Safari: Страница с ссылкой itms-services://
    Safari->>Fenfa: GET /ios/manifest/{release_id}.plist
    Fenfa->>Safari: Манифест plist (bundle-id, version, IPA URL)
    Safari->>Fenfa: GET /uploads/{ipa_path}
    Fenfa->>Safari: IPA файл (стриминг)
    Safari->>iPhone: iOS начинает установку
```

## Привязка UDID

Для iOS-вариантов Fenfa поддерживает привязку UDID для управления тестовыми устройствами. UDID (Unique Device Identifier) — это уникальный идентификатор устройства, необходимый для добавления устройств в Apple Developer provisioning profiles.

### Поток привязки UDID

```mermaid
sequenceDiagram
    participant iPhone
    participant Safari
    participant Fenfa
    participant AppleDev as Apple Developer API

    iPhone->>Safari: Открывает /d/{slug}/register
    Safari->>Fenfa: GET /ios/register/{variant_id}
    Fenfa->>Safari: Файл .mobileconfig (с callback URL)
    Safari->>iPhone: Предложение установить профиль
    iPhone->>iPhone: Пользователь устанавливает профиль
    iPhone->>Fenfa: POST /ios/callback (с UDID)
    Fenfa->>Fenfa: Сохраняет UDID устройства
    Fenfa->>AppleDev: Регистрирует устройство (опционально)
```

### Конфигурация Apple Developer API

Для автоматической регистрации устройств настройте Apple Developer API:

```bash
curl -X PUT https://dist.example.com/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apple_key_id": "YOUR_KEY_ID",
    "apple_issuer_id": "YOUR_ISSUER_ID",
    "apple_private_key": "-----BEGIN EC PRIVATE KEY-----\n..."
  }'
```

### Просмотр зарегистрированных устройств

```bash
curl https://dist.example.com/admin/api/ios/devices \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### Синхронизация устройств с Apple Developer

```bash
curl -X POST https://dist.example.com/admin/api/ios/sync \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Устранение неполадок iOS

| Проблема | Причина | Решение |
|----------|---------|---------|
| «Unable to Install» | Нет HTTPS | Настройте TLS-сертификат |
| Неверные URL в манифесте | Неверный `PRIMARY_DOMAIN` | Установите корректный `FENFA_PRIMARY_DOMAIN` |
| Профиль установился, устройство не зарегистрировано | Недоступный callback URL | Проверьте сетевую доступность `primary_domain` |
| «IPA signing expired» | Истёк provisioning profile | Перезагрузите IPA с валидным сертификатом |

Подробнее см. в разделе [Устранение неполадок](../troubleshooting/).

## Следующие шаги

- [Дистрибуция Android](./android) — скачивание APK
- [Дистрибуция Desktop](./desktop) — macOS, Windows, Linux
- [Admin API](../api/admin) — управление устройствами через API
