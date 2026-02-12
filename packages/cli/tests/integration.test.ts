import { describe, expect, test, mock, beforeEach, afterEach, spyOn } from "bun:test";

// Integration tests use mock.module for the client to test the full CLI flow
// (arg parsing -> command -> client -> format -> output) without hitting the network.

const mockReadWikiStructure = mock(async () => "# TOC\n- Getting Started");
const mockReadWikiContents = mock(async () => "# Full Wiki\nAll the content.");
const mockAskQuestion = mock(async () => "React uses fibers for reconciliation.");

mock.module("../src/client.js", () => ({
  readWikiStructure: mockReadWikiStructure,
  readWikiContents: mockReadWikiContents,
  askQuestion: mockAskQuestion,
}));

mock.module("../src/spinner.js", () => ({
  withSpinner: mock(async (_label: string, _quiet: boolean, fn: () => Promise<string>) => fn()),
}));

import { createProgram } from "../src/cli.js";
import { UsageError, ServerError } from "../src/errors.js";

describe("integration: full CLI flow", () => {
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    mockReadWikiStructure.mockClear();
    mockReadWikiContents.mockClear();
    mockAskQuestion.mockClear();
    logSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("toc command outputs wiki structure", async () => {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync(["node", "deepwiki", "toc", "facebook/react"]);

    expect(mockReadWikiStructure).toHaveBeenCalledWith("facebook/react");
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.calls[0][0]).toContain("# TOC");
  });

  test("wiki command with --json outputs JSON", async () => {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync(["node", "deepwiki", "--json", "wiki", "owner/repo"]);

    expect(mockReadWikiContents).toHaveBeenCalledWith("owner/repo");
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.result).toBe("# Full Wiki\nAll the content.");
  });

  test("ask command passes repos and question to client", async () => {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync([
      "node",
      "deepwiki",
      "ask",
      "facebook/react",
      "How does reconciliation work?",
    ]);

    expect(mockAskQuestion).toHaveBeenCalledWith(
      ["facebook/react"],
      "How does reconciliation work?",
    );
    expect(logSpy.mock.calls[0][0]).toContain("fibers");
  });

  test("ask with multiple repos passes array", async () => {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync([
      "node",
      "deepwiki",
      "ask",
      "facebook/react",
      "vercel/next.js",
      "SSR question",
    ]);

    expect(mockAskQuestion).toHaveBeenCalledWith(
      ["facebook/react", "vercel/next.js"],
      "SSR question",
    );
  });

  test("invalid repo format throws UsageError", async () => {
    const program = createProgram();
    program.exitOverride();

    try {
      await program.parseAsync(["node", "deepwiki", "toc", "noslash"]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(UsageError);
      expect((err as UsageError).exitCode).toBe(2);
    }
  });

  test("server error from client propagates", async () => {
    mockReadWikiStructure.mockImplementationOnce(async () => {
      throw new ServerError("DeepWiki server returned 503: Service Unavailable");
    });

    const program = createProgram();
    program.exitOverride();

    try {
      await program.parseAsync(["node", "deepwiki", "toc", "owner/repo"]);
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(ServerError);
      expect((err as ServerError).exitCode).toBe(1);
      expect((err as ServerError).message).toContain("503");
    }
  });

  test("--quiet flag is passed through", async () => {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync(["node", "deepwiki", "--quiet", "toc", "a/b"]);

    // The command should still work (quiet just suppresses spinner)
    expect(mockReadWikiStructure).toHaveBeenCalledWith("a/b");
  });
});
