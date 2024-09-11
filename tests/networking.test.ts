import { describe } from "node:test";
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

describe("Networking tools", () => {
  networkingTools.forEach(binaryOnPathTest);
});
