import { describe, expect, test, mock, beforeEach, spyOn } from "bun:test";
import { createProgram } from "../src/cli.js";
import { UsageError } from "../src/errors.js";

// Mock the command handlers so they don't actually call the MCP server
mock.module("../src/commands/toc.js", () => ({
  toc: mock(async () => {}),
}));
mock.module("../src/commands/wiki.js", () => ({
  wiki: mock(async () => {}),
}));
mock.module("../src/commands/ask.js", () => ({
  ask: mock(async () => {}),
}));

describe("createProgram", () => {
  test("program name is deepwiki", () => {
    const program = createProgram();
    expect(program.name()).toBe("deepwiki");
  });

  test("has toc, wiki, ask subcommands", () => {
    const program = createProgram();
    const names = program.commands.map((c) => c.name());
    expect(names).toContain("toc");
    expect(names).toContain("wiki");
    expect(names).toContain("ask");
  });
});

describe("repo validation", () => {
  test("rejects repo without slash", async () => {
    const program = createProgram();
    program.exitOverride();

    try {
      await program.parseAsync(["node", "deepwiki", "toc", "noslash"]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
      expect((err as UsageError).message).toContain("owner/repo");
    }
  });

  test("accepts repo with slash", async () => {
    const program = createProgram();
    program.exitOverride();

    // This should not throw (command handler is mocked)
    await program.parseAsync(["node", "deepwiki", "toc", "facebook/react"]);
  });

  test("rejects repo with empty owner", async () => {
    const program = createProgram();
    program.exitOverride();

    try {
      await program.parseAsync(["node", "deepwiki", "toc", "/repo"]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
    }
  });

  test("rejects repo with empty name", async () => {
    const program = createProgram();
    program.exitOverride();

    try {
      await program.parseAsync(["node", "deepwiki", "toc", "owner/"]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
    }
  });

  test("rejects repo with multiple slashes", async () => {
    const program = createProgram();
    program.exitOverride();

    try {
      await program.parseAsync(["node", "deepwiki", "toc", "a/b/c"]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
    }
  });

  test("accepts repo with dots, hyphens, underscores", async () => {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync(["node", "deepwiki", "toc", "my-org/my_repo.js"]);
  });
});

describe("ask command validation", () => {
  test("rejects ask with only 1 arg (no question)", async () => {
    const program = createProgram();
    program.exitOverride();

    try {
      await program.parseAsync(["node", "deepwiki", "ask", "facebook/react"]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
    }
  });

  test("rejects ask with more than 10 repos", async () => {
    const program = createProgram();
    program.exitOverride();

    const repos = Array.from({ length: 11 }, (_, i) => `owner/repo${i}`);
    try {
      await program.parseAsync([
        "node",
        "deepwiki",
        "ask",
        ...repos,
        "question?",
      ]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
      expect((err as UsageError).message).toContain("10 repos");
    }
  });

  test("accepts ask with repo + question", async () => {
    const program = createProgram();
    program.exitOverride();

    await program.parseAsync([
      "node",
      "deepwiki",
      "ask",
      "facebook/react",
      "What is JSX?",
    ]);
  });

  test("validates each repo in multi-repo ask", async () => {
    const program = createProgram();
    program.exitOverride();

    try {
      await program.parseAsync([
        "node",
        "deepwiki",
        "ask",
        "facebook/react",
        "noslash",
        "question?",
      ]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
      expect((err as UsageError).message).toContain("owner/repo");
    }
  });
});

describe("global options", () => {
  test("--json flag defaults to false", async () => {
    const program = createProgram();
    program.exitOverride();
    // Parse with a valid command to avoid "no subcommand" help output
    await program.parseAsync(["node", "deepwiki", "toc", "a/b"]);
    expect(program.opts().json).toBe(false);
  });

  test("--quiet flag defaults to false", async () => {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync(["node", "deepwiki", "toc", "a/b"]);
    expect(program.opts().quiet).toBe(false);
  });
});

describe("--version", () => {
  test("outputs version string", () => {
    const program = createProgram();
    program.exitOverride();
    program.configureOutput({ writeOut: () => {} });

    try {
      program.parse(["node", "deepwiki", "--version"]);
    } catch (err: any) {
      // Commander throws on exitOverride for --version
      expect(err.code).toBe("commander.version");
    }
  });
});

describe("--help", () => {
  test("outputs help text", () => {
    const program = createProgram();
    program.exitOverride();
    program.configureOutput({ writeOut: () => {} });

    try {
      program.parse(["node", "deepwiki", "--help"]);
    } catch (err: any) {
      expect(err.code).toBe("commander.helpDisplayed");
    }
  });
});
