import { test, before } from "node:test";
import assert from "node:assert";
import Dockerode from "dockerode";
import { Stream } from "node:stream";
import semverSatisfies from "semver/functions/satisfies";
import {spawn} from "node:child_process";

const IMAGE_TAG = "observablehq/framework-runtime:test";
let docker: Dockerode;

before(async () => {
  docker = new Dockerode();
  // TODO dockerode uses the HTTP API which doesn't seem to support buildx.
  console.log("Building docker image...");
  let stdio = new StringStream();
  let process = spawn("docker", ["buildx", "build", "-t", IMAGE_TAG, "."], {
    cwd: import.meta.dirname,
    stdio: "pipe",
  });
  process.stdout.pipe(stdio);
  process.stderr.pipe(stdio);

  await new Promise((resolve, reject) => {
    process.on("close", (code) => {
      if (code !== 0) reject(new Error(`docker buildx build failed with code ${code}\n${stdio.string}`));
      resolve(undefined);
    });
    process.on("error", reject);
  });
});

const binaryChecks: {binary: string, name?: string, semver: string, extract?: RegExp, prefix?: string}[] = [
  {binary: "node", semver: "^20"},
  {binary: "npm", semver: "^10.5"},
  {binary: "yarn", semver: "^1.22"},
  {binary: "python3", semver: "^3.11", prefix: "Python"},
  {binary: "Rscript", semver: "^4.3", extract: /^Rscript \(R\) version ([^\s]+)/},
  {binary: "duckdb", semver: "^0.10.1", extract: /^v(.*) [0-9a-f]*$/},
  {name: "Rust", binary: "cargo", semver: "^1.77", extract: /^cargo ([\d.]+)/},
  {binary: "rust-script", semver: "^0.34", prefix: "rust-script"},
];

for (const {binary, name = binary, semver, extract, prefix} of binaryChecks) {
  test(`${name} ${semver} is available`, async () => {
    const res = await runCommandInContainer([binary, "--version"]);
    assert.equal(res.stderr, "");
    assertSemver(res.stdout, semver, {extract, prefix});
  });
}

function assertSemver(actual, expected, {prefix, suffix, extract}: {prefix?: string, suffix?: string, extract?: RegExp} = {}) {
  actual = actual.trim();
  if (prefix && actual.startsWith(prefix)) actual = actual.slice(prefix.length);
  if (suffix && actual.endsWith(suffix)) actual = actual.slice(0, -suffix.length);
  if (extract) {
    const match = actual.match(extract);
    if (!match) throw new Error(`Expected match for ${extract} in ${actual}`);
    if (!match[1]) throw new Error("Expected extract regex to have a capture group"); 
    actual = match[1];
  }
  actual = actual.trim();
  assert.ok(semverSatisfies(actual, expected), `Expected semver match for ${expected}, got ${actual}`);
}

async function runCommandInContainer(
  command: string[]
): Promise<{ stdout: string; stderr: string }> {
  const container = await docker.createContainer({
    Image: IMAGE_TAG,
    Cmd: command,
  });
  const stdout = new StringStream();
  const stderr = new StringStream();
  const attach = await container.attach({
    stream: true,
    stdout: true,
    stderr: true,
  });
  docker.modem.demuxStream(attach, stdout, stderr);
  await container.start();
  const wait = (await container.wait()) as { StatusCode: number };
  if (wait.StatusCode !== 0)
    throw new Error(`Command failed with status code ${wait.StatusCode}`);
  return { stdout: stdout.string, stderr: stderr.string };
}

class StringStream extends Stream.PassThrough {
  buffers: Buffer[];

  constructor() {
    super();
    this.buffers = [];
    this.on("data", (chunk) => this.buffers.push(chunk));
  }

  get string(): string {
    return Buffer.concat(this.buffers).toString();
  }
}
