import { formatBRL } from '../calculations/salary';

/**
 * Shared "result card" actions used by every calculator page: share (URL
 * with encoded inputs), download (branded PNG with a faded watermark),
 * print (native), and copy (plain text summary). Centralizing this here
 * means each calculator page wires up ~10 lines instead of duplicating the
 * ~150-line canvas renderer ten times.
 */

export interface ResultRow {
  label: string;
  value: string;
  /** Hex color for the value text. Defaults to ink. */
  color?: string;
  /** Bold/emphasized row (used for the final total line). */
  emphasis?: boolean;
}

export interface DownloadOptions {
  /** Small eyebrow label above the big number, e.g. "Salário líquido estimado". */
  title: string;
  /** The big headline value, already formatted (e.g. "R$ 1.234,56"). */
  bigValue: string;
  rows: ResultRow[];
  /** Filename without extension. */
  filename: string;
  /** Optional badge text, e.g. "Regras 2026". */
  badge?: string;
}

let watermarkImage: HTMLImageElement | null = null;
function loadWatermarkImage(): Promise<HTMLImageElement | null> {
  if (watermarkImage) return Promise.resolve(watermarkImage);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      watermarkImage = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = '/icon-512.png';
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

export async function downloadResultImage(options: DownloadOptions): Promise<void> {
  const width = 900;
  const height = Math.max(760, 340 + options.rows.length * 56 + 160);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Always render in the light palette, regardless of the current dark-mode
  // toggle state, so the downloaded image is legible everywhere it's shared.
  const ink = '#10192e';
  const inkSoft = '#4a5568';
  const line = '#dde1ea';
  const paper = '#ffffff';
  const accentSoft = '#fbead0';
  const accentInk = '#7a4d05';

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Faded centered watermark — brand icon + domain, drawn low-opacity so it
  // sits behind the content without competing with it.
  const icon = await loadWatermarkImage();
  ctx.save();
  ctx.globalAlpha = 0.12;
  const wmSize = 320;
  if (icon) {
    ctx.drawImage(icon, (width - wmSize) / 2, height / 2 - wmSize / 2 - 20, wmSize, wmSize);
  }
  ctx.fillStyle = ink;
  ctx.font = '700 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('salarioclaro.com', width / 2, height / 2 + wmSize / 2 + 20);
  ctx.restore();
  ctx.textAlign = 'left';

  // Brand mark (header)
  ctx.fillStyle = ink;
  roundRect(ctx, 56, 56, 56, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#d98f0a';
  ctx.font = '700 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('R$', 84, 92);
  ctx.fillStyle = ink;
  ctx.font = '600 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Salário Claro', 128, 92);

  // Title + big number
  ctx.fillStyle = inkSoft;
  ctx.font = '400 20px Arial, sans-serif';
  ctx.fillText(options.title, 56, 168);

  ctx.fillStyle = ink;
  ctx.font = '600 60px Georgia, serif';
  ctx.fillText(options.bigValue, 56, 236);

  let y = 300;
  if (options.badge) {
    ctx.fillStyle = accentSoft;
    roundRect(ctx, 56, y, 24 + options.badge.length * 11, 40, 8);
    ctx.fill();
    ctx.fillStyle = accentInk;
    ctx.font = '600 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.badge, 56 + (24 + options.badge.length * 11) / 2, y + 26);
    ctx.textAlign = 'left';
    y += 76;
  } else {
    y += 20;
  }

  // Breakdown rows
  ctx.font = '400 22px Arial, sans-serif';
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  for (const row of options.rows) {
    ctx.beginPath();
    ctx.moveTo(56, y - 28);
    ctx.lineTo(width - 56, y - 28);
    ctx.stroke();
    ctx.font = row.emphasis ? '700 24px Arial, sans-serif' : '400 22px Arial, sans-serif';
    ctx.fillStyle = row.emphasis ? ink : inkSoft;
    ctx.fillText(row.label, 56, y);
    ctx.fillStyle = row.color ?? (row.emphasis ? ink : ink);
    ctx.textAlign = 'right';
    ctx.fillText(row.value, width - 56, y);
    ctx.textAlign = 'left';
    y += 56;
  }

  // Disclaimer footer
  ctx.font = '400 16px Arial, sans-serif';
  ctx.fillStyle = inkSoft;
  wrapText(
    ctx,
    'Este cálculo é uma estimativa e não substitui o holerite oficial ou a orientação de um profissional de contabilidade.',
    56,
    height - 60,
    width - 112,
    22
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${options.filename}.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}

/** Copies a plain-text summary to the clipboard. */
export async function copyResultText(lines: string[]): Promise<boolean> {
  const text = `${lines.join('\n')}\n\nCalculado em salarioclaro.com`;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Builds a shareable URL for the current page with the given query params, and shares/copies it. */
export async function shareResult(params: Record<string, string | number>, shareText: string): Promise<'shared' | 'copied' | 'prompted'> {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '' && value !== 0) {
      usp.set(key, String(value));
    }
  }
  const shareUrl = `${window.location.origin}${window.location.pathname}?${usp.toString()}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Salário Claro', text: shareText, url: shareUrl });
      return 'shared';
    } catch {
      // User cancelled — fall through to clipboard copy.
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    return 'copied';
  } catch {
    window.prompt('Copie o link do cálculo:', shareUrl);
    return 'prompted';
  }
}

export function flashButtonText(button: HTMLButtonElement, tempText: string) {
  const original = button.textContent;
  button.textContent = tempText;
  setTimeout(() => (button.textContent = original), 1600);
}

export { formatBRL };
