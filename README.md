# deep-wiki

Query any public GitHub repo's docs from the terminal. Powered by [DeepWiki](https://deepwiki.com).

## Quick Start

No install needed — just use `npx`:

```bash
npx @seflless/deep-wiki toc facebook/react
```

## Usage

```bash
# Table of contents
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

## Install Globally (optional)

```bash
npm install -g @seflless/deep-wiki
deep-wiki toc facebook/react
```

Or via curl:

```bash
curl -fsSL https://raw.githubusercontent.com/seflless/deep-wiki/main/packages/cli/scripts/install.sh | bash
```

## Flags

| Flag | Description |
|------|-------------|
| `--json` | Output raw JSON |
| `-q, --quiet` | Suppress spinners |
| `--no-color` | Disable colors |
| `--help` | Show help |
| `--version` | Show version |

## Claude Code Skill

```bash
npx skills add https://github.com/seflless/deep-wiki npx --skill deep-wiki
```

Once installed, Claude Code can look up docs for any public repo automatically.

## How it works

deep-wiki is a thin CLI wrapper around [DeepWiki's](https://deepwiki.com) MCP server. It sends requests to DeepWiki's public API and formats the responses for terminal use.

## License

MIT
