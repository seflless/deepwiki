import { $ } from "bun";
import { mkdir } from "fs/promises";

const targets = [
  "bun-darwin-arm64",
  "bun-darwin-x64",
  "bun-linux-x64",
  "bun-linux-arm64",
  "bun-windows-x64",
] as const;

const outDir = "dist/bin";
await mkdir(outDir, { recursive: true });

for (const target of targets) {
  const platform = target.replace("bun-", "");
  const ext = platform.startsWith("windows") ? ".exe" : "";
  const outFile = `${outDir}/deepwiki-${platform}${ext}`;

  console.log(`Building for ${platform}...`);
  await $`bun build src/index.ts --compile --target=${target} --outfile=${outFile}`;
}

console.log("Done. Binaries in dist/bin/");
