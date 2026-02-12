import { ServerError } from "./errors.js";

const MCP_ENDPOINT = "https://mcp.deepwiki.com/mcp";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params: Record<string, unknown>;
  id: number;
}

interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: McpToolResult;
  error?: { code: number; message: string };
}

let requestId = 0;

function makeRequest(
  method: string,
  params: Record<string, unknown>,
): JsonRpcRequest {
  return {
    jsonrpc: "2.0",
    method,
    params,
    id: ++requestId,
  };
}

function parseSSE(raw: string): JsonRpcResponse {
  for (const line of raw.split("\n")) {
    if (line.startsWith("data: ")) {
      return JSON.parse(line.slice(6));
    }
  }
  throw new ServerError("No data in SSE response");
}

async function callMcp(
  toolName: string,
  args: Record<string, unknown>,
): Promise<string> {
  const body = makeRequest("tools/call", { name: toolName, arguments: args });

  const res = await fetch(MCP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new ServerError(
      `DeepWiki server returned ${res.status}: ${res.statusText}`,
    );
  }

  const raw = await res.text();
  const contentType = res.headers.get("content-type") || "";

  let rpc: JsonRpcResponse;
  if (contentType.includes("text/event-stream")) {
    rpc = parseSSE(raw);
  } else {
    rpc = JSON.parse(raw);
  }

  if (rpc.error) {
    throw new ServerError(`MCP error: ${rpc.error.message}`);
  }

  if (!rpc.result || rpc.result.isError) {
    const text = rpc.result?.content?.[0]?.text || "Unknown error";
    throw new ServerError(text);
  }

  return rpc.result.content[0].text;
}

export async function readWikiStructure(repoName: string): Promise<string> {
  return callMcp("read_wiki_structure", { repoName });
}

export async function readWikiContents(repoName: string): Promise<string> {
  return callMcp("read_wiki_contents", { repoName });
}

export async function askQuestion(
  repoNames: string[],
  question: string,
): Promise<string> {
  const repoName = repoNames.length === 1 ? repoNames[0] : repoNames;
  return callMcp("ask_question", { repoName, question });
}
