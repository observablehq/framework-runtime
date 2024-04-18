import { binaryOnPathTest } from "./index.ts";

const generalCliTools: { binary: string }[] = [
  { binary: "md5sum" },
  { binary: "sha256sum" },
  { binary: "sha512sum" },
  { binary: "shasum" },
  { binary: "top" },
  { binary: "uptime" },
  { binary: "vmstat" },
];

generalCliTools.map(binaryOnPathTest);
