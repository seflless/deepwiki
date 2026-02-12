---
title: "feat: deep-wiki CLI - DeepWiki wrapper for coding agents"
type: feat
date: 2026-02-11
---

# deep-wiki CLI

CLI wrapper around DeepWiki's MCP server. Lets agents and humans query any public GitHub repo's docs from the terminal. Ships with a Claude Code skill, a simple website, and easy install paths (npm, curl|bash, PowerShell).

- **npm**: `@seflless/deep-wiki`
- **bin**: `deep-wiki`
- **repo**: `github.com/seflless/deep-wiki`
- **skill install**: `npx skills add https://github.com/seflless/deep-wiki npx --skill deep-wiki`

## DeepWiki MCP Server (what we're wrapping)

Server: `https://mcp.deepwiki.com/mcp` (Streamable HTTP, no auth, free)
Version: 2.14.3 (fastmcp)

### Tools (exact schemas from server)

| Tool | Params | Description |
|------|--------|-------------|
| `read_wiki_structure` | `repoName: string` (owner/repo) | Get docs table of contents |
| `read_wiki_contents` | `repoName: string` (owner/repo) | Get full wiki content |
| `ask_question` | `repoName: string \| string[]` (max 10), `question: string` | AI-powered Q&A about repo(s) |
| `list_available_repos` | (private mode only) | N/A for public CLI |

All outputs: `{ result: string }`

## CLI Design

```
deep-wiki <subcommand> [options]
```

### Subcommands

| Command | Usage | Maps to |
|---------|-------|---------|
| `toc` | `deep-wiki toc <owner/repo>` | `read_wiki_structure` |
| `wiki` | `deep-wiki wiki <owner/repo>` | `read_wiki_contents` |
| `ask` | `deep-wiki ask <owner/repo> "<question>"` | `ask_question` |
| `ask` | `deep-wiki ask <repo1> <repo2> ... "<question>"` | `ask_question` (multi-repo, max 10) |

### Global Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `-h, --help` | — | Show help |
| `--version` | — | Print version |
| `--json` | false | Output raw JSON from server |
| `-q, --quiet` | false | Suppress non-essential output |
| `--no-color` | auto | Disable colors (also respects `NO_COLOR`) |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Server/network error |
| 2 | Invalid usage (bad args) |

### Output Contract

- **stdout**: Wiki content / answer text (human-friendly by default, `--json` for raw)
- **stderr**: Errors, progress indicators
- TTY detection: show spinners on TTY, plain text in pipes

### Example Invocations

```bash
# Table of contents for a repo
deep-wiki toc facebook/react

# Full wiki
deep-wiki wiki facebook/react

# Ask a question
deep-wiki ask facebook/react "How does the fiber reconciler work?"

# Ask across multiple repos
deep-wiki ask facebook/react vercel/next.js "How do server components work?"

# Pipe to a file
deep-wiki wiki anthropics/claude-code --json > claude-code-docs.json

# Use in a script
ANSWER=$(deep-wiki ask oven-sh/bun "What bundler formats are supported?")
```

## Monorepo Structure

```
deep-wiki/
  package.json              # private, workspaces: ["packages/*"]
  bunfig.toml
  bun.lockb
  LICENSE                   # MIT
  README.md
  skills/
    deep-wiki/
      SKILL.md              # Claude Code skill
  packages/
    cli/
      package.json          # name: "@seflless/deep-wiki", bin: { "deep-wiki": "./dist/index.js" }
      tsconfig.json
      src/
        index.ts            # Entry point (shebang)
        cli.ts              # Arg parsing, subcommand routing
        commands/
          toc.ts
          wiki.ts
          ask.ts
        client.ts           # HTTP client for MCP server
        format.ts           # Output formatting (human vs JSON)
        errors.ts           # Error types + exit codes
      scripts/
        install.sh          # curl|bash installer
        install.ps1         # PowerShell installer
    website/
      package.json          # name: "@deep-wiki/website"
      src/
        index.html          # Simple landing page
        style.css
```

## Tech Choices

| Decision | Choice | Why |
|----------|--------|-----|
| Runtime | Bun | Requested, fast, great DX |
| Language | TypeScript | Requested |
| CLI framework | Commander.js | Battle-tested, good help text generation, ubiquitous |
| Monorepo | Bun workspaces | Native, zero config for 2 packages |
| Build/bundle | Bun bundler (`bun build`) | Ship single JS file, no compile step needed |
| HTTP client | Native `fetch` | Built into Bun, no deps |
| Output | chalk + ora | Colors + spinners (both tiny, well-maintained) |
| Website | Vite (vanilla TS) | Dev server + easy Vercel deploy, no framework bloat |
| License | MIT | Requested |

## Distribution Strategy

### Primary: npm

```bash
# Install globally
npm install -g @seflless/deep-wiki

# Or run directly
npx @seflless/deep-wiki ask facebook/react "What is JSX?"

# After global install
deep-wiki ask facebook/react "What is JSX?"
```

- Ship bundled JS (single file via `bun build`)
- Shebang: `#!/usr/bin/env node` (works with Node or Bun)
- `bin` field in package.json
- Works on macOS, Linux, Windows automatically

### Secondary: curl|bash

```bash
curl -fsSL https://raw.githubusercontent.com/seflless/deep-wiki/main/packages/cli/scripts/install.sh | bash
```

- Compiles per-platform binaries with `bun build --compile`
- Uploads to GitHub Releases
- `install.sh` detects platform, downloads correct binary
- `install.ps1` for Windows PowerShell

### Tertiary: Compiled binaries

- GitHub Releases with per-platform binaries
- Targets: darwin-arm64, darwin-x64, linux-x64, linux-arm64, windows-x64

## Claude Code Skill

Located at `skills/deep-wiki/SKILL.md` in repo root.

Install: `npx skills add https://github.com/seflless/deep-wiki npx --skill deep-wiki`

### Skill Design

```yaml
---
name: deep-wiki
description: >
  Query any public GitHub repo's documentation via DeepWiki.
  Use when needing to understand a library, framework, or dependency.
  Triggers on "look up docs", "how does X work", "deepwiki", "deep-wiki".
---
```

**Key skill behaviors:**
- Auto-checks if deep-wiki is installed, installs via npm if not
- Teaches agent the 3 subcommands with compact examples
- Uses `--json` flag when agent needs structured data
- Minimal tokens: table-based flag reference, no prose explanations

### Skill Content Outline

1. Setup check (`command -v deep-wiki`)
2. Install if missing (`npm install -g @seflless/deep-wiki`)
3. Subcommand reference table
4. 3-4 example invocations
5. Tips: use `--json` for piping, multi-repo ask for cross-project questions

## Website

Domain: `deep-wiki.sh` — hosted on Vercel.
Simple single-page site at `packages/website/`, built with Vite (vanilla TS template, no React).

- Hero: name, one-liner, install command (copy button)
- 3 usage examples (toc, wiki, ask)
- Link to GitHub repo
- Link to npm package
- "Works with Claude Code" badge/section showing skill install
- Footer: MIT license, made by Decode

## Implementation Phases

### Phase 1: Core CLI (MVP)

- [x] Init monorepo (root package.json, bun workspaces)
- [x] `packages/cli` scaffolding (package.json, tsconfig, src/)
- [x] MCP HTTP client (`client.ts`) — POST to `https://mcp.deepwiki.com/mcp`
- [x] 3 subcommands: `toc`, `wiki`, `ask`
- [x] Human-friendly output formatting
- [x] `--json` flag
- [x] `--help` and `--version`
- [x] Error handling with proper exit codes
- [x] Build script (bun build for single JS bundle)

### Phase 2: Distribution

- [ ] npm publish config (name: @seflless/deep-wiki, bin, files, access)
- [ ] `install.sh` script for curl|bash
- [ ] `install.ps1` for PowerShell
- [ ] Cross-compile script (all 5 targets)

### Phase 2b: CI (later)

- [ ] GitHub Actions: test on PR
- [ ] GitHub Actions: build + publish to npm on tag/release
- [ ] GitHub Actions: cross-compile binaries + attach to GitHub Release

### Phase 3: Skill + Website + Docs

- [ ] Claude Code skill (`skills/deep-wiki/SKILL.md`)
- [ ] Website (static HTML/CSS)
- [ ] README.md
- [ ] AGENTS.md (project conventions, dev commands, architecture) + CLAUDE.md symlink

## Acceptance Criteria

- [ ] `npx @seflless/deep-wiki toc facebook/react` returns a table of contents
- [ ] `npx @seflless/deep-wiki wiki facebook/react` returns full docs
- [ ] `npx @seflless/deep-wiki ask facebook/react "What is JSX?"` returns an answer
- [ ] `npx @seflless/deep-wiki ask repo1 repo2 "question"` works for multi-repo
- [ ] `--json` outputs raw server response
- [ ] `--help` shows usage for every command
- [ ] Works on macOS, Linux, Windows via npm
- [ ] Claude Code skill auto-installs and teaches usage
- [ ] Website shows install instructions and examples
- [ ] MIT licensed

## Open Questions

None — all resolved.
