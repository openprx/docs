---
title: Ad & Malicious Domain Blocking
description: Block ads, trackers, and malicious domains at the DNS level using the sd adblock command. Supports multiple filter lists, custom rules, and persistent logging.
---

# Ad & Malicious Domain Blocking

PRX-SD includes a built-in adblock engine that blocks ads, trackers, and known malicious domains at the DNS level by writing entries to the system hosts file (`/etc/hosts` on Linux/macOS, `C:\Windows\System32\drivers\etc\hosts` on Windows). Filter lists are stored locally under `~/.prx-sd/adblock/` and support both Adblock Plus (ABP) syntax and hosts-file format.

## How It Works

When you enable adblock, PRX-SD:

1. Downloads configured filter lists (EasyList, abuse.ch URLhaus, etc.)
2. Parses ABP rules (`||domain.com^`) and hosts entries (`0.0.0.0 domain.com`)
3. Writes all blocked domains to the system hosts file, pointing them to `0.0.0.0`
4. Logs every blocked domain lookup to `~/.prx-sd/adblock/blocked_log.jsonl`

::: tip
For full DNS-level filtering with upstream forwarding, combine adblock with the [DNS proxy](./dns-proxy). The proxy integrates adblock rules, IOC domain feeds, and custom blocklists in a single resolver.
:::

## Commands

### Enable Protection

Download filter lists and install DNS blocking via the hosts file. Requires root/administrator privileges.

```bash
sudo sd adblock enable
```

Output:

```
>>> Enabling adblock protection...
  Loaded 4 lists (128432 rules)
success: Adblock enabled: 95211 domains blocked via /etc/hosts
  Lists: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  Log: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### Disable Protection

Remove all PRX-SD entries from the hosts file. Credentials and cached lists are preserved.

```bash
sudo sd adblock disable
```

### Sync Filter Lists

Force re-download all configured filter lists. If adblock is currently enabled, the hosts file is automatically updated with the fresh rules.

```bash
sudo sd adblock sync
```

### View Statistics

Display the current status, loaded lists, rule count, and block log size.

```bash
sd adblock stats
```

Output:

```
Adblock Engine Statistics
  Status:        ENABLED
  Lists loaded:  4
  Total rules:   128432
  Cache dir:     /home/user/.prx-sd/adblock
  Last sync:     2026-03-20T14:30:00Z
  Blocked log:   1842 entries

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### Check a URL or Domain

Test whether a specific URL or domain is blocked by the current filter lists.

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

If the domain is not fully qualified with a scheme, PRX-SD automatically prepends `https://`.

Output:

```
BLOCKED ads.example.com -> Ads
```

or:

```
ALLOWED docs.example.com
```

### View Block Log

Display recent blocked entries from the persistent JSONL log. The `--count` flag controls how many entries to show (default: 50).

```bash
sd adblock log
sd adblock log --count 100
```

Each log entry contains a timestamp, domain, URL, category, and source.

### Add a Custom Filter List

Add a third-party or custom filter list by name and URL. The `--category` flag classifies the list (default: `unknown`).

Available categories: `ads`, `tracking`, `malware`, `social`.

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### Remove a Filter List

Remove a previously added filter list by name.

```bash
sd adblock remove my-blocklist
```

## Default Filter Lists

PRX-SD ships with the following built-in filter sources:

| List | Category | Description |
|------|----------|-------------|
| EasyList | Ads | Community-maintained ad filter list |
| EasyPrivacy | Tracking | Tracker and fingerprinting protection |
| URLhaus Domains | Malware | abuse.ch malicious URL domains |
| Malware Domains | Malware | Known malware distribution domains |

## Filter List Format

Custom lists can use either Adblock Plus (ABP) syntax or hosts-file format:

**ABP format:**

```
||ads.example.com^
||tracker.analytics.io^
```

**Hosts format:**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

Lines starting with `!`, `#`, or `[` are treated as comments and ignored.

## Data Directory Structure

```
~/.prx-sd/adblock/
  enabled           # Flag file (present when adblock is active)
  config.json       # Source list configuration
  blocked_log.jsonl # Persistent block log
  lists/            # Cached filter list files
```

::: warning
Enabling and disabling adblock modifies your system hosts file. Always use `sd adblock disable` to cleanly remove entries rather than editing the hosts file manually. The command requires root/administrator privileges.
:::

## Examples

**Full setup workflow:**

```bash
# Enable with default lists
sudo sd adblock enable

# Add a custom malware blocklist
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# Re-sync to download the new list
sudo sd adblock sync

# Verify a known malicious domain is blocked
sd adblock check malware-c2.example.com

# Check stats
sd adblock stats

# View recent blocks
sd adblock log --count 20
```

**Disable and clean up:**

```bash
sudo sd adblock disable
```

## Next Steps

- Set up the [DNS Proxy](./dns-proxy) for full DNS-level filtering with upstream forwarding
- Configure [Webhook Alerts](../alerts/) to get notified when domains are blocked
- Explore the [CLI Reference](../cli/) for the full command list
