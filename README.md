# OpenPRX Documentation

Official documentation for the [OpenPRX](https://github.com/openprx) ecosystem.

**Live site:** [docs.openprx.dev](https://docs.openprx.dev)

## Products

| Product | Path | Status |
|---------|------|--------|
| PRX | `/prx/` | In progress |
| OpenPR | `/openpr/` | Planned |
| PRX-SD | `/prx-sd/` | Planned |
| PRX-WAF | `/prx-waf/` | Planned |
| Fenfa | `/fenfa/` | Planned |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
site/
  en/prx/          # English PRX docs
  zh/prx/          # Chinese PRX docs
  .vitepress/
    config.ts      # VitePress config
    theme/         # Custom theme
    locales/       # i18n sidebar/nav configs
```

## Contributing

1. Fork and clone this repo
2. Create a feature branch
3. Write/edit markdown files in `site/{lang}/{product}/`
4. Run `npm run dev` to preview
5. Submit a PR

## License

Apache-2.0
