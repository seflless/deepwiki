import { Command } from "commander";
import { toc } from "./commands/toc.js";
import { wiki } from "./commands/wiki.js";
import { ask } from "./commands/ask.js";
import { DeepWikiError, UsageError } from "./errors.js";
import chalk from "chalk";

const version = "0.1.0";

function getGlobalOpts(cmd: Command) {
  const root = cmd.parent ?? cmd;
  return {
    json: root.opts().json as boolean,
    quiet: root.opts().quiet as boolean,
  };
}

export function createProgram(): Command {
  const program = new Command()
    .name("deepwiki")
    .description(
      "Query any public GitHub repo's docs via DeepWiki",
    )
    .version(version)
    .option("--json", "Output raw JSON from server", false)
    .option("-q, --quiet", "Suppress non-essential output", false)
    .option("--no-color", "Disable colors");

  program
    .command("toc")
    .description("Get the table of contents for a repo's wiki")
    .argument("<repo>", "GitHub repo (owner/repo)")
    .action(async (repo: string, _opts: unknown, cmd: Command) => {
      validateRepo(repo);
      await toc(repo, getGlobalOpts(cmd));
    });

  program
    .command("wiki")
    .description("Get the full wiki content for a repo")
    .argument("<repo>", "GitHub repo (owner/repo)")
    .action(async (repo: string, _opts: unknown, cmd: Command) => {
      validateRepo(repo);
      await wiki(repo, getGlobalOpts(cmd));
    });

  program
    .command("ask")
    .description("Ask a question about one or more repos")
    .argument("<repos...>", 'One or more repos followed by a "question"')
    .action(async (args: string[], _opts: unknown, cmd: Command) => {
      if (args.length < 2) {
        throw new UsageError(
          'Usage: deepwiki ask <owner/repo> [more repos...] "<question>"',
        );
      }

      const question = args[args.length - 1];
      const repos = args.slice(0, -1);

      if (repos.length > 10) {
        throw new UsageError("Maximum 10 repos allowed");
      }

      for (const repo of repos) {
        validateRepo(repo);
      }

      await ask(repos, question, getGlobalOpts(cmd));
    });

  return program;
}

const REPO_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;

function validateRepo(repo: string) {
  if (!REPO_RE.test(repo)) {
    throw new UsageError(
      `Invalid repo "${repo}" — expected format: owner/repo`,
    );
  }
}

export async function run(argv: string[]) {
  const program = createProgram();

  try {
    await program.parseAsync(argv);
  } catch (err) {
    if (err instanceof DeepWikiError) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(err.exitCode);
    }
    if (err instanceof Error) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
    throw err;
  }
}
