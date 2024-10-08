import { describe } from "node:test";
import { binaryOnPathTest } from "./index.ts";

const archiveTools = [
  { binary: "bzip2" },
  { binary: "gzip" },
  { binary: "tar" },
  { binary: "zip" },
  { binary: "zstd" },
];

await describe("Archive tools", () => {
  archiveTools.forEach(binaryOnPathTest);
});
