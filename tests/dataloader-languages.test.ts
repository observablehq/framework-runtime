import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { binaryOnPathTest, binaryVersionTest, runCommandInContainer } from "./index.ts";

const dataLoaderLanguages = [
  {
    binary: "Rscript",
    semver: "^4.4.1",
    extract: /^Rscript \(R\) version ([^\s]+)/,
  },
  {
    name: "Rust",
    binary: "cargo",
    semver: "^1.81",
    extract: /^cargo ([\d.]+)/,
  },
  {
    binary: "rust-script",
    semver: "^0.35",
    prefix: "rust-script",
  },
  {
    binary: "perl",
    semver: "^5.36",
    extract: /^This is perl 5,[^(]* \(([^)]+)\)/,
  },
];

describe("Python", () => {
  binaryVersionTest({
    binary: "python3",
    semver: "^3.11",
    prefix: "Python",
  });

  binaryOnPathTest({binary: "pip"})

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

   test("Yarn Berry is available, and uses corepack", async () => {
    const { stdout, stderr } = await runCommandInContainer(["sh", "-c", "mkdir test && cd test && yarn init -2"]);
    assert.ok(!stdout.includes("You don't seem to have Corepack enabled"));
  });
});
