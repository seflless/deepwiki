# deep-wiki

Query any public GitHub repo's docs from the terminal. Powered by [DeepWiki](https://deepwiki.com).

## Install

```bash
npm install -g @seflless/deep-wiki
```

Or with curl:

```bash
curl -fsSL https://raw.githubusercontent.com/seflless/deep-wiki/main/packages/cli/scripts/install.sh | bash
```

## Usage

```bash
# Table of contents
deep-wiki toc facebook/react

# Full wiki
deep-wiki wiki facebook/react

# Ask a question
deep-wiki ask facebook/react "How does the fiber reconciler work?"

# Ask across multiple repos
deep-wiki ask facebook/react vercel/next.js "How do server components work?"
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
