import { test } from "node:test";
import { binaryVersionTest, runCommandInContainer } from "./index.ts";

const dataLoaderLanguages = [
  { binary: "node", semver: "^20.17" },
  { binary: "npm", semver: "^10.5" },
  { binary: "yarn", semver: "^1.22" },
  {
    binary: "python3",
    semver: "^3.11",
    prefix: "Python",
  },
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

dataLoaderLanguages.forEach(binaryVersionTest);

await test(`A Python virtual environment is activated`, async () => {
  // should not throw
  await runCommandInContainer(["pip", "install", "requests"]);
});
