import { $ } from "bun";

await $`bun build src/index.ts --outfile dist/index.js --target node --format esm`;

// Ensure shebang is present
const content = await Bun.file("dist/index.js").text();
if (!content.startsWith("#!")) {
  await Bun.write("dist/index.js", `#!/usr/bin/env node\n${content}`);
}

// Make executable
await $`chmod +x dist/index.js`;

console.log("Built dist/index.js");
