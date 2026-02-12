import { describe, expect, test } from "bun:test";
import { formatResult } from "../src/format.js";

describe("formatResult", () => {
  test("returns text as-is when json=false", () => {
    expect(formatResult("hello world", false)).toBe("hello world");
  });

  test("preserves newlines when json=false", () => {
    const text = "line1\nline2\nline3";
    expect(formatResult(text, false)).toBe(text);
  });

  test("wraps text in JSON object when json=true", () => {
    const result = formatResult("hello", true);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual({ result: "hello" });
  });

  test("pretty-prints JSON with 2-space indent", () => {
    const result = formatResult("hi", true);
    expect(result).toBe(JSON.stringify({ result: "hi" }, null, 2));
  });

  test("handles empty string", () => {
    expect(formatResult("", false)).toBe("");
    const parsed = JSON.parse(formatResult("", true));
    expect(parsed).toEqual({ result: "" });
  });

  test("handles text with special JSON characters", () => {
    const text = 'has "quotes" and \n newlines';
    const parsed = JSON.parse(formatResult(text, true));
    expect(parsed.result).toBe(text);
  });
});
