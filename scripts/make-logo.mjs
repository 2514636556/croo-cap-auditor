import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCanvas } from 'canvas';

const root = resolve(import.meta.dirname, '..');
const mediaDir = join(root, 'media');
const outFile = join(mediaDir, 'cap-sentinel-logo.png');

mkdirSync(mediaDir, { recursive: true });

const canvas = createCanvas(480, 480);
const ctx = canvas.getContext('2d');

const gradient = ctx.createLinearGradient(0, 0, 480, 480);
gradient.addColorStop(0, '#0f766e');
gradient.addColorStop(1, '#111827');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 480, 480);

ctx.fillStyle = '#f8fafc';
roundRect(ctx, 64, 78, 352, 324, 34);
ctx.fill();

ctx.fillStyle = '#0f766e';
roundRect(ctx, 95, 112, 290, 62, 18);
ctx.fill();

ctx.fillStyle = '#34d399';
ctx.beginPath();
ctx.arc(157, 244, 48, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.arc(323, 244, 48, 0, Math.PI * 2);
ctx.fill();

ctx.strokeStyle = '#111827';
ctx.lineWidth = 18;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(178, 244);
ctx.lineTo(302, 244);
ctx.stroke();

ctx.fillStyle = '#111827';
ctx.font = '800 54px Arial';
ctx.textAlign = 'center';
ctx.fillText('CAP', 240, 342);

ctx.fillStyle = '#64748b';
ctx.font = '700 26px Arial';
ctx.fillText('SENTINEL', 240, 374);

writeFileSync(outFile, canvas.toBuffer('image/png'));
console.log(`Logo written to ${outFile}`);

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
