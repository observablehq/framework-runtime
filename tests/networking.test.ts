import { binaryOnPathTest } from "./index.ts";

const networkingTools = [
  { binary: "curl" },
  { binary: "dig" },
  { binary: "nc" },
  { binary: "openssl" },
  { binary: "ping" },
  { binary: "tracepath" },
  { binary: "wget" },
];

networkingTools.map(binaryOnPathTest);
