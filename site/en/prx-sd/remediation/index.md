---
title: Threat Response
description: Configure automatic threat remediation with response policies, persistence cleanup, and network isolation.
---

# Threat Response

PRX-SD's remediation engine provides automated threat response beyond simple detection. When a threat is identified, the engine can take graduated actions ranging from logging to full network isolation, depending on the configured policy.

## Response Types

| Action | Description | Reversible | Requires Root |
|--------|-------------|-----------|--------------|
| **Report** | Log the detection and continue. No action taken on the file. | N/A | No |
| **Quarantine** | Encrypt and move the file to the quarantine vault. | Yes | No |
| **Block** | Deny file access/execution via fanotify (Linux real-time only). | Yes | Yes |
| **Kill** | Terminate the process that created or is using the malicious file. | No | Yes |
| **Clean** | Remove malicious content from the file while preserving the original (e.g., macro removal from Office docs). | Partial | No |
| **Delete** | Permanently delete the malicious file from disk. | No | No |
| **Isolate** | Block all network access for the machine using firewall rules. | Yes | Yes |
| **Blocklist** | Add file hash to the local blocklist for future scans. | Yes | No |

## Policy Configuration

### Using sd policy Commands

```bash
# Show current policy
sd policy show

# Set policy for malicious detections
sd policy set on_malicious quarantine

# Set policy for suspicious detections
sd policy set on_suspicious report

# Reset to defaults
sd policy reset
```

### Example Output

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

### Configuration File

Set policies in `~/.prx-sd/config.toml`:

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
The `on_malicious` and `on_suspicious` policies accept different action sets. Destructive actions like `kill` and `delete` are only available for `on_malicious`.
:::

## Persistence Cleanup

When `clean_persistence` is enabled, PRX-SD scans for and removes persistence mechanisms that malware may have installed. This runs automatically after quarantining or deleting a threat.

### Linux Persistence Points

| Location | Technique | Cleanup Action |
|----------|-----------|----------------|
| `/etc/cron.d/`, `/var/spool/cron/` | Cron jobs | Remove malicious cron entries |
| `/etc/systemd/system/` | systemd services | Disable and remove malicious units |
| `~/.config/systemd/user/` | User systemd services | Disable and remove |
| `~/.bashrc`, `~/.profile` | Shell RC injection | Remove injected lines |
| `~/.ssh/authorized_keys` | SSH backdoor keys | Remove unauthorized keys |
| `/etc/ld.so.preload` | LD_PRELOAD hijacking | Remove malicious preload entries |
| `/etc/init.d/` | SysV init scripts | Remove malicious scripts |

### macOS Persistence Points

| Location | Technique | Cleanup Action |
|----------|-----------|----------------|
| `~/Library/LaunchAgents/` | LaunchAgent plists | Unload and remove |
| `/Library/LaunchDaemons/` | LaunchDaemon plists | Unload and remove |
| `~/Library/Application Support/` | Login items | Remove malicious items |
| `/Library/StartupItems/` | Startup items | Remove |
| `~/.zshrc`, `~/.bash_profile` | Shell RC injection | Remove injected lines |
| Keychain | Keychain abuse | Alert (no auto-cleanup) |

### Windows Persistence Points

| Location | Technique | Cleanup Action |
|----------|-----------|----------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | Registry Run keys | Remove malicious values |
| `HKLM\SYSTEM\CurrentControlSet\Services` | Malicious services | Stop, disable, and remove |
| `Startup` folder | Startup shortcuts | Remove malicious shortcuts |
| Task Scheduler | Scheduled tasks | Delete malicious tasks |
| WMI Subscriptions | WMI event consumers | Remove malicious subscriptions |

::: warning
Persistence cleanup modifies system configuration files and registry entries. Review the cleanup log at `~/.prx-sd/remediation.log` after each operation to verify that only malicious entries were removed.
:::

## Network Isolation

For critical threats (active ransomware, data exfiltration), PRX-SD can isolate the machine from the network:

### Linux (iptables)

```bash
# PRX-SD adds these rules automatically when isolating
iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD configures pf rules
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

Lift isolation:

```bash
sd isolate lift
```

::: warning
Network isolation blocks ALL network traffic including SSH. Ensure you have physical or out-of-band console access before enabling automatic network isolation.
:::

## Remediation Log

All remediation actions are logged to `~/.prx-sd/remediation.log`:

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

## Examples

```bash
# Set aggressive policy for servers
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# Set conservative policy for workstations
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# Scan with explicit remediation
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# Check and lift network isolation
sd isolate status
sd isolate lift

# View remediation history
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## Next Steps

- [Quarantine Management](/en/prx-sd/quarantine/) -- manage quarantined files
- [Ransomware Protection](/en/prx-sd/realtime/ransomware) -- specialized ransomware response
- [Webhook Alerts](/en/prx-sd/alerts/webhook) -- notify on remediation actions
- [Email Alerts](/en/prx-sd/alerts/email) -- email notifications for threats
