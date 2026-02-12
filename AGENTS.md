# deepwiki

CLI wrapper around DeepWiki's MCP server. Monorepo with Bun workspaces.

## Structure

```
packages/cli/       # @seflless/deepwiki — the CLI (TypeScript, Bun)
packages/website/   # Landing page (Vite, vanilla TS)
skills/deepwiki/   # Claude Code skill
docs/plans/         # Feature plans
```

## Dev Commands

```bash
bun install                          # Install deps
bun deepwiki toc facebook/react     # Run CLI from source (no build needed)
bun deepwiki ask oven-sh/bun "Q?"   # All CLI args work after `bun deepwiki`
bun run --cwd packages/cli build     # Build single JS bundle to dist/
bun test                             # Run all tests
bun run --cwd packages/website dev   # Website dev server
```

## Architecture

- **MCP client** (`packages/cli/src/client.ts`): POST JSON-RPC 2.0 to `https://mcp.deepwiki.com/mcp`, parse SSE responses
- **Commands** (`packages/cli/src/commands/`): `toc.ts`, `wiki.ts`, `ask.ts` — each calls client + formats output
- **CLI** (`packages/cli/src/cli.ts`): Commander.js routing, global flags, error handling
- **Entry** (`packages/cli/src/index.ts`): shebang + run
- **Build**: `bun build` bundles to single `dist/index.js` with `#!/usr/bin/env node` shebang

## Conventions

- TypeScript strict mode, ESM throughout
- chalk for colors, ora for spinners (stderr only)
- Content to stdout, errors/spinners to stderr
- Exit code 1 = server/network error, 2 = usage error
- Commander.js for CLI framework
- `bun test` for testing, mock fetch (no live network calls in tests)
- `npx @seflless/deepwiki` is the primary user-facing invocation pattern

## Known Issues

- `npx @seflless/deepwiki` fails with `command not found` when run from inside the monorepo — npm resolves the local workspace instead of the registry. Use `bun deepwiki` locally. Works fine from any other directory.

## npm Package

- Scoped: `@seflless/deepwiki`
- Binary: `deepwiki`
- Public access, MIT license
- README: root `README.md` is source of truth. `prepublishOnly` copies it into `packages/cli/` before publish. The copy is gitignored — do NOT symlink (npm skips symlinks when packing).
