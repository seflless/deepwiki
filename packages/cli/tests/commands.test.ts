import { describe, expect, test, mock, spyOn, beforeEach, afterEach } from "bun:test";

// Mock all client exports
const mockReadWikiStructure = mock(async () => "# Table of Contents\n- Intro\n- API");
const mockReadWikiContents = mock(async () => "# Full Wiki\nContent here.");
const mockAskQuestion = mock(async () => "The answer is 42.");

mock.module("../src/client.js", () => ({
  readWikiStructure: mockReadWikiStructure,
  readWikiContents: mockReadWikiContents,
  askQuestion: mockAskQuestion,
}));

// Mock spinner to just run the function directly, capture label
let capturedSpinnerLabel = "";
mock.module("../src/spinner.js", () => ({
  withSpinner: mock(async (label: string, _quiet: boolean, fn: () => Promise<string>) => {
    capturedSpinnerLabel = label;
    return fn();
  }),
}));

import { toc } from "../src/commands/toc.js";
import { wiki } from "../src/commands/wiki.js";
import { ask } from "../src/commands/ask.js";

describe("toc command", () => {
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    mockReadWikiStructure.mockClear();
    capturedSpinnerLabel = "";
    logSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("calls readWikiStructure with repo", async () => {
    await toc("facebook/react", { json: false, quiet: false });
    expect(mockReadWikiStructure).toHaveBeenCalledWith("facebook/react");
  });

  test("outputs plain text by default", async () => {
    await toc("facebook/react", { json: false, quiet: false });
    expect(logSpy).toHaveBeenCalledWith("# Table of Contents\n- Intro\n- API");
  });

  test("outputs JSON when json=true", async () => {
    await toc("facebook/react", { json: true, quiet: false });
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.result).toBe("# Table of Contents\n- Intro\n- API");
  });
});

describe("wiki command", () => {
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    mockReadWikiContents.mockClear();
    capturedSpinnerLabel = "";
    logSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("calls readWikiContents with repo", async () => {
    await wiki("oven-sh/bun", { json: false, quiet: false });
    expect(mockReadWikiContents).toHaveBeenCalledWith("oven-sh/bun");
  });

  test("outputs plain text by default", async () => {
    await wiki("oven-sh/bun", { json: false, quiet: false });
    expect(logSpy).toHaveBeenCalledWith("# Full Wiki\nContent here.");
  });

  test("outputs JSON when json=true", async () => {
    await wiki("oven-sh/bun", { json: true, quiet: false });
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.result).toBe("# Full Wiki\nContent here.");
  });
});

describe("ask command", () => {
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    mockAskQuestion.mockClear();
    capturedSpinnerLabel = "";
    logSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test("calls askQuestion with repos and question", async () => {
    await ask(["facebook/react"], "What is JSX?", { json: false, quiet: false });
    expect(mockAskQuestion).toHaveBeenCalledWith(["facebook/react"], "What is JSX?");
  });

  test("single repo spinner label includes repo name", async () => {
    await ask(["facebook/react"], "question", { json: false, quiet: false });
    expect(capturedSpinnerLabel).toContain("facebook/react");
  });

  test("multi-repo spinner label includes count", async () => {
    await ask(["a/b", "c/d", "e/f"], "question", { json: false, quiet: false });
    expect(capturedSpinnerLabel).toContain("3 repos");
  });

  test("outputs plain text by default", async () => {
    await ask(["facebook/react"], "question", { json: false, quiet: false });
    expect(logSpy).toHaveBeenCalledWith("The answer is 42.");
  });

  test("outputs JSON when json=true", async () => {
    await ask(["facebook/react"], "question", { json: true, quiet: false });
    const output = logSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.result).toBe("The answer is 42.");
  });
});
