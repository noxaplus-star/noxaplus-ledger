import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const iconsDir = path.join(publicDir, 'icons');

await mkdir(iconsDir, { recursive: true });

const [iconSvg, maskableSvg] = await Promise.all([
  readFile(path.join(iconsDir, 'icon.svg')),
  readFile(path.join(iconsDir, 'maskable.svg')),
]);

const rasterTargets = [
  { source: iconSvg, name: 'icon-192.png', size: 192 },
  { source: iconSvg, name: 'icon-512.png', size: 512 },
  { source: iconSvg, name: 'apple-touch-icon.png', size: 180 },
  { source: iconSvg, name: 'favicon-32.png', size: 32 },
  { source: maskableSvg, name: 'maskable-512.png', size: 512 },
];

for (const target of rasterTargets) {
  await sharp(target.source, { density: 384 })
    .resize(target.size, target.size, { fit: 'contain' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, target.name));
  console.log(`icons/${target.name}`);
}

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fbf7ee" />
      <stop offset="0.6" stop-color="#f6f1e7" />
      <stop offset="1" stop-color="#efe7d8" />
    </linearGradient>
    <linearGradient id="card" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffdf8" />
      <stop offset="1" stop-color="#fdf8ee" />
    </linearGradient>
    <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1d2c4b" />
      <stop offset="1" stop-color="#111a2c" />
    </linearGradient>
    <linearGradient id="coral" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f06a45" />
      <stop offset="1" stop-color="#d9482b" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#paper)" />
  <circle cx="1130" cy="60" r="300" fill="#e4572e" opacity="0.08" />
  <circle cx="60" cy="600" r="280" fill="#2a9d8f" opacity="0.09" />
  <g opacity="0.05" stroke="#17233d" stroke-width="1">
    <path d="M0 126h1200M0 252h1200M0 378h1200M0 504h1200" />
    <path d="M150 0v630M300 0v630M450 0v630M600 0v630M750 0v630M900 0v630M1050 0v630" />
  </g>

  <g transform="translate(78 62)">
    <rect width="96" height="96" rx="26" fill="url(#logoBg)" />
    <rect x="27" y="18" width="54" height="61" rx="8" fill="#fff8ea" />
    <rect x="27" y="18" width="10" height="61" rx="5" fill="#e4572e" />
    <rect x="43" y="29" width="28" height="4" rx="2" fill="#17233d" opacity="0.22" />
    <rect x="43" y="38" width="21" height="3.4" rx="1.7" fill="#17233d" opacity="0.16" />
    <rect x="43" y="46" width="25" height="3.4" rx="1.7" fill="#17233d" opacity="0.16" />
    <circle cx="70" cy="67" r="16" fill="#2a9d8f" />
    <rect x="62" y="63" width="16" height="3" rx="1.5" fill="#f6f1e7" />
    <rect x="62" y="69" width="10" height="3" rx="1.5" fill="#f6f1e7" opacity="0.8" />
  </g>
  <text x="194" y="104" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="700" letter-spacing="2.4" fill="#d9482b">NOXAPLUS</text>
  <text x="194" y="146" font-family="Segoe UI, Arial, sans-serif" font-size="31" font-weight="800" fill="#17233d">Ledger</text>

  <text x="80" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="800" fill="#17233d">Your money,</text>
  <text x="80" y="376" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="800" fill="#17233d">in your hands.</text>
  <text x="80" y="428" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#55617a">Persian calendar · budgets · visual reports</text>

  <g font-family="Segoe UI, Arial, sans-serif" font-size="19" font-weight="700">
    <rect x="80" y="474" width="172" height="48" rx="24" fill="#d9482b" fill-opacity="0.1" stroke="#d9482b" stroke-opacity="0.34" />
    <text x="107" y="505" fill="#b53a20">Jalali calendar</text>
    <rect x="266" y="474" width="118" height="48" rx="24" fill="#2a9d8f" fill-opacity="0.1" stroke="#2a9d8f" stroke-opacity="0.34" />
    <text x="292" y="505" fill="#1f7f75">Budgets</text>
    <rect x="398" y="474" width="150" height="48" rx="24" fill="#17233d" fill-opacity="0.06" stroke="#17233d" stroke-opacity="0.18" />
    <text x="424" y="505" fill="#3c4a63">100% local</text>
  </g>

  <g>
    <rect x="706" y="118" width="420" height="394" rx="26" fill="url(#card)" stroke="#17233d" stroke-opacity="0.12" />
    <text x="742" y="168" font-family="Segoe UI, Arial, sans-serif" font-size="15" font-weight="700" letter-spacing="1.6" fill="#8a7f6b">THIS MONTH</text>
    <text x="742" y="212" font-family="Segoe UI, Arial, sans-serif" font-size="38" font-weight="800" fill="#17233d">48,200,000</text>
    <text x="742" y="238" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#6b7280">balance in Toman</text>

    <rect x="742" y="264" width="168" height="74" rx="16" fill="#2a9d8f" fill-opacity="0.1" />
    <text x="760" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#1f7f75">Income</text>
    <text x="760" y="320" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#17233d">62,000,000</text>
    <rect x="922" y="264" width="168" height="74" rx="16" fill="#d9482b" fill-opacity="0.08" />
    <text x="940" y="292" font-family="Segoe UI, Arial, sans-serif" font-size="13" fill="#b53a20">Expenses</text>
    <text x="940" y="320" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#17233d">13,800,000</text>

    <g>
      <rect x="742" y="368" width="24" height="58" rx="7" fill="#2a9d8f" opacity="0.28" />
      <rect x="780" y="348" width="24" height="78" rx="7" fill="#2a9d8f" opacity="0.36" />
      <rect x="818" y="386" width="24" height="40" rx="7" fill="#2a9d8f" opacity="0.24" />
      <rect x="856" y="332" width="24" height="94" rx="7" fill="#2a9d8f" opacity="0.5" />
      <rect x="894" y="360" width="24" height="66" rx="7" fill="#e4572e" opacity="0.34" />
      <rect x="932" y="390" width="24" height="36" rx="7" fill="#e4572e" opacity="0.26" />
      <rect x="970" y="344" width="24" height="82" rx="7" fill="#e4572e" opacity="0.42" />
      <rect x="1008" y="374" width="24" height="52" rx="7" fill="#e4572e" opacity="0.3" />
      <path d="M742 452h306" stroke="#17233d" stroke-opacity="0.12" stroke-width="2" />
    </g>
    <rect x="742" y="466" width="306" height="6" rx="3" fill="#17233d" fill-opacity="0.07" />
    <rect x="742" y="466" width="188" height="6" rx="3" fill="#d9482b" opacity="0.7" />
  </g>

  <text x="80" y="596" font-family="Segoe UI, Arial, sans-serif" font-size="17" fill="#7a705f">github.com/noxaplus-star/noxaplus-ledger · noxaplus.ir</text>
</svg>
`;

await sharp(Buffer.from(ogSvg), { density: 144 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toFile(path.join(publicDir, 'og.png'));

console.log('og.png');
