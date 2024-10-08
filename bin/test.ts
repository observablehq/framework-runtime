import { spawn } from "node:child_process";
import { glob } from "glob";
import { IMAGE_TAG, StringStream } from "../tests/index.ts";
import { dirname } from "node:path";
import { run as runTests } from "node:test";
import { spec } from "node:test/reporters";

import { parseArgs } from "node:util";
const { values: { "only": argOnly } } = parseArgs({
  options: {
    "only": { type: "boolean" },
  }
});

export async function buildTestImage() {
  console.log("building image...");
  let stdio = new StringStream();
  let process = spawn("docker", ["buildx", "build", "-t", IMAGE_TAG, ".."], {
    cwd: import.meta.dirname,
    stdio: "pipe",
  });
  process.stdout.pipe(stdio);
  process.stderr.pipe(stdio);

  await new Promise((resolve, reject) => {
    process.on("close", (code) => {
      if (code !== 0)
        reject(
          new Error(
            `docker buildx build failed with code ${code}\n${stdio.string}`
          )
        );
      resolve(undefined);
    });
    process.on("error", reject);
  });
}

const files = await glob(["tests/**/*.test.ts"], {
  cwd: dirname(import.meta.dirname),
});

await buildTestImage();
runTests({ files, concurrency: true, only: argOnly })
  .on("test:fail", () => {
    process.exitCode = 1;
  })
  .compose(new spec())
  .pipe(process.stdout);
