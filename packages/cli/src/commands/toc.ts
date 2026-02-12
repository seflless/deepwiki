import { readWikiStructure } from "../client.js";
import { formatResult } from "../format.js";
import { withSpinner } from "../spinner.js";

export async function toc(repo: string, opts: { json: boolean; quiet: boolean }) {
  const text = await withSpinner(
    `Fetching table of contents for ${repo}...`,
    opts.quiet,
    () => readWikiStructure(repo),
  );
  console.log(formatResult(text, opts.json));
}
