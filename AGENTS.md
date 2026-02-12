# deep-wiki

CLI wrapper around DeepWiki's MCP server. Monorepo with Bun workspaces.

## Structure

```
packages/cli/     # @seflless/deep-wiki — the CLI (TypeScript, Bun)
packages/website/ # Landing page (Vite, vanilla TS)
skills/deep-wiki/ # Claude Code skill
```

## Dev Commands

```bash
# Install deps
bun install

# Run CLI in dev mode
bun run packages/cli/src/index.ts toc facebook/react

# Build CLI (single JS bundle)
bun run --cwd packages/cli build

# Cross-compile binaries (all platforms)
bun run packages/cli/scripts/cross-compile.ts

# Dev server for website
bun run --cwd packages/website dev
```

## Architecture

- **MCP client** (`packages/cli/src/client.ts`): POST JSON-RPC 2.0 to `https://mcp.deepwiki.com/mcp`, parse SSE responses
- **Commands** (`packages/cli/src/commands/`): `toc.ts`, `wiki.ts`, `ask.ts` — each calls client + formats output
- **CLI** (`packages/cli/src/cli.ts`): Commander.js routing, global flags, error handling
- **Build**: `bun build` bundles to single `dist/index.js` with shebang

## Conventions

- TypeScript strict mode
- ESM throughout (`"type": "module"`)
- chalk for colors, ora for spinners
- Errors go to stderr, content to stdout
- Exit code 1 = server/network error, 2 = usage error
- Commander.js for CLI framework
- No tests yet (live MCP server dependency)

## npm Package

- Scoped: `@seflless/deep-wiki`
- Binary: `deep-wiki`
- Public access
