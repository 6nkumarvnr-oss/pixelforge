const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const hashText = (value: string) =>
  value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);

export type FallbackArtInput = {
  prompt: string;
  negative: string;
  model: string;
  aspect: string;
  seed: number;
  sampler: string;
  intensity: number;
  upscale: boolean;
  removeBackground: boolean;
  colorBoost: boolean;
};

export const makeGeneratedArt = ({
  prompt,
  negative,
  model,
  aspect,
  seed,
  sampler,
  intensity,
  upscale,
  removeBackground,
  colorBoost,
}: FallbackArtInput) => {
  const hash = hashText(`${prompt}-${negative}-${model}-${aspect}-${seed}-${sampler}`);
  const palettes = [
    ["#7C3AED", "#06B6D4", "#FB7185", "#FDE68A"],
    ["#4F46E5", "#14B8A6", "#F97316", "#E0E7FF"],
    ["#9333EA", "#22D3EE", "#F43F5E", "#DCFCE7"],
    ["#2563EB", "#A855F7", "#F59E0B", "#F8FAFC"],
  ];
  const palette = palettes[hash % palettes.length];
  const [wRatio, hRatio] = aspect.split(":").map(Number);
  const width = 900;
  const height = Math.round((900 * hRatio) / wRatio);
  const title = escapeXml(prompt.slice(0, 82) || "Untitled creative prompt");
  const subtitle = escapeXml(`${model} • ${sampler} • seed ${seed}`);
  const sharpness = upscale ? "contrast(1.12) saturate(1.16)" : "contrast(1.02)";
  const saturation = colorBoost ? "saturate(1.38)" : "saturate(1.05)";
  const bgOpacity = removeBackground ? "0.18" : "1";
  const orbitCount = 7 + (hash % 6);
  const circles = Array.from({ length: orbitCount }, (_, index) => {
    const x = 90 + ((hash >> (index % 12)) % 720);
    const y = 100 + ((hash >> ((index + 5) % 13)) % Math.max(160, height - 180));
    const r = 34 + ((hash >> ((index + 2) % 10)) % 92);
    const color = palette[index % palette.length];
    const opacity = 0.18 + ((index % 4) * 0.08);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}" />`;
  }).join("");
  const paths = Array.from({ length: 4 }, (_, index) => {
    const y = 150 + index * (height / 6);
    const color = palette[(index + 1) % palette.length];
    return `<path d="M ${-80 + index * 20} ${y} C ${width * 0.25} ${y - 150}, ${width * 0.68} ${y + 170}, ${width + 80} ${y - 20}" fill="none" stroke="${color}" stroke-width="${18 + index * 8}" stroke-linecap="round" opacity="${0.18 + index * 0.05}" />`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${palette[0]}"/>
        <stop offset="0.48" stop-color="${palette[1]}"/>
        <stop offset="1" stop-color="${palette[2]}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="70%">
        <stop offset="0" stop-color="${palette[3]}" stop-opacity="0.92"/>
        <stop offset="0.54" stop-color="${palette[1]}" stop-opacity="0.34"/>
        <stop offset="1" stop-color="${palette[0]}" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="22"/></filter>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="${seed}"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.12"/></feComponentTransfer></filter>
    </defs>
    <rect width="100%" height="100%" rx="42" fill="url(#bg)" opacity="${bgOpacity}"/>
    <rect width="100%" height="100%" rx="42" fill="#121026" opacity="${removeBackground ? 0.16 : 0.28}"/>
    <g style="filter:${sharpness} ${saturation}">
      <circle cx="${width * 0.72}" cy="${height * 0.26}" r="${190 + intensity}" fill="url(#glow)" filter="url(#soft)"/>
      ${circles}
      ${paths}
      <rect x="${width * 0.1}" y="${height * 0.15}" width="${width * 0.8}" height="${height * 0.62}" rx="36" fill="#ffffff" opacity="0.13" stroke="#ffffff" stroke-opacity="0.32"/>
      <path d="M${width * 0.18} ${height * 0.72} L${width * 0.36} ${height * 0.42} L${width * 0.5} ${height * 0.58} L${width * 0.64} ${height * 0.36} L${width * 0.82} ${height * 0.72} Z" fill="#fff" opacity="0.23"/>
      <circle cx="${width * 0.68}" cy="${height * 0.3}" r="42" fill="#fff" opacity="0.38"/>
    </g>
    <rect x="36" y="${height - 152}" width="${width - 72}" height="112" rx="28" fill="#0F102A" opacity="0.78"/>
    <text x="66" y="${height - 98}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">${title}</text>
    <text x="66" y="${height - 58}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#CFFAFE">${subtitle}</text>
    <rect width="100%" height="100%" rx="42" fill="transparent" filter="url(#grain)"/>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};
