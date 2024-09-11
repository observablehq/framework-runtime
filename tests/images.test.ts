import { describe } from "node:test";
import { binaryOnPathTest } from "./index.ts";

const imageTools = [
  { binary: "svgo" },
  { binary: "optipng" },
  { binary: "convert", name: "imagemagick" },
];

describe("Image tools", () => {
  imageTools.forEach(binaryOnPathTest);
});
