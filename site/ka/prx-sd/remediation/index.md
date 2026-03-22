---
title: საფრთხეზე რეაგირება
description: ავტომატური საფრთხის remediation-ის კონფიგურაცია პასუხის პოლიტიკებით, persistence-ის წმენდითა და ქსელ-იზოლაციით.
---

# საფრთხეზე რეაგირება

PRX-SD-ის remediation ძრავა ავტომატური საფრთხის პასუხს მარტო გამოვლენის გარდა გვთავაზობს. საფრთხის იდენტიფიცირებისას ძრავა კონფიგურირებული პოლიტიკის მიხედვით ჟურნალირებიდან სრულ ქსელ-იზოლაციამდე დიფერენცირებულ მოქმედებებს ახდენს.

## პასუხის ტიპები

| მოქმედება | აღწერა | შექცევადი | Root საჭიროა |
|--------|-------------|-----------|--------------|
| **ანგარიში** | გამოვლენის ჟურნალირება და გაგრძელება. ფაილზე მოქმედება არ ხდება. | N/A | არა |
| **კარანტინი** | ფაილის დაშიფვრა და კარანტინის ვოლტში გადატანა. | კი | არა |
| **ბლოკი** | fanotify-ით ფაილ-წვდომის/შესრულების უარყოფა (მხოლოდ Linux რეალური დრო). | კი | კი |
| **Kill** | მავნე ფაილის შემქმნელი ან მომხმარებელი პროცესის შეწყვეტა. | არა | კი |
| **წმენდა** | ორიგინალის შენარჩუნებით ფაილიდან მავნე შინაარსის ამოღება (მაგ., macro-ების ამოღება Office-ის დოკუმენტებიდან). | ნაწილობრივ | არა |
| **წაშლა** | მავნე ფაილის disk-დან სამუდამო წაშლა. | არა | არა |
| **იზოლაცია** | firewall წესებით მანქანის ყველა ქსელ-წვდომის ბლოკვა. | კი | კი |
| **Blocklist** | ფაილ-ჰეშის ლოკალურ blocklist-ში დამატება მომავალი სკანებისთვის. | კი | არა |

## პოლიტიკის კონფიგურაცია

### sd policy ბრძანებების გამოყენება

```bash
# მიმდინარე პოლიტიკის ჩვენება
sd policy show

# მავნე გამოვლენებისთვის პოლიტიკის დაყენება
sd policy set on_malicious quarantine

# საეჭვო გამოვლენებისთვის პოლიტიკის დაყენება
sd policy set on_suspicious report

# ნაგულისხმევ მნიშვნელობებზე დაბრუნება
sd policy reset
```

### გამოტანის მაგალითი

```bash
sd policy show
```

```
Threat Response Policy
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### კონფიგურაციის ფაილი

`~/.prx-sd/config.toml`-ში პოლიტიკების დაყენება:

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # auto-add malicious hashes to local blocklist
clean_persistence = true        # remove persistence mechanisms on malicious detection
network_isolate = false         # enable network isolation for critical threats

[policy.notify]
webhook = true
email = false

[policy.escalation]
# Escalate to stronger action if same threat reappears
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
`on_malicious` და `on_suspicious` პოლიტიკები სხვადასხვა მოქმედებების ნაკრებს იღებს. `kill` და `delete` მსგავსი დამანგრეველი მოქმედებები მხოლოდ `on_malicious`-ისთვისაა ხელმისაწვდომი.
:::

## Persistence-ის წმენდა

`clean_persistence`-ის ჩართვისას PRX-SD მავნე პროგრამის დაინსტალირებულ persistence მექანიზმებს ეძებს და შლის. ეს საფრთხის კარანტინიზების ან წაშლის შემდეგ ავტომატურად სრულდება.

### Linux-ის Persistence წერტილები

| ადგილმდებარეობა | ტექნიკა | სარემედიაციო მოქმედება |
|----------|-----------|----------------|
| `/etc/cron.d/`, `/var/spool/cron/` | Cron job-ები | მავნე cron ჩანაწერების ამოღება |
| `/etc/systemd/system/` | systemd სერვისები | მავნე unit-ების გამორთვა და ამოღება |
| `~/.config/systemd/user/` | მომხმარებლის systemd სერვისები | გამორთვა და ამოღება |
| `~/.bashrc`, `~/.profile` | Shell RC ინჟექცია | ინჟიცირებული სტრიქონების ამოღება |
| `~/.ssh/authorized_keys` | SSH backdoor გასაღებები | არაავტორიზებული გასაღებების ამოღება |
| `/etc/ld.so.preload` | LD_PRELOAD გატაცება | მავნე preload ჩანაწერების ამოღება |
| `/etc/init.d/` | SysV init სკრიპტები | მავნე სკრიპტების ამოღება |

### macOS-ის Persistence წერტილები

| ადგილმდებარეობა | ტექნიკა | სარემედიაციო მოქმედება |
|----------|-----------|----------------|
| `~/Library/LaunchAgents/` | LaunchAgent plist-ები | გამოტვირთვა და ამოღება |
| `/Library/LaunchDaemons/` | LaunchDaemon plist-ები | გამოტვირთვა და ამოღება |
| `~/Library/Application Support/` | Login items | მავნე ელემენტების ამოღება |
| `/Library/StartupItems/` | Startup items | ამოღება |
| `~/.zshrc`, `~/.bash_profile` | Shell RC ინჟექცია | ინჟიცირებული სტრიქონების ამოღება |
| Keychain | Keychain ბოროტად გამოყენება | Alert (ავტო-წმენდა არ ხდება) |

### Windows-ის Persistence წერტილები

| ადგილმდებარეობა | ტექნიკა | სარემედიაციო მოქმედება |
|----------|-----------|----------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | Registry Run გასაღებები | მავნე მნიშვნელობების ამოღება |
| `HKLM\SYSTEM\CurrentControlSet\Services` | მავნე სერვისები | გაჩერება, გამორთვა და ამოღება |
| `Startup` საქაღალდე | Startup მალმაჩვენებლები | მავნე მალმაჩვენებლების ამოღება |
| Task Scheduler | დაგეგმილი დავალებები | მავნე დავალებების წაშლა |
| WMI Subscriptions | WMI event consumers | მავნე subscription-ების ამოღება |

::: warning
Persistence-ის წმენდა სისტემის კონფიგ-ფაილებსა და რეესტრის ჩანაწერებს ცვლის. ყოველი ოპერაციის შემდეგ `~/.prx-sd/remediation.log`-ში წმენდის ჟურნალი გადაიხედეთ, მხოლოდ მავნე ჩანაწერების ამოღების დასადასტურებლად.
:::

## ქსელ-იზოლაცია

კრიტიკული საფრთხეებისთვის (აქტიური გამოსასყიდი, მონაცემების ექსფილტრაცია) PRX-SD მანქანას ქსელიდან გამოჰყოფს:

### Linux (iptables)

```bash
# PRX-SD ამ წესებს იზოლაციისას ავტომატურად ამატებს
iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD pf წესებს კონფიგურირებს
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

იზოლაციის მოხსნა:

```bash
sd isolate lift
```

::: warning
ქსელ-იზოლაცია SSH-ის ჩათვლით ყველა ქსელ-ტრაფიკს ბლოკავს. ავტომატური ქსელ-იზოლაციის ჩართვამდე ფიზიკური ან out-of-band კონსოლ-წვდომა უზრუნველყავით.
:::

## Remediation ჟურნალი

ყველა სარემედიაციო მოქმედება `~/.prx-sd/remediation.log`-ში ჟურნალდება:

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## მაგალითები

```bash
# სერვერებისთვის აგრესიული პოლიტიკის დაყენება
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# სამუშაო სადგურებისთვის კონსერვატიული პოლიტიკის დაყენება
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# ექსპლიციტური remediation-ით სკანირება
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# ქსელ-იზოლაციის შემოწმება და მოხსნა
sd isolate status
sd isolate lift

# Remediation ისტორიის ნახვა
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## შემდეგი ნაბიჯები

- [კარანტინის მართვა](/ka/prx-sd/quarantine/) -- კარანტინიზებული ფაილების მართვა
- [გამოსასყიდი პროგრამის დაცვა](/ka/prx-sd/realtime/ransomware) -- სპეციალიზებული გამოსასყიდ-პასუხი
- [Webhook Alert-ები](/ka/prx-sd/alerts/webhook) -- სარემედიაციო მოქმედებებზე შეტყობინება
- [Email Alert-ები](/ka/prx-sd/alerts/email) -- საფრთხეების email შეტყობინებები
