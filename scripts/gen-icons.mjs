// Generates PWA PNG icons using only Node builtins (no native deps), so it runs
// anywhere including CI. Produces a deep-green rounded tile with a lighter leaf-ish
// circle. Good enough to make "Add to Home Screen" on Android show a real icon.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function hex(h) {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

function makePng(size, { bg, fg, shapeScale, radiusScale }) {
  const [br, bgc, bb] = hex(bg);
  const [fr, fgc, fb] = hex(fg);
  const cx = size / 2;
  const cy = size / 2;
  const shapeR = size * shapeScale;
  const corner = size * radiusScale; // rounded-corner radius for the tile

  const raw = Buffer.alloc((size * 4 + 1) * size);
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      // rounded-rect alpha for the tile
      let insideTile = true;
      const rx = Math.min(x, size - 1 - x);
      const ry = Math.min(y, size - 1 - y);
      if (rx < corner && ry < corner) {
        const dx = corner - rx;
        const dy = corner - ry;
        if (dx * dx + dy * dy > corner * corner) insideTile = false;
      }
      let r, g, b, a;
      if (!insideTile) {
        r = g = b = 0; a = 0;
      } else {
        const d = Math.hypot(x - cx, y - cy);
        if (d <= shapeR) { r = fr; g = fgc; b = fb; a = 255; }
        else { r = br; g = bgc; b = bb; a = 255; }
      }
      raw[p++] = r; raw[p++] = g; raw[p++] = b; raw[p++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const bg = '#1f6f43';
const fg = '#8fd3ad';

// Standard icons: rounded tile + centered circle.
writeFileSync(join(outDir, 'icon-192.png'), makePng(192, { bg, fg, shapeScale: 0.26, radiusScale: 0.18 }));
writeFileSync(join(outDir, 'icon-512.png'), makePng(512, { bg, fg, shapeScale: 0.26, radiusScale: 0.18 }));
// Maskable: full-bleed (no rounded corners) + smaller shape inside safe zone.
writeFileSync(join(outDir, 'maskable-512.png'), makePng(512, { bg, fg, shapeScale: 0.22, radiusScale: 0 }));
// Apple touch icon.
writeFileSync(join(outDir, 'apple-touch-icon-180.png'), makePng(180, { bg, fg, shapeScale: 0.26, radiusScale: 0.18 }));

console.log('icons written to', outDir);
