import { askQuestion } from "../client.js";
import { formatResult } from "../format.js";
import { withSpinner } from "../spinner.js";

export async function ask(
  repos: string[],
  question: string,
  opts: { json: boolean; quiet: boolean },
) {
  const label = repos.length === 1
    ? `Asking about ${repos[0]}...`
    : `Asking about ${repos.length} repos...`;

  const text = await withSpinner(label, opts.quiet, () =>
    askQuestion(repos, question),
  );
  console.log(formatResult(text, opts.json));
}
