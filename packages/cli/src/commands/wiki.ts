import { readWikiContents } from "../client.js";
import { formatResult } from "../format.js";
import { withSpinner } from "../spinner.js";

export async function wiki(repo: string, opts: { json: boolean; quiet: boolean }) {
  const text = await withSpinner(
    `Fetching wiki for ${repo}...`,
    opts.quiet,
    () => readWikiContents(repo),
  );
  console.log(formatResult(text, opts.json));
}
