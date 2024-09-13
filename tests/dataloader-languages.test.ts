import { test, describe } from "node:test";
import os from "node:os";
import assert from "node:assert/strict";
import {
  assertSemver,
  binaryOnPathTest,
  binaryVersionTest,
  runCommandInContainer,
} from "./index.ts";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";

describe("Dataloader languages", () => {
  describe("JavaScript", () => {
    binaryVersionTest({ binary: "node", semver: "^20.17" });
    binaryVersionTest({ binary: "npm", semver: "^10.5" });

    binaryVersionTest({
      binary: "yarn",
      semver: "^1.22",
      expectStderr: /^! Corepack is about to download.*yarn/,
    });
    test("Yarn v2+ is available, and uses corepack", async () => {
      const { stdout, stderr } = await runCommandInContainer([
        "sh",
        "-c",
        "mkdir test && cd test && yarn init -2",
      ]);
      assert.ok(!stdout.includes("You don't seem to have Corepack enabled"));
      assert.ok(!stderr.includes("You don't seem to have Corepack enabled"));
    });
    test("yarn ^4.4.1 is available via corepack", async () => {
      const { stdout, stderr } = await runCommandInContainer([
        "sh",
        "-c",
        "mkdir test && cd test && yarn init -2 > /dev/null && yarn --version",
      ]);
      assertSemver(stdout, "^4.4.1");
    });

    binaryVersionTest({
      binary: "pnpm",
      semver: "^9.10",
      expectStderr: /^! Corepack is about to download.*pnpm/,
    });
  });

  describe("Python", () => {
    binaryVersionTest({
      binary: "python3",
      semver: "^3.11",
      prefix: "Python",
    });

    binaryVersionTest({
      binary: "pip",
      semver: "^23.0.1",
      extract: /^pip ([^ ]+) /,
    });
    binaryVersionTest({ binary: "pipx", semver: "^1.1.0" });
    binaryVersionTest({
      binary: "poetry",
      semver: "^1.8.3",
      prefix: "Poetry (version ",
      suffix: ")",
    });

    test(`A Python virtual environment is activated`, async () => {
      // should not throw
      await runCommandInContainer(["pip", "install", "pip-install-test"]);
    });

    test(`Poetry can install dependencies in the virtualenv`, async () => {
      let testDir = await mkdtemp(join(os.tmpdir(), "poetry-test-"));
      try {
        // This will install dependencies using Poetry, and then try to run `ls`
        // in the installed dependency's package. If the package is not
        // installed here, the `ls` command will exit non-zero and
        // `runCommandInContainer` will throw.
        await cp(
          "./tests/fixtures/poetry-test/pyproject.toml",
          `${testDir}/pyproject.toml`,
        );
        let res = await runCommandInContainer(
          [
            "sh",
            "-c",
            "poetry install; ls $(poetry env info --path)/lib/python3.11/site-packages/pip_install_test/__init__.py",
          ],
          {
            workingDir: "/poetry-test",
            mounts: [{ host: testDir, container: "/poetry-test" }],
          },
        );
      } finally {
        try {
          await rm(testDir, { recursive: true });
        } catch {
          /* ok */
        }
      }
    });
  });

  binaryVersionTest({
    binary: "Rscript",
    semver: "^4.4.1",
    extract: /^Rscript \(R\) version ([^\s]+)/,
  });

  describe("Rust", () => {
    binaryVersionTest({
      name: "Rust",
      binary: "cargo",
      semver: "^1.81",
      extract: /^cargo ([\d.]+)/,
    });

    binaryVersionTest({
      binary: "rust-script",
      semver: "^0.35",
      prefix: "rust-script",
    });
  });

  binaryVersionTest({
    binary: "perl",
    semver: "^5.36",
    extract: /^This is perl 5,[^(]* \(([^)]+)\)/,
  });
});
