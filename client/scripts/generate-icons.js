/* eslint-disable no-console */
/*
  Generate favicon and app icons from the mark-only logo.
  Requires: sharp, png-to-ico
  Usage: node scripts/generate-icons.js
*/
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const pngToIco = require("png-to-ico");

const root = path.resolve(__dirname, "..");
const srcLogo = path.join(root, "src", "assets", "mockmate-logo-bkg-crop.png");
const outDir = path.join(root, "public");

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function main() {
  await ensureDir(outDir);
  // We assume the uploaded image contains the mark centered and big enough.
  // Use a square crop with cover fit to extract the mark region.
  const sizes = [16, 32, 180, 192, 512];
  const outputs = {
    16: "favicon-16.png",
    32: "favicon-32.png",
    180: "apple-touch-icon.png",
    192: "icon-192.png",
    512: "icon-512.png",
  };

  const pngPaths = [];
  for (const size of sizes) {
    const outPath = path.join(outDir, outputs[size]);
    await sharp(srcLogo)
      .resize({ width: size, height: size, fit: "cover", position: "centre" })
      .png()
      .toFile(outPath);
    pngPaths.push(outPath);
    console.log("Wrote", outPath);
  }

  // Build favicon.ico from 16 and 32 sizes
  const icoPath = path.join(outDir, "favicon.ico");
  const icoBuf = await pngToIco([
    path.join(outDir, "favicon-16.png"),
    path.join(outDir, "favicon-32.png"),
  ]);
  await fs.promises.writeFile(icoPath, icoBuf);
  console.log("Wrote", icoPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
