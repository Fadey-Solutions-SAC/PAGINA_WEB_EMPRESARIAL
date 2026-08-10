import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

/** Map blue/cyan hues toward emerald green, keep structure & brightness. */
function blueToEmerald(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 8) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const l = (max + min) / 2 / 255;
    const s = d === 0 ? 0 : d / (255 - Math.abs(2 * l * 255 - 255));

    // Detect cool blues / cyans (B high relative to R, some G)
    const isCool =
      b > r + 8 &&
      (b >= g - 20 || g > r) &&
      (b > 40 || (b > r && b > 25));

    // Also catch blue-ish grays with slight blue cast
    const blueishGray = b > r + 5 && b > g + 2 && max - min < 40 && max > 30;

    if (!isCool && !blueishGray) continue;

    // Target emerald around hue ~155°
    // Keep luminance of original pixel
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const satBoost = Math.min(1, Math.max(0.35, s * 1.15 + 0.15));

    // Emerald mix: dark forest + bright mint by luminance
    const t = lum / 255;
    const er = Math.round(2 + t * 90 + satBoost * 20);
    const eg = Math.round(20 + t * 200 + satBoost * 30);
    const eb = Math.round(16 + t * 120);

    // Blend toward emerald based on how "blue" the pixel was
    const blueStrength = Math.min(1, (b - r) / 120 + 0.35);
    data[i] = Math.round(r * (1 - blueStrength) + er * blueStrength);
    data[i + 1] = Math.round(g * (1 - blueStrength) + eg * blueStrength);
    data[i + 2] = Math.round(b * (1 - blueStrength) + eb * blueStrength);
  }
}

const jobs = [
  ["hero-network.png", "hero-network-emerald.png"],
  ["bg-blue-waves.png", "bg-emerald-waves.png"],
  ["bg-blue-network.png", "bg-emerald-network.png"],
  ["bg-web-neon.png", "bg-web-neon-emerald.png"],
  ["bg-geometry.png", "bg-geometry-emerald.png"],
];

for (const [srcName, destName] of jobs) {
  const src = path.join(publicDir, srcName);
  const dest = path.join(publicDir, destName);
  const img = sharp(src);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  blueToEmerald(pixels);
  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(dest);
  console.log("wrote", destName, `${info.width}x${info.height}`);
}

console.log("done");
