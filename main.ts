// main.ts — news-image-20261126 entry.
//
// The entry is one pre-rendered image, entry.png, summing up
// 26 November 2026's world news in a single front page:
// 36 dated stories, a world map, a UTC timeline and a date check.
// This program's only job is to hand that image to the grader,
// byte-for-byte, in the output directory.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The grader runs `node /bot/main.ts` from an arbitrary working
// directory, so every path is anchored to this file's own folder
// instead of the process working directory.
const scriptDir = dirname(fileURLToPath(import.meta.url));

// The image lives next to this script in the repository.
const source = join(scriptDir, "entry.png");

// The grader reads the entry from the output directory: the
// MAKEFUN_OUTPUT_DIR environment variable when set, /output
// otherwise. The file is always named entry.png.
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target = join(outDir, "entry.png");

// A plain copy: no decoding, no re-encoding, no pixel touched,
// so running the program twice writes the same bytes twice.
mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

