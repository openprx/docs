---
title: პრობლემების მოგვარება
description: "PRX-SD-ის გავრცელებული პრობლემების გადაჭრები, მათ შორის სიგნატურ-განახლებები, სკანირების შესრულება, ნებართვები, მცდარი დადებითები, დემონის პრობლემები და მეხსიერების გამოყენება."
---

# პრობლემების მოგვარება

ეს გვერდი PRX-SD-ის გაშვებისას ყველაზე გავრცელებულ პრობლემებს, მათ მიზეზებსა და გადაჭრებს მოიცავს.

## სიგნატურ-მონაცემთა ბაზის განახლება ვერ ხდება

**სიმპტომები:** `sd update` ქსელის შეცდომით, timeout-ით ან SHA-256 შეუსაბამობით ვერ ხდება.

**შესაძლო მიზეზები:**
- ინტერნეტ-კავშირი არ არის ან firewall გამავალ HTTPS-ს ბლოკავს
- განახლების სერვერი დროებით მიუწვდომელია
- proxy ან კორპორატიული firewall პასუხს ცვლის

**გადაჭრები:**

1. **კავშირის შემოწმება** განახლების სერვერთან:

```bash
curl -fsSL https://api.github.com/repos/openprx/prx-sd-signatures/commits?per_page=1
```

2. **ოფლაინ-განახლების სკრიპტის გამოყენება** ქსელის შეზღუდვების შემთხვევაში:

```bash
# On a machine with internet access
./tools/update-signatures.sh

# Copy the signatures directory to the target machine
scp -r ~/.prx-sd/signatures user@target:~/.prx-sd/
```

3. **ხელახლა-ჩამოტვირთვის გაძალება** ნებისმიერი დაზიანებული ქეშის გასასუფთავებლად:

```bash
sd update --force
```

4. **მომხმარებლის განახლების სერვერის გამოყენება** პირადი სარკის ჰოსტინგის შემთხვევაში:

```bash
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"
sd update
```

5. **SHA-256 შეუსაბამობის შემოწმება** -- ეს ჩვეულებრივ ნიშნავს, რომ ჩამოტვირთვა გადაცემისას დაზიანდა. სცადეთ ხელახლა ან ხელით ჩამოტვირთეთ:

```bash
sd update --force
```

::: tip
განახლების ჩამოტვირთვის გარეშე მისი ხელმისაწვდომობის შესამოწმებლად `sd update --check-only`-ის გაშვება.
:::

## სკანირება ნელია

**სიმპტომები:** დირექტორიის სკანირება მოსალოდნელზე გაცილებით მეტ დროს მოითხოვს.

**შესაძლო მიზეზები:**
- ქსელ-მიმაგრებული ფაილ-სისტემების (NFS, CIFS, SSHFS) სკანირება
- YARA წესები ყოველ სკანზე კომპილირდება (ქეშ-კომპილაცია არ არის)
- ძალიან ბევრი thread-ი ბრუნვად დისკებზე I/O-ს ეჯიბრება
- დიდ ჩადგმულ არქივებზე არქივ-რეკურსია

**გადაჭრები:**

1. **Thread-ების გაზრდა** SSD-ზე დაფუძნებული საცავისთვის:

```bash
sd config set scan.threads 16
```

2. **Thread-ების შემცირება** ბრუნვადი დისკებისთვის (I/O-ბმული):

```bash
sd config set scan.threads 2
```

3. **ნელი ან შეუსაბამო გზების გამოსავლელი**:

```bash
sd config set scan.exclude_paths '["/mnt/nfs", "/proc", "/sys", "/dev", "*.iso"]'
```

4. **არქივ-სკანირების გამორთვა** საჭიროების არარსებობის შემთხვევაში:

```bash
sd config set scan.scan_archives false
```

5. **არქივ-სიღრმის შემცირება** ღრმად ჩადგმული არქივების თავიდან ასაცილებლად:

```bash
sd config set scan.max_archive_depth 1
```

6. **`--exclude` ნიშნის გამოყენება** ერთ-ჯერადი სკანებისთვის:

```bash
sd scan /home --exclude "*.iso" --exclude "node_modules"
```

7. **Debug ჟურნალირების ჩართვა** დაყოვნების პოვნისთვის:

```bash
sd --log-level debug scan /path/to/dir 2>&1 | grep -i "slow\|timeout\|skip"
```

## fanotify ნებართვის შეცდომები

**სიმპტომები:** `sd monitor --block` "Permission denied" ან "Operation not permitted" შეცდომით ვერ ხდება.

**შესაძლო მიზეზები:**
- root-ად გაშვება არ ხდება
- Linux kernel-ს `CONFIG_FANOTIFY_ACCESS_PERMISSIONS` ჩართული არ აქვს
- AppArmor ან SELinux fanotify-ის წვდომას ბლოკავს

**გადაჭრები:**

1. **Root-ად გაშვება**:

```bash
sudo sd monitor /home /tmp --block
```

2. **Kernel-ის კონფიგის შემოწმება**:

```bash
zgrep FANOTIFY /proc/config.gz
# Should show: CONFIG_FANOTIFY=y and CONFIG_FANOTIFY_ACCESS_PERMISSIONS=y
```

3. **ბლოკ-არარა რეჟიმის გამოყენება** სარეზერვო ვარიანტად (საფრთხეებს კვლავ ავლენს, მაგრამ ფაილ-წვდომას არ ბლოკავს):

```bash
sd monitor /home /tmp
```

::: warning
ბლოკ-რეჟიმი მხოლოდ fanotify-ის მხარდაჭერის მქონე Linux-ზეა ხელმისაწვდომი. macOS-ზე (FSEvents) და Windows-ზე (ReadDirectoryChangesW) რეალურ დროში მონიტორინგი მხოლოდ-გამოვლენის რეჟიმში მუშაობს.
:::

4. **SELinux/AppArmor-ის შემოწმება**:

```bash
# SELinux: check for denials
ausearch -m AVC -ts recent | grep prx-sd

# AppArmor: check for denials
dmesg | grep apparmor | grep prx-sd
```

## მცდარი დადებითი (ლეგიტიმური ფაილი საფრთხად გამოვლინდა)

**სიმპტომები:** ცნობილ-უსაფრთხო ფაილი საეჭვოდ ან მავნედ ნიშნდება.

**გადაჭრები:**

1. **გამოვლენის გამომწვევის შემოწმება**:

```bash
sd scan /path/to/file --json
```

`detection_type` და `threat_name` ველებს მიაქციეთ ყურადღება:
- `HashMatch` -- ფაილის ჰეში ცნობილ მავნე-პროგრამ-ჰეშს ემთხვევა (მცდარი დადებითი ნაკლებ სავარაუდოა)
- `YaraRule` -- YARA წესმა ფაილში შაბლონები ამოიცნო
- `Heuristic` -- ევრისტიკულმა ძრავამ ფაილი ბარიერს ზემოთ შეაფასა

2. **ევრისტიკური მცდარი დადებითებისთვის** ბარიერის ამაღლება:

```bash
# Default is 60; raise to 70 for fewer false positives
sd config set scan.heuristic_threshold 70
```

3. **ფაილის ან დირექტორიის სკანიდან გამოსავლელი**:

```bash
sd config set scan.exclude_paths '["/path/to/safe-file", "/opt/known-good/"]'
```

4. **YARA-ს მცდარი დადებითებისთვის** კონკრეტული წესების გამოსავლელი `~/.prx-sd/yara/` დირექტორიაში მათი ამოღებით ან კომენტარებში გადასვლით.

5. **ჰეშით თეთრ-სიაში შეტანა** -- ფაილის SHA-256-ის ლოკალურ allowlist-ში დამატება (მომავალი ფუნქცია). სარეზერვო ვარიანტად ფაილის გზით გამოსავლელი.

::: tip
გამოვლენის ნამდვილ მცდარ დადებითად მიჩნევის შემთხვევაში, გთხოვთ შეატყობინოთ [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)-ზე ფაილის ჰეშით (არა თავად ფაილით) და წესის სახელით.
:::

## დემონი ვერ იწყებს

**სიმპტომები:** `sd daemon` მყისიერ გასდის, ან `sd status` "stopped"-ს გვიჩვენებს.

**შესაძლო მიზეზები:**
- სხვა ინსტანცია უკვე მუშაობს (PID ფაილი არსებობს)
- მონაცემთა დირექტორია მიუწვდომელია ან დაზიანებულია
- სიგნატურ-მონაცემთა ბაზა აკლია

**გადაჭრები:**

1. **მოძველებული PID ფაილის შემოწმება**:

```bash
cat ~/.prx-sd/prx-sd.pid
# If the listed PID is not running, remove the file
rm ~/.prx-sd/prx-sd.pid
```

2. **დემონის სტატუსის შემოწმება**:

```bash
sd status
```

3. **წინა პლანზე debug ჟურნალირებით გაშვება** სტარტ-შეცდომების სანახავად:

```bash
sd --log-level debug daemon /home /tmp
```

4. **სიგნატურების არსებობის შემოწმება**:

```bash
sd info
# If hash_count is 0, run:
sd update
```

5. **დირექტორიის ნებართვების შემოწმება**:

```bash
ls -la ~/.prx-sd/
# All directories should be owned by your user and writable
```

6. **ხელახლა-ინიციალიზება** მონაცემთა დირექტორიის დაზიანების შემთხვევაში:

```bash
# Back up existing data
mv ~/.prx-sd ~/.prx-sd.bak

# Re-run any command to trigger first-run setup
sd info

# Re-download signatures
sd update
```

## ჟურნალ-დონის რეგულირება

**პრობლემა:** პრობლემის გამართვისთვის მეტი სადიაგნოსტიკო ინფორმაცია გჭირდებათ.

PRX-SD ხუთ ჟურნალ-დონეს მხარს უჭერს, ყველაზე დეტალურიდან ნაკლებ-დეტალურამდე:

| დონე | აღწერა |
|-------|-------------|
| `trace` | ყველაფერი, მათ შორის ფაილ-დონის YARA-შემჯამების დეტალები |
| `debug` | ძრავის დეტალური ოპერაციები, plugin-ის ჩატვირთვა, ჰეშ-ძებნა |
| `info` | სკანირების პროგრესი, სიგნატურ-განახლებები, plugin-ის რეგისტრაცია |
| `warn` | გამაფრთხილებლები და არა-ფატალური შეცდომები (ნაგულისხმევი) |
| `error` | მხოლოდ კრიტიკული შეცდომები |

```bash
# Maximum verbosity
sd --log-level trace scan /tmp

# Debug-level for troubleshooting
sd --log-level debug monitor /home

# Redirect logs to a file for analysis
sd --log-level debug scan /home 2> /tmp/prx-sd-debug.log
```

::: tip
`--log-level` ნიშანი გლობალურია და ქვე-ბრძანებამდე **უნდა** მოვიდეს:
```bash
# Correct
sd --log-level debug scan /tmp

# Incorrect (flag after subcommand)
sd scan /tmp --log-level debug
```
:::

## მეხსიერების მაღალი გამოყენება

**სიმპტომები:** `sd` პროცესი მოსალოდნელზე მეტ მეხსიერებას მოიხმარს, განსაკუთრებით დიდი დირექტორიების სკანირებისას.

**შესაძლო მიზეზები:**
- ბევრი thread-ით ძალიან დიდი ფაილ-რაოდენობის სკანირება
- YARA წესები მეხსიერებაში კომპილირდება (38,800+ წესი მნიშვნელოვან მეხსიერებას მოიხმარს)
- არქივ-სკანირება დიდ შეკუმშულ ფაილებს მეხსიერებაში ავრცელებს
- WASM plugin-ები მაღალი `max_memory_mb` ლიმიტებით

**გადაჭრები:**

1. **Thread-ების რაოდენობის შემცირება** (ყოველი thread საკუთარ YARA კონტექსტს ტვირთავს):

```bash
sd config set scan.threads 2
```

2. **ფაილის მაქსიმალური ზომის შეზღუდვა** ძალიან დიდი ფაილების გამოსატოვებლად:

```bash
# Limit to 50 MiB
sd config set scan.max_file_size 52428800
```

3. **არქივ-სკანირების გამორთვა** მეხსიერება-შეზღუდული სისტემებისთვის:

```bash
sd config set scan.scan_archives false
```

4. **არქივ-სიღრმის შემცირება**:

```bash
sd config set scan.max_archive_depth 1
```

5. **WASM plugin-ის მეხსიერების ლიმიტების შემოწმება** -- `~/.prx-sd/plugins/*/plugin.json`-ის განხილვა მაღალი `max_memory_mb` მნიშვნელობების მქონე plugin-ებისთვის და მათი შემცირება.

6. **მეხსიერების მონიტორინგი სკანირების დროს**:

```bash
# In another terminal
watch -n 1 'ps aux | grep sd | grep -v grep'
```

7. **დემონისთვის** დროთა განმავლობაში მეხსიერების მონიტორინგი:

```bash
sd status
# Shows PID; use top/htop to watch memory
```

## სხვა გავრცელებული პრობლემები

### "No YARA rules found" გამაფრთხილებელი

YARA წესების დირექტორია ცარიელია. ხელახლა-გაუშვით პირველ-ჯერადი დაყენება ან ჩამოტვირთეთ წესები:

```bash
sd update
# Or manually trigger setup by removing the yara directory:
rm -rf ~/.prx-sd/yara
sd info  # triggers first-run setup with embedded rules
```

### "Failed to open signature database" შეცდომა

LMDB სიგნატურ-მონაცემთა ბაზა შეიძლება დაზიანებული იყოს:

```bash
rm -rf ~/.prx-sd/signatures
sd update
```

### Adblock: "insufficient privileges"

adblock-ის ჩართვა/გამორთვის ბრძანებები სისტემის hosts ფაილს ცვლის და root-ს საჭიროებს:

```bash
sudo sd adblock enable
sudo sd adblock disable
```

### სკანი ფაილებს "timeout" შეცდომით გამოტოვებს

ფაილ-დონის timeout-ი ნაგულისხმევად 30 წამია. გაზარდეთ რთული ფაილებისთვის:

```bash
sd config set scan.timeout_per_file_ms 60000
```

## დახმარების მიღება

ზემოაღნიშნული გადაჭრებიდან არცერთი პრობლემას ვერ წყვეტს:

1. **არსებული issue-ების შემოწმება:** [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)
2. **ახალი issue-ის შეტანა** შემდეგით:
   - PRX-SD ვერსია (`sd info`)
   - ოპერაციული სისტემა და kernel-ის ვერსია
   - Debug ჟურნალის გამოტანა (`sd --log-level debug ...`)
   - გამეორების ნაბიჯები

## შემდეგი ნაბიჯები

- ძრავის ქცევის დაზუსტებისთვის [კონფიგურაციის ცნობარის](../configuration/reference) განხილვა
- საფრთხეების იდენტიფიკაციის გასაგებად [გამოვლენის ძრავის](../detection/) შესწავლა
- პრობლემების შეტყობინებისთვის [Alert-ების](../alerts/) დაყენება
