# deep-wiki

Give your coding agent instant knowledge of any public GitHub repo.

Inspired by Andrej Karpathy's [post on DeepWiki](https://x.com/karpathy/status/2021633574089416993) and the increasing malleability of software.

**Install the [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code)** so Claude can use [DeepWiki](https://deepwiki.com) directly on your behalf:

```bash
npx skills add https://github.com/seflless/deep-wiki npx --skill deep-wiki
```

**Ask anything:**

> "How does the fiber reconciler work in facebook/react?"

> "What's the architecture of oven-sh/bun?"

> "Compare how facebook/react and vercel/next.js handle server components"

## CLI

There's also a CLI if you want to use deep-wiki directly.

```bash
npm install -g @seflless/deep-wiki
```

Or use `npx @seflless/deep-wiki` without installing.

```bash
deep-wiki ask facebook/react "How does the fiber reconciler work?"
deep-wiki wiki oven-sh/bun
deep-wiki toc facebook/react
deep-wiki wiki anthropics/claude-code --json > docs.json
```

### Flags

| Flag          | Description       |
| ------------- | ----------------- |
| `--json`      | Output raw JSON   |
| `-q, --quiet` | Suppress spinners |
| `--no-color`  | Disable colors    |

## How it works

deep-wiki is a thin CLI wrapper around [DeepWiki's](https://deepwiki.com) MCP server. It sends JSON-RPC requests to DeepWiki's public API and formats the responses for terminal and agent consumption.

## License

MIT
