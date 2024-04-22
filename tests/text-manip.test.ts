import { binaryOnPathTest } from "./index.ts";

const textManipTools: { binary: string }[] = [
  { binary: "ag" },
  { binary: "awk" },
  { binary: "grep" },
  { binary: "nano" },
  { binary: "rg" },
  { binary: "sed" },
  { binary: "sort" },
  { binary: "uniq" },
  { binary: "vim" },
];

textManipTools.forEach(binaryOnPathTest);
