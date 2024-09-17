import { test, before } from "node:test";
import { resolve } from "node:path";
import assert from "node:assert";
import Dockerode from "dockerode";
import { Stream } from "node:stream";
import semverSatisfies from "semver/functions/satisfies";
import { basename } from "node:path";

export const IMAGE_TAG = "observablehq/framework-runtime:test";

export interface AssertBinaryVersionOptions {
  binary: string;
  name?: string;
  semver: string;
  extract?: RegExp;
  prefix?: string;
  suffix?: string;
  expectStderr?: RegExp;
}

export async function binaryVersionTest({
  binary,
  name = binary,
  semver,
  extract,
  prefix,
  suffix,
  expectStderr = /^$/,
}: AssertBinaryVersionOptions) {
  await test(`${name} ${semver} is available`, async () => {
    const res = await runCommandInContainer([binary, "--version"]);
    assert.ok(
      res.stderr.match(expectStderr),
      `Expected stderr to match, got: ${res.stderr}`,
    );
    assertSemver(res.stdout, semver, { extract, prefix, suffix });
  });
}

export interface AssertBinaryOptions {
  binary: string;
  name?: string;
}

export function binaryOnPathTest({
  binary,
  name = binary,
}: AssertBinaryOptions) {
  test(`${name} is on PATH`, async () => {
    const res = await runCommandInContainer(["which", binary]);
    assert.equal(res.stderr, "");
    assert.ok(res.stdout.trim().length > 0, "no stdout");
  });
}

export function assertSemver(
  actual: string,
  expected: string,
  {
    prefix,
    suffix,
    extract,
  }: { prefix?: string; suffix?: string; extract?: RegExp } = {},
) {
  actual = actual.trim();
  if (prefix && actual.startsWith(prefix)) actual = actual.slice(prefix.length);
  if (suffix && actual.endsWith(suffix))
    actual = actual.slice(0, -suffix.length);
  if (extract) {
    const match = actual.match(extract);
    if (!match) throw new Error(`Expected match for ${extract} in ${actual}`);
    if (!match[1])
      throw new Error("Expected extract regex to have a capture group");
    actual = match[1];
  }
  actual = actual.trim();
  assert.ok(
    semverSatisfies(actual, expected),
    `Expected semver match for ${expected}, got ${JSON.stringify(actual)}`,
  );
}

let _docker: Dockerode;
function ensureDocker() {
  return (_docker ??= new Dockerode());
}

before(ensureDocker);

export async function runCommandInContainer(
  command: string[],
  {
    mounts = [],
    workingDir = "/project",
  }: {
    mounts?: { host: string; container: string}[];
    workingDir?: string;
  } = {},
): Promise<{ stdout: string; stderr: string }> {
  const docker = ensureDocker();
  const addGids = process.getgid ? [String(process.getgid())] : [];
  const container = await docker.createContainer({
    WorkingDir: workingDir,
    Image: IMAGE_TAG,
    Cmd: command,
    HostConfig: {
      GroupAdd: addGids,
      Binds: mounts.map(
        ({ host, container }) =>
          `${resolve(host)}:${container}`,
      ),
    },
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
  if (wait.StatusCode !== 0) {
    throw new Error(
      `Command failed with status code ${wait.StatusCode}\n` +
        `stdout:\n${stdout.string}\n\n` +
        `stderr:\n${stderr.string}`,
    );
  }
  return { stdout: stdout.string, stderr: stderr.string };
}

export class StringStream extends Stream.PassThrough {
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
