import { binaryOnPathTest, binaryVersionTest } from "./index.ts";

const dataManipTools = [
  { binary: "jq" },
  { binary: "in2csv", name: "csvkit" },
  { binary: "csv2parquet" },
];

dataManipTools.forEach(binaryOnPathTest);

binaryVersionTest({
  binary: "duckdb",
  semver: "^1",
  extract: /^v(.*) [0-9a-f]*$/,
});
