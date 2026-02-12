---
title: "feat: deepwiki CLI - DeepWiki wrapper for coding agents"
type: feat
date: 2026-02-11
---

# deepwiki CLI

CLI wrapper around DeepWiki's MCP server. Lets agents and humans query any public GitHub repo's docs from the terminal. Ships with a Claude Code skill, a simple website, and easy install paths (npm, curl|bash, PowerShell).

- **npm**: `@seflless/deepwiki`
- **bin**: `deepwiki`
- **repo**: `github.com/seflless/deepwiki`
- **skill install**: `npx skills add https://github.com/seflless/deepwiki --skill deepwiki`

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
deepwiki <subcommand> [options]
```

### Subcommands

| Command | Usage | Maps to |
|---------|-------|---------|
| `toc` | `deepwiki toc <owner/repo>` | `read_wiki_structure` |
| `wiki` | `deepwiki wiki <owner/repo>` | `read_wiki_contents` |
| `ask` | `deepwiki ask <owner/repo> "<question>"` | `ask_question` |
| `ask` | `deepwiki ask <repo1> <repo2> ... "<question>"` | `ask_question` (multi-repo, max 10) |

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
deepwiki toc facebook/react

# Full wiki
deepwiki wiki facebook/react

# Ask a question
deepwiki ask facebook/react "How does the fiber reconciler work?"

# Ask across multiple repos
deepwiki ask facebook/react vercel/next.js "How do server components work?"

# Pipe to a file
deepwiki wiki anthropics/claude-code --json > claude-code-docs.json

# Use in a script
ANSWER=$(deepwiki ask oven-sh/bun "What bundler formats are supported?")
```

## Monorepo Structure

```
deepwiki/
  package.json              # private, workspaces: ["packages/*"]
  bunfig.toml
  bun.lockb
  LICENSE                   # MIT
  README.md
  skills/
    deepwiki/
      SKILL.md              # Claude Code skill
  packages/
    cli/
      package.json          # name: "@seflless/deepwiki", bin: { "deepwiki": "./dist/index.js" }
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
      package.json          # name: "@deepwiki/website"
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
npm install -g @seflless/deepwiki

# Or run directly
npx @seflless/deepwiki ask facebook/react "What is JSX?"

# After global install
deepwiki ask facebook/react "What is JSX?"
```

- Ship bundled JS (single file via `bun build`)
- Shebang: `#!/usr/bin/env node` (works with Node or Bun)
- `bin` field in package.json
- Works on macOS, Linux, Windows automatically

### Secondary: curl|bash

```bash
curl -fsSL https://raw.githubusercontent.com/seflless/deepwiki/main/packages/cli/scripts/install.sh | bash
```

- Compiles per-platform binaries with `bun build --compile`
- Uploads to GitHub Releases
- `install.sh` detects platform, downloads correct binary
- `install.ps1` for Windows PowerShell

### Tertiary: Compiled binaries

- GitHub Releases with per-platform binaries
- Targets: darwin-arm64, darwin-x64, linux-x64, linux-arm64, windows-x64

## Claude Code Skill

Located at `skills/deepwiki/SKILL.md` in repo root.

Install: `npx skills add https://github.com/seflless/deepwiki --skill deepwiki`

### Skill Design

```yaml
---
name: deepwiki
description: >
  Query any public GitHub repo's documentation via DeepWiki.
  Use when needing to understand a library, framework, or dependency.
  Triggers on "look up docs", "how does X work", "deepwiki", "deepwiki".
---
```

**Key skill behaviors:**
- Uses `npx @seflless/deepwiki` pattern (no global install, assumes Node.js)
- Teaches agent the 3 subcommands with compact examples
- Uses `--json` flag when agent needs structured data
- Minimal tokens: table-based flag reference, no prose explanations

## Website

Domain: `deepwiki.sh` — hosted on Vercel.
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

- [x] npm publish config (name: @seflless/deepwiki, bin, files, access)
- [x] `install.sh` script for curl|bash
- [x] `install.ps1` for PowerShell
- [x] Cross-compile script (all 5 targets)

### Phase 4: Tests

Unit tests using `bun test`. Mock the MCP server (no live network calls in tests).

- [x] Test harness setup (`packages/cli/tests/`, bun test config)
- [x] `client.ts` tests — mock fetch, verify JSON-RPC request format, SSE parsing, error handling
- [x] `cli.ts` tests — arg parsing, repo validation, exit codes, --help/--version
- [x] `commands/toc.ts` tests — calls client correctly, formats output, respects --json
- [x] `commands/wiki.ts` tests — same as toc
- [x] `commands/ask.ts` tests — single repo, multi-repo (up to 10), question as last arg, errors
- [x] `format.ts` tests — human vs JSON output
- [x] `errors.ts` tests — correct exit codes per error type
- [x] Integration test — full CLI run with mocked server, verify stdout/stderr/exit code

### Phase 5: CI (blocks merge to main)

- [x] GitHub Actions: `bun test` on every PR (required status check)
- [x] GitHub Actions: `bun run build` on every PR (verify build doesn't break)
- [x] GitHub Actions: build + publish to npm on tag/release
- [x] GitHub Actions: cross-compile binaries + attach to GitHub Release
- [ ] Branch protection: require CI pass before merge to main

### Phase 3: Skill + Website + Docs

- [x] Claude Code skill (`skills/deepwiki/SKILL.md`)
- [x] Website (static HTML/CSS)
- [x] README.md
- [x] AGENTS.md (project conventions, dev commands, architecture) + CLAUDE.md symlink

## Acceptance Criteria

- [ ] `npx @seflless/deepwiki toc facebook/react` returns a table of contents
- [ ] `npx @seflless/deepwiki wiki facebook/react` returns full docs
- [ ] `npx @seflless/deepwiki ask facebook/react "What is JSX?"` returns an answer
- [ ] `npx @seflless/deepwiki ask repo1 repo2 "question"` works for multi-repo
- [ ] `--json` outputs raw server response
- [ ] `--help` shows usage for every command
- [ ] Works on macOS, Linux, Windows via npm
- [ ] Claude Code skill teaches usage via npx pattern
- [ ] Website shows install instructions and examples
- [ ] MIT licensed

## Open Questions

None — all resolved.
