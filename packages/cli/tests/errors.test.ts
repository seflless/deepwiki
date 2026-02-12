import { describe, expect, test } from "bun:test";
import { DeepWikiError, UsageError, ServerError } from "../src/errors.js";

describe("DeepWikiError", () => {
  test("has default exit code 1", () => {
    const err = new DeepWikiError("boom");
    expect(err.exitCode).toBe(1);
    expect(err.message).toBe("boom");
    expect(err.name).toBe("DeepWikiError");
  });

  test("accepts custom exit code", () => {
    const err = new DeepWikiError("boom", 42);
    expect(err.exitCode).toBe(42);
  });

  test("is an instance of Error", () => {
    expect(new DeepWikiError("x")).toBeInstanceOf(Error);
  });
});

describe("UsageError", () => {
  test("has exit code 2", () => {
    const err = new UsageError("bad args");
    expect(err.exitCode).toBe(2);
    expect(err.name).toBe("UsageError");
  });

  test("is an instance of DeepWikiError", () => {
    expect(new UsageError("x")).toBeInstanceOf(DeepWikiError);
  });
});

describe("ServerError", () => {
  test("has exit code 1", () => {
    const err = new ServerError("down");
    expect(err.exitCode).toBe(1);
    expect(err.name).toBe("ServerError");
  });

  test("is an instance of DeepWikiError", () => {
    expect(new ServerError("x")).toBeInstanceOf(DeepWikiError);
  });
});
