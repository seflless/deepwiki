import ora from "ora";

const isTTY = process.stderr.isTTY;

export async function withSpinner<T>(
  label: string,
  quiet: boolean,
  fn: () => Promise<T>,
): Promise<T> {
  if (quiet || !isTTY) {
    return fn();
  }

  const spinner = ora({ text: label, stream: process.stderr }).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (err) {
    spinner.stop();
    throw err;
  }
}
