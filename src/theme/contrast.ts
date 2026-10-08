/**
 * WCAG contrast helpers, used by tests to check every theme stays readable.
 * Accepts #RGB, #RRGGBB and rgba(r,g,b,a). Alpha colours are blended over `background`.
 */

type Rgb = { r: number; g: number; b: number };

export function parseColor(color: string, background?: string): Rgb {
  const value = color.trim();

  const hexDigits = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value)?.[1];
  if (hexDigits) {
    const digits = hexDigits.length === 3 ? [...hexDigits].map((d) => d + d).join('') : hexDigits;
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
    };
  }

  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value);
  if (rgba) {
    const top = { r: Number(rgba[1]), g: Number(rgba[2]), b: Number(rgba[3]) };
    const alpha = rgba[4] === undefined ? 1 : Number(rgba[4]);
    if (alpha >= 1) return top;
    if (!background) throw new Error(`Colour "${color}" is translucent; pass a background to blend it over.`);
    const base = parseColor(background);
    return {
      r: Math.round(top.r * alpha + base.r * (1 - alpha)),
      g: Math.round(top.g * alpha + base.g * (1 - alpha)),
      b: Math.round(top.b * alpha + base.b * (1 - alpha)),
    };
  }

  throw new Error(`Unsupported colour format: "${color}"`);
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio from 1 to 21. 4.5 is the minimum for normal text, 3 for large text and UI shapes. */
export function contrastRatio(foreground: string, background: string): number {
  const bg = parseColor(background);
  const fg = parseColor(foreground, background);
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}
