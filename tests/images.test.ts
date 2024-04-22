import { binaryOnPathTest } from "./index.ts";

const imageTools = [
  { binary: "svgo" },
  { binary: "optipng" },
  { binary: "convert", name: "imagemagick" },
];

imageTools.forEach(binaryOnPathTest);
