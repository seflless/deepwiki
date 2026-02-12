---
name: deep-wiki
description: >
  Query any public GitHub repo's documentation via DeepWiki.
  Use when needing to understand a library, framework, or dependency.
  Triggers on "look up docs", "how does X work", "deepwiki", "deep-wiki".
---

# deep-wiki

Query any public GitHub repo's docs from the terminal via DeepWiki. Assumes Node.js is installed.

## Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `toc`   | `npx @seflless/deep-wiki toc <owner/repo>` | Table of contents |
| `wiki`  | `npx @seflless/deep-wiki wiki <owner/repo>` | Full wiki content |
| `ask`   | `npx @seflless/deep-wiki ask <owner/repo> "<question>"` | AI-powered Q&A |
| `ask`   | `npx @seflless/deep-wiki ask <repo1> <repo2> "<question>"` | Multi-repo Q&A (max 10) |

## Flags

| Flag | Purpose |
|------|---------|
| `--json` | Raw JSON output (good for piping) |
| `-q, --quiet` | No spinners/progress |
| `--no-color` | Disable colors |

## Examples

```bash
# Understand a library's structure
npx @seflless/deep-wiki toc facebook/react

# Get full docs for reference
npx @seflless/deep-wiki wiki oven-sh/bun --json > bun-docs.json

# Ask a specific question
npx @seflless/deep-wiki ask anthropics/claude-code "How does the tool permission system work?"

# Cross-project question
npx @seflless/deep-wiki ask facebook/react vercel/next.js "How do server components work across these projects?"
```

## Tips

- Use `--json` when you need structured data to parse
- Use `toc` first to understand what docs exist, then `ask` for specifics
- Multi-repo `ask` is great for understanding how libraries interact
