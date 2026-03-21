---
title: Lark / Feishu
description: PRX-ის დაკავშირება Lark-თან (საერთაშორისო) ან Feishu-თან (ჩინეთი)
---

# Lark / Feishu

> დაუკავშირეთ PRX Lark-ს (საერთაშორისო) ან Feishu-ს (ჩინეთის მატერიკი) Open Platform API-ის გამოყენებით WebSocket გრძელი კავშირით ან HTTP webhook მოვლენების მიტანით.

## წინაპირობები

- Lark ან Feishu ტენანტი (ორგანიზაცია)
- აპლიკაცია შექმნილი [Lark დეველოპერ კონსოლში](https://open.larksuite.com/app) ან [Feishu დეველოპერ კონსოლში](https://open.feishu.cn/app)
- App ID, App Secret და Verification Token დეველოპერ კონსოლიდან

## სწრაფი დაყენება

### 1. ბოტის აპლიკაციის შექმნა

1. გადადით დეველოპერ კონსოლში და შექმენით ახალი Custom App
2. "Credentials"-ში დააკოპირეთ **App ID** და **App Secret**
3. "Event Subscriptions"-ში დააკოპირეთ **Verification Token**
4. დაამატეთ ბოტის შესაძლებლობა და კონფიგურირეთ ნებართვები:
   - `im:message`, `im:message.group_at_msg`, `im:message.p2p_msg`

### 2. კონფიგურაცია

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]
```

Feishu-სთვის (ჩინეთი):

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
use_feishu = true
allowed_users = ["*"]
```

### 3. შემოწმება

```bash
prx channel doctor lark
```

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `app_id` | `String` | *სავალდებულო* | App ID Lark/Feishu დეველოპერ კონსოლიდან |
| `app_secret` | `String` | *სავალდებულო* | App Secret დეველოპერ კონსოლიდან |
| `verification_token` | `String` | `null` | ვერიფიკაციის ტოკენი webhook ვალიდაციისთვის |
| `encrypt_key` | `String` | `null` | დაშიფვრის გასაღები webhook შეტყობინებების გაშიფვრისთვის |
| `allowed_users` | `[String]` | `[]` | ნებადართული მომხმარებლის ID-ები ან union ID-ები. ცარიელი = ყველას უარყოფა. `"*"` = ყველას დაშვება |
| `mention_only` | `bool` | `false` | ჩართვისას მხოლოდ @-მოხსენიებებს პასუხობს ჯგუფებში. პირადი შეტყობინებები ყოველთვის მუშავდება |
| `use_feishu` | `bool` | `false` | ჩართვისას იყენებს Feishu (ჩინეთი) API ენდფოინთებს Lark-ის (საერთაშორისო) ნაცვლად |
| `receive_mode` | `String` | `"websocket"` | მოვლენების მიღების რეჟიმი: `"websocket"` (ნაგულისხმევი, საჯარო URL არ არის საჭირო) ან `"webhook"` |
| `port` | `u16` | `null` | HTTP პორტი მხოლოდ webhook რეჟიმისთვის. სავალდებულო `receive_mode = "webhook"`-ისას, იგნორირდება websocket-ისთვის |

## ფუნქციები

- **WebSocket გრძელი კავშირი** -- მუდმივი WSS კავშირი რეალურ დროში მოვლენებისთვის საჯარო URL-ის გარეშე (ნაგულისხმევი რეჟიმი)
- **HTTP webhook რეჟიმი** -- მოვლენების ალტერნატიული მიტანა HTTP callback-ებით გარემოებისთვის, რომლებიც ამას მოითხოვს
- **Lark-ისა და Feishu-ს მხარდაჭერა** -- ავტომატურად გადართავს API ენდფოინთებს Lark-ს (საერთაშორისო) და Feishu-ს (ჩინეთი) შორის
- **დადასტურების რეაქციები** -- შემომავალ შეტყობინებებზე ლოკალურად შესაბამისი რეაქციებით რეაგირება (zh-CN, zh-TW, en, ja)
- **პირადი და ჯგუფური შეტყობინებები** -- პირადი ჩატებისა და ჯგუფური საუბრების დამუშავება
- **ტენანტის წვდომის ტოკენის მართვა** -- ტენანტის წვდომის ტოკენების ავტომატური მიღება და განახლება
- **შეტყობინებების დედუპლიკაცია** -- WebSocket შეტყობინებების ორმაგი გადაგზავნის თავიდან აცილება 30-წუთიან ფანჯარაში

## შეზღუდვები

- WebSocket რეჟიმი საჭიროებს სტაბილურ გამავალ კავშირს Lark/Feishu სერვერებთან
- Webhook რეჟიმი საჭიროებს საჯაროდ ხელმისაწვდომ HTTPS ენდფოინთს
- ბოტი ჯგუფში უნდა იყოს დამატებული, სანამ ჯგუფის შეტყობინებებს მიიღებს
- Feishu და Lark სხვადასხვა API დომენებს იყენებს; დარწმუნდით, რომ `use_feishu` ემთხვევა თქვენი ტენანტის რეგიონს
- საწარმოს აპლიკაციის დამტკიცება შეიძლება საჭირო იყოს თქვენი ტენანტის ადმინისტრატორის პოლიტიკების მიხედვით

## პრობლემების მოგვარება

### ბოტი შეტყობინებებს არ იღებს
- Websocket რეჟიმში შეამოწმეთ, რომ გამავალი კავშირები `open.larksuite.com`-თან (ან `open.feishu.cn`-თან) ნებადართულია
- შეამოწმეთ, რომ აპლიკაციას აქვს საჭირო `im:message` ნებართვები და დამტკიცებული/გამოქვეყნებულია
- დარწმუნდით, რომ ბოტი ჯგუფში დამატებულია ან მომხმარებელს დაწყებული აქვს პირადი შეტყობინება მასთან

### "Verification failed" webhook მოვლენებზე
- შეამოწმეთ `verification_token` ემთხვევა დეველოპერ კონსოლში მითითებულ მნიშვნელობას
- `encrypt_key`-ის გამოყენებისას დარწმუნდით, რომ ზუსტად ემთხვევა კონსოლის პარამეტრს

### არასწორი API რეგიონი
- Feishu (ჩინეთი) ტენანტის გამოყენებისას მიუთითეთ `use_feishu = true`
- Lark (საერთაშორისო) ტენანტის გამოყენებისას დარწმუნდით, რომ `use_feishu = false` (ნაგულისხმევი)
