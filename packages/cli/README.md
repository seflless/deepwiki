# deep-wiki

Give your coding agent instant knowledge of any public GitHub repo. Powered by [DeepWiki](https://deepwiki.com).

## Install the Skill

Add deep-wiki to [Claude Code](https://docs.anthropic.com/en/docs/claude-code) so your agent can look up docs for any public repo on demand:

```bash
npx skills add https://github.com/seflless/deep-wiki npx --skill deep-wiki
```

That's it. Claude Code will now use deep-wiki automatically when it needs to understand an unfamiliar codebase.

## Install the CLI

No install needed — just use `npx`:

```bash
npx @seflless/deep-wiki toc facebook/react
```

Or install globally:

```bash
npm install -g @seflless/deep-wiki
```

## Usage

```bash
# Table of contents for a repo
npx @seflless/deep-wiki toc facebook/react

# Full wiki
npx @seflless/deep-wiki wiki oven-sh/bun

# Ask a question
npx @seflless/deep-wiki ask facebook/react "How does the fiber reconciler work?"

# Ask across multiple repos (max 10)
npx @seflless/deep-wiki ask facebook/react vercel/next.js "How do server components work?"

# Pipe JSON to a file
npx @seflless/deep-wiki wiki anthropics/claude-code --json > docs.json
```

### Flags

| Flag | Description |
|------|-------------|
| `--json` | Output raw JSON |
| `-q, --quiet` | Suppress spinners |
| `--no-color` | Disable colors |

## How It Works

deep-wiki is a thin CLI wrapper around [DeepWiki's](https://deepwiki.com) MCP server. It sends JSON-RPC requests to DeepWiki's public API and formats the responses for terminal and agent consumption.

## License

MIT
