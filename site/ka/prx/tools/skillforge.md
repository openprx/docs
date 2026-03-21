---
title: Skillforge
description: Automated skill discovery, evaluation, and integration pipeline for extending PRX agent capabilities.
---

# Skillforge

Skillforge is PRX's automated pipeline for discovering, evaluating, and integrating new skills (tools) from external sources. Instead of manually configuring every tool, Skillforge can scout GitHub repositories and the Clawhub registry, evaluate whether a discovered skill fits your agent's needs, and generate the integration manifest -- all without human intervention.

## მიმოხილვა

The Skillforge pipeline consists of three stages:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Scout      │────▶│   Evaluate   │────▶│  Integrate   │
│              │     │              │     │              │
│ Discover     │     │ Fitness      │     │ Manifest     │
│ skills from  │     │ scoring,     │     │ generation,  │
│ GitHub,      │     │ security     │     │ config       │
│ Clawhub      │     │ review       │     │ injection    │
└─────────────┘     └──────────────┘     └──────────────┘
```

| Stage | Trait | Responsibility |
|-------|-------|----------------|
| **Scout** | `Scout` | Discover candidate skills from configured sources |
| **Evaluate** | `Evaluator` | Score each candidate for fitness, security, and compatibility |
| **Integrate** | `Integrator` | Generate manifests and register skills into the tool registry |

## არქიტექტურა

Skillforge is built on three core async traits: `Scout` (discovers candidates matching `SearchCriteria`), `Evaluator` (scores candidates for fitness and security), and `Integrator` (generates manifests and registers skills). Each trait can have multiple implementations, and the pipeline orchestrator runs them in sequence, filtering candidates at each stage.

## კონფიგურაცია

```toml
[skillforge]
enabled = true

# Automatic discovery: periodically scout for new skills.
auto_discover = false
discover_interval_hours = 24

# Minimum evaluation score (0.0-1.0) for a skill to be integrated.
min_fitness_score = 0.7

# Require manual approval before integrating discovered skills.
require_approval = true

# Maximum number of skills to evaluate per discovery run.
max_candidates = 20
```

### Scout Sources

Configure where Skillforge looks for skills:

```toml
[skillforge.sources.github]
enabled = true

# GitHub repositories to search.
# Supports org/user patterns and topic-based discovery.
search_topics = ["prx-skill", "mcp-server", "ai-tool"]
search_orgs = ["openprx", "modelcontextprotocol"]

# Rate limiting for GitHub API calls.
max_requests_per_hour = 30

# GitHub token for higher rate limits (optional).
# token = "${GITHUB_TOKEN}"

[skillforge.sources.clawhub]
enabled = true

# Clawhub registry endpoint.
registry_url = "https://registry.clawhub.dev"

# Categories to search.
categories = ["tools", "integrations", "automation"]
```

## Scout Stage

The Scout discovers candidate skills from configured sources. Each source implements the `Scout` trait differently:

### GitHub Scout

Searches GitHub for repositories matching configured topics, organizations, or search queries. For each matching repository, the scout extracts:

- Repository metadata (name, description, stars, last update)
- README content (for capability analysis)
- Manifest files (`prx-skill.toml`, `mcp.json`, `package.json`)
- License information

### Clawhub Scout

Queries the Clawhub registry API for published skills. Clawhub provides structured metadata including:

- Skill name, version, and description
- Input/output schemas
- Dependency requirements
- Compatibility tags (PRX version, OS, runtime)

### Search Criteria

```rust
pub struct SearchCriteria {
    /// Keywords describing the desired capability.
    pub keywords: Vec<String>,

    /// Required runtime: "native", "docker", "wasm", or "any".
    pub runtime: String,

    /// Minimum repository stars (GitHub only).
    pub min_stars: u32,

    /// Maximum age of last commit in days.
    pub max_age_days: u32,

    /// Required license types (e.g., "MIT", "Apache-2.0").
    pub licenses: Vec<String>,
}
```

## Evaluate Stage

Each candidate passes through the Evaluator, which produces a fitness score and security assessment:

### Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Relevance** | 30% | How well the skill matches the search criteria |
| **Quality** | 25% | Code quality signals: tests, CI, documentation |
| **Security** | 25% | License compatibility, dependency audit, no unsafe patterns |
| **Maintenance** | 10% | Recent commits, active maintainers, issue response time |
| **Compatibility** | 10% | PRX version compatibility, runtime requirements met |

### Security Checks

The evaluator performs automated security analysis: license compatibility scanning, dependency vulnerability audit, dangerous code pattern detection (network calls, file system access, eval), and sandbox compatibility verification.

The `Evaluation` struct contains the overall `fitness_score` (0.0-1.0), per-criterion scores, a `security_status` (`safe`/`caution`/`blocked`), a human-readable summary, and a list of concerns.

## Integrate Stage

Skills that pass the evaluation threshold enter the integration stage:

### Manifest Generation

The Integrator generates a `Manifest` that describes how to install and register the skill:

```toml
# Generated manifest: ~/.local/share/openprx/skills/web-scraper/manifest.toml
[skill]
name = "web-scraper"
version = "1.2.0"
source = "github:example/web-scraper"
runtime = "docker"
fitness_score = 0.85
integrated_at = "2026-03-21T10:30:00Z"

[skill.tool]
name = "web_scrape"
description = "Scrape and extract structured data from web pages."

[skill.tool.parameters]
url = { type = "string", required = true, description = "URL to scrape" }
selector = { type = "string", required = false, description = "CSS selector" }
format = { type = "string", required = false, default = "text", description = "Output format" }

[skill.runtime]
image = "example/web-scraper:1.2.0"
network = "restricted"
timeout_secs = 30
```

### Registration

Once the manifest is generated, the skill is registered in the PRX tool registry. If `require_approval = true`, the manifest is staged for review:

```bash
# List pending skill integrations
prx skillforge pending

# Review a pending skill
prx skillforge review web-scraper

# Approve integration
prx skillforge approve web-scraper

# Reject integration
prx skillforge reject web-scraper --reason "Security concerns"
```

## CLI Commands

```bash
# Manually trigger a discovery run
prx skillforge discover

# Discover with specific keywords
prx skillforge discover --keywords "web scraping" "data extraction"

# Evaluate a specific repository
prx skillforge evaluate github:example/web-scraper

# List all integrated skills
prx skillforge list

# Show skill details
prx skillforge info web-scraper

# Remove an integrated skill
prx skillforge remove web-scraper

# Re-evaluate all integrated skills (check for updates, security issues)
prx skillforge audit
```

## Integration with Self-Evolution

Skillforge integrates with PRX's [self-evolution pipeline](/ka/prx/self-evolution/). When the agent identifies a capability gap, it can trigger a discovery run automatically -- scouting, evaluating, and (if approved) integrating a matching skill for the next turn.

## Security Notes

- **Approval gates** -- always set `require_approval = true` in production. Automated integration of untrusted code is a security risk.
- **Sandbox enforcement** -- integrated skills run within the same sandbox constraints as built-in tools. The sandbox backend must be configured.
- **Source trust** -- only enable scout sources that you trust. Public GitHub search can return malicious repositories.
- **Manifest review** -- review generated manifests before approval. Check the `runtime`, `network`, and `timeout_secs` settings.
- **Audit trail** -- all Skillforge operations are logged in the activity log for compliance review.

## Related Pages

- [Tools Overview](/ka/prx/tools/)
- [Self-Evolution Pipeline](/ka/prx/self-evolution/pipeline)
- [Security Policy Engine](/ka/prx/security/policy-engine)
- [Runtime Backends](/ka/prx/agent/runtime-backends)
- [MCP Integration](/ka/prx/tools/mcp)
