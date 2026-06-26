import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCanvas } from 'canvas';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const root = resolve(import.meta.dirname, '..');
const tmpDir = join(root, 'tmp', 'demo-video');
const outDir = join(root, 'media');
const outFile = join(outDir, 'cap-sentinel-demo.mp4');

mkdirSync(tmpDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const slides = [
  {
    title: 'CAP Sentinel',
    subtitle: 'Paid CROO CAP readiness audits for agent builders',
    bullets: ['Developer Tooling Agents', 'Data & Verification Agents', 'Built with @croo-network/sdk'],
  },
  {
    title: 'The Builder Problem',
    subtitle: 'A working agent is not enough for final submission.',
    bullets: ['Needs public repo + permissive license', 'Needs Agent Store listing and demo video', 'Needs CAP payment and delivery evidence'],
  },
  {
    title: 'What The Agent Does',
    subtitle: 'Turns hackathon requirements into a paid verification service.',
    bullets: ['Accepts structured project payloads', 'Scores readiness out of 100', 'Returns pass / warn / fail findings with evidence'],
  },
  {
    title: 'CAP Provider Flow',
    subtitle: 'Negotiation -> payment -> schema delivery',
    bullets: ['connectWebSocket listens for NegotiationCreated', 'acceptNegotiation creates the paid order', 'OrderPaid triggers deliverOrder with cap-sentinel.audit.v1'],
  },
  {
    title: 'Local Demo',
    subtitle: 'npm run demo',
    bullets: ['Runs without credentials', 'Produces Markdown or JSON reports', 'Blocks missing anti-sybil evidence before final BUIDL'],
  },
  {
    title: 'Agent Store Service',
    subtitle: '2 USDC flat audit, 5 minute delivery window',
    bullets: ['Input schema documented', 'Output schema documented', 'Rejects malformed requests before payment'],
  },
  {
    title: 'Ready To Submit',
    subtitle: 'Repo, README, MIT license, docs, tests, and provider runtime',
    bullets: ['npm run typecheck', 'npm test', 'npm run build', 'DoraHacks draft included in docs/'],
  },
];

for (const [index, slide] of slides.entries()) {
  writeFileSync(join(tmpDir, `slide-${String(index + 1).padStart(2, '0')}.png`), renderSlide(slide, index + 1, slides.length));
}

const ffmpegArgs = [
  '-y',
  '-framerate',
  '1/8',
  '-i',
  join(tmpDir, 'slide-%02d.png'),
  '-vf',
  'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
  '-r',
  '30',
  '-movflags',
  '+faststart',
  outFile,
];

const result = spawnSync(ffmpeg.path, ffmpegArgs, { stdio: 'inherit' });
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

rmSync(tmpDir, { recursive: true, force: true });
console.log(`Demo video written to ${outFile}`);

function renderSlide(slide, index, total) {
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#101418';
  ctx.fillRect(0, 0, 1280, 720);

  roundRect(ctx, 72, 64, 1136, 592, 18);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  roundRect(ctx, 72, 64, 1136, 86, 18);
  ctx.fillStyle = '#0f766e';
  ctx.fill();
  ctx.fillRect(72, 120, 1136, 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 30px Arial';
  ctx.fillText('CROO Agent Hackathon', 118, 120);

  ctx.fillStyle = '#111827';
  ctx.font = '800 62px Arial';
  ctx.fillText(slide.title, 112, 252);

  ctx.fillStyle = '#334155';
  ctx.font = '400 28px Arial';
  ctx.fillText(slide.subtitle, 116, 304);

  for (const [bulletIndex, bullet] of slide.bullets.entries()) {
    const y = 345 + bulletIndex * 72;
    ctx.beginPath();
    ctx.arc(166, y - 8, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#34d399';
    ctx.fill();

    ctx.fillStyle = '#1f2937';
    ctx.font = '500 30px Arial';
    ctx.fillText(bullet, 190, y);
  }

  ctx.fillStyle = '#64748b';
  ctx.font = '400 20px Arial';
  ctx.fillText(`CAP Sentinel demo video - slide ${index}/${total}`, 112, 612);

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
