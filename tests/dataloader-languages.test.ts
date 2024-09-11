import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  assertSemver,
  binaryOnPathTest,
  binaryVersionTest,
  runCommandInContainer,
} from "./index.ts";

describe("Dataloader languages", () => {
  describe("Python", () => {
    binaryVersionTest({
      binary: "python3",
      semver: "^3.11",
      prefix: "Python",
    });

    binaryOnPathTest({ binary: "pip" });

    test(`A Python virtual environment is activated`, async () => {
      // should not throw
      await runCommandInContainer(["pip", "install", "requests"]);
    });
  });

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
