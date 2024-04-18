import { binaryVersionTest } from "./index.ts";

const dataLoaderLanguages = [
  { binary: "node", semver: "^20" },
  { binary: "npm", semver: "^10.5" },
  { binary: "yarn", semver: "^1.22" },
  {
    binary: "python3",
    semver: "^3.11",
    prefix: "Python",
  },
  {
    binary: "Rscript",
    semver: "^4.3",
    extract: /^Rscript \(R\) version ([^\s]+)/,
  },
  {
    name: "Rust",
    binary: "cargo",
    semver: "^1.77",
    extract: /^cargo ([\d.]+)/,
  },
  {
    binary: "rust-script",
    semver: "^0.34",
    prefix: "rust-script",
  },
];

dataLoaderLanguages.map(binaryVersionTest);
