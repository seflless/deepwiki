# deep-wiki

CLI wrapper around DeepWiki's MCP server. Monorepo with Bun workspaces.

## Structure

```
packages/cli/       # @seflless/deep-wiki — the CLI (TypeScript, Bun)
packages/website/   # Landing page (Vite, vanilla TS)
skills/deep-wiki/   # Claude Code skill
docs/plans/         # Feature plans
```

## Dev Commands

```bash
bun install                          # Install deps
bun deep-wiki toc facebook/react     # Run CLI from source (no build needed)
bun deep-wiki ask oven-sh/bun "Q?"   # All CLI args work after `bun deep-wiki`
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
- `npx @seflless/deep-wiki` is the primary user-facing invocation pattern

## Known Issues

- `npx @seflless/deep-wiki` fails with `command not found` when run from inside the monorepo — npm resolves the local workspace instead of the registry. Use `bun deep-wiki` locally. Works fine from any other directory.

## npm Package

- Scoped: `@seflless/deep-wiki`
- Binary: `deep-wiki`
- Public access, MIT license
