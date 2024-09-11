import { describe } from "node:test";
import { binaryOnPathTest, binaryVersionTest } from "./index.ts";

const dataManipTools = [
  { binary: "jq" },
  { binary: "in2csv", name: "csvkit" },
  { binary: "csv2parquet" },
];

describe("Data manipulation tools", () => {
  dataManipTools.forEach(binaryOnPathTest);

  binaryVersionTest({
    binary: "duckdb",
    semver: "^1",
    extract: /^v(.*) [0-9a-f]*$/,
  });
});
