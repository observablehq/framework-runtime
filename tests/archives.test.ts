import { binaryOnPathTest } from "./index.ts";

const archiveTools = [
  { binary: "bzip2" },
  { binary: "gzip" },
  { binary: "tar" },
  { binary: "zip" },
  { binary: "zstd" },
];

archiveTools.forEach(binaryOnPathTest);
