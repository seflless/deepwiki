export function formatResult(text: string, json: boolean): string {
  if (json) {
    return JSON.stringify({ result: text }, null, 2);
  }
  return text;
}
