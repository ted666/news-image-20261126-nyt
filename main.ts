// news-image-20261126-nyt — a one-page newspaper for Thursday, 26 November 2026.
//
// The repository holds the finished front page (entry.png) and this program,
// whose only job is to hand that image to the grader: read the PNG sitting
// next to this file, make sure it fits the competition's image gate, and
// write an identical copy into the output folder.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The gate, from the competition's RULES.txt: a PNG, at most 1 MiB,
// at most 1024 by 1024 pixels.
const PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const BYTE_LIMIT = 1024 * 1024;
const SIDE_LIMIT = 1024;

function abort(reason: string): never {
  throw new Error(reason);
}

// entry.png lives beside this file, so the program works no matter which
// directory the grader runs it from.
function loadFrontPage(): Buffer {
  const folder = dirname(fileURLToPath(import.meta.url));
  const imagePath = join(folder, "entry.png");
  if (!existsSync(imagePath)) {
    abort(`entry.png not found next to main.ts (${imagePath})`);
  }
  return readFileSync(imagePath);
}

function checkFrontPage(image: Buffer): { width: number; height: number } {
  if (image.length < 8 || !image.subarray(0, 8).equals(PNG_HEADER)) {
    abort("entry.png does not start with the PNG signature");
  }
  if (image.length > BYTE_LIMIT) {
    abort(`entry.png is ${image.length} bytes, above the 1 MiB limit`);
  }
  if (image.length < 24) {
    abort("entry.png is too short to contain a PNG header chunk");
  }
  const chunkLength = image.readUInt32BE(8);
  const chunkName = image.subarray(12, 16).toString("ascii");
  if (chunkLength !== 13 || chunkName !== "IHDR") {
    abort("entry.png has no IHDR chunk where one belongs");
  }
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width === 0 || height === 0) {
    abort("entry.png declares a zero width or height");
  }
  if (width > SIDE_LIMIT || height > SIDE_LIMIT) {
    abort(`entry.png is ${width}x${height}, above the 1024x1024 limit`);
  }
  // A truncated PNG still opens in some viewers, so require the closing
  // chunk as well: the last 12 bytes must be a zero-length IEND chunk.
  if (image.length < 12) {
    abort("entry.png is too short to hold a closing chunk");
  }
  const tail = image.subarray(image.length - 12);
  if (
    tail.readUInt32BE(0) !== 0 ||
    tail.subarray(4, 8).toString("ascii") !== "IEND"
  ) {
    abort("entry.png has no IEND trailer chunk");
  }
  return { width, height };
}

// Copy the verified image byte-for-byte into the output folder.
function deliver(image: Buffer): string {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  const destination = join(outDir, "entry.png");
  writeFileSync(destination, image);
  const written = readFileSync(destination);
  if (!written.equals(image)) {
    abort("the copy written to the output folder differs from entry.png");
  }
  return destination;
}

try {
  const image = loadFrontPage();
  const size = checkFrontPage(image);
  const destination = deliver(image);
  console.log(
    `wrote ${destination} (${image.length} bytes, ${size.width}x${size.height})`,
  );
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
