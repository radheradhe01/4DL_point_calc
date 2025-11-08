/* eslint-disable no-console */
const { Vibrant } = require('node-vibrant/node');
const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

const BG_DIR = path.join(process.cwd(), 'public/backgrounds');
const OUT_FILE = path.join(process.cwd(), 'src/lib/themes.generated.json');
const MANUAL = path.join(process.cwd(), 'themes.manual.json'); // optional overrides

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return null;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

/**
 * Convert RGB to XYZ (D65 illuminant)
 */
function rgbToXyz(r: number, g: number, b: number): { x: number; y: number; z: number } {
  // Normalize RGB to 0-1
  let rNorm = r / 255;
  let gNorm = g / 255;
  let bNorm = b / 255;

  // Apply gamma correction
  rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
  gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
  bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

  // Convert to XYZ using sRGB matrix
  const x = (rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375) * 100;
  const y = (rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750) * 100;
  const z = (rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041) * 100;

  return { x, y, z };
}

/**
 * Convert XYZ to CIELAB
 */
function xyzToLab(x: number, y: number, z: number): { l: number; a: number; b: number } {
  // D65 white point
  const xn = 95.047;
  const yn = 100.0;
  const zn = 108.883;

  const fx = x / xn > 0.008856 ? Math.pow(x / xn, 1/3) : (7.787 * x / xn + 16/116);
  const fy = y / yn > 0.008856 ? Math.pow(y / yn, 1/3) : (7.787 * y / yn + 16/116);
  const fz = z / zn > 0.008856 ? Math.pow(z / zn, 1/3) : (7.787 * z / zn + 16/116);

  const l = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { l, a, b };
}

/**
 * Convert RGB to CIELAB
 */
function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  const xyz = rgbToXyz(r, g, b);
  return xyzToLab(xyz.x, xyz.y, xyz.z);
}

/**
 * Calculate Delta E (perceptual color difference) using CIEDE2000 approximation
 * Returns a value where < 2.3 is barely perceptible, > 5 is clearly different
 */
function deltaE(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return 100; // Maximum difference if invalid
  
  const lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b);
  const lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b);
  
  // Simplified Delta E calculation (Euclidean distance in LAB space)
  // For production, use full CIEDE2000 formula, but this is good enough
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  
  return Math.sqrt(dl * dl + da * da + db * db);
}

/**
 * Check if two colors are perceptually distinct (Delta E > 15)
 */
function isDistinctColor(hex1: string | undefined, hex2: string | undefined): boolean {
  if (!hex1 || !hex2) return true;
  return deltaE(hex1, hex2) > 15; // 15 is a good threshold for "clearly different"
}

/**
 * Calculate relative luminance (WCAG formula)
 */
function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const rLin = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLin = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLin = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculate contrast ratio (WCAG)
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get best contrast color (white or black) with WCAG AA compliance
 */
function getContrastColor(hex: string): string {
  const whiteContrast = getContrastRatio(hex, '#FFFFFF');
  const blackContrast = getContrastRatio(hex, '#000000');
  
  // Prefer the one with better contrast, but ensure AA compliance (4.5:1)
  if (whiteContrast >= 4.5 && whiteContrast >= blackContrast) {
    return '#FFFFFF';
  }
  if (blackContrast >= 4.5) {
    return '#000000';
  }
  // If neither meets AA, use the better one anyway
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Adjust color lightness to meet contrast requirements
 */
function adjustForContrast(bgHex: string, targetContrast: number = 4.5): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return bgHex;
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  let adjustedL = hsl.l;
  let attempts = 0;
  
  // Try adjusting lightness until we get good contrast
  while (attempts < 20) {
    const testRgb = hslToRgb(hsl.h, hsl.s, adjustedL);
    const testHex = `#${Math.round(testRgb.r).toString(16).padStart(2, '0')}${Math.round(testRgb.g).toString(16).padStart(2, '0')}${Math.round(testRgb.b).toString(16).padStart(2, '0')}`;
    const whiteContrast = getContrastRatio(testHex, '#FFFFFF');
    const blackContrast = getContrastRatio(testHex, '#000000');
    
    if (whiteContrast >= targetContrast || blackContrast >= targetContrast) {
      return testHex;
    }
    
    // Darken if too light, lighten if too dark
    if (adjustedL > 0.5) {
      adjustedL -= 0.05;
    } else {
      adjustedL += 0.05;
    }
    attempts++;
  }
  
  return bgHex; // Return original if adjustment fails
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hNorm = h / 360;
    
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s, l };
}

/**
 * Theme color structure
 */
interface ThemeColors {
  headerBg: string;
  headerText: string;
  totalBg: string;
  totalFg: string;
  winsBg: string;
  winsFg: string;
  text: string;
}

/**
 * Analyze palette swatches and extract properties
 */
function analyzeSwatches(palette: any): Array<{ hex: string; luminance: number; saturation: number; lab: { l: number; a: number; b: number } }> {
  const swatches = [
    { name: 'Vibrant', swatch: palette.Vibrant },
    { name: 'DarkVibrant', swatch: palette.DarkVibrant },
    { name: 'LightVibrant', swatch: palette.LightVibrant },
    { name: 'Muted', swatch: palette.Muted },
    { name: 'DarkMuted', swatch: palette.DarkMuted },
    { name: 'LightMuted', swatch: palette.LightMuted },
  ];
  
  return swatches
    .filter(item => item.swatch?.hex)
    .map(item => {
      const rgb = hexToRgb(item.swatch.hex);
      if (!rgb) return null;
      
      const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      
      return {
        hex: item.swatch.hex,
        luminance: getLuminance(item.swatch.hex),
        saturation: hsl.s,
        lab,
      };
    })
    .filter(Boolean) as Array<{ hex: string; luminance: number; saturation: number; lab: { l: number; a: number; b: number } }>;
}

/**
 * Check if image is monochrome/low saturation
 */
function isMonochrome(swatches: Array<{ saturation: number }>): boolean {
  if (swatches.length === 0) return true;
  const avgSaturation = swatches.reduce((sum, s) => sum + s.saturation, 0) / swatches.length;
  return avgSaturation < 0.15; // Very low saturation = monochrome
}

/**
 * Generate theme colors from image palette with advanced analysis
 */
async function generateThemeFromImage(imagePath: string): Promise<ThemeColors> {
  try {
    // Create Vibrant instance - optimize for performance
    let builder = Vibrant.from(imagePath);
    
    if (typeof builder.maxColorCount === 'function') {
      builder = builder.maxColorCount(64);
    }
    if (typeof builder.maxDimension === 'function') {
      builder = builder.maxDimension(512);
    }
    
    const palette = await builder.getPalette();
    const swatches = analyzeSwatches(palette);

    // Identify background color (darkest swatch, likely the background)
    const backgroundSwatch = swatches.reduce((darkest, current) => 
      current.luminance < darkest.luminance ? current : darkest
    );
    
    // ---- Tikdam quick path ----
    const tikdamAccent = pickAccentTikdam(palette);
    if (tikdamAccent) {
      const accent = adjustForContrast(tikdamAccent, 4.5);
      const highlight = adjustForContrast(getComplementaryHex(accent), 4.5);
      if (isDistinctColor(accent, highlight)) {
        return {
          headerBg: accent,
          headerText: getContrastColor(accent),
          totalBg: highlight,
          totalFg: getContrastColor(highlight),
          winsBg: accent,
          winsFg: getContrastColor(accent),
          text: getContrastColor(backgroundSwatch ? backgroundSwatch.hex : accent),
        } as ThemeColors;
      }
    }
    // ---- end Tikdam ----
    
    if (swatches.length === 0) {
      throw new Error('No valid swatches found');
    }
    
    // Check if image is monochrome/desaturated
    const monochrome = isMonochrome(swatches);
    
    // For monochrome images, use neutral theme
    if (monochrome) {
      const headerBg = backgroundSwatch.hex;
      const headerText = getContrastColor(headerBg);
      
      // Use gold/yellow for total in monochrome themes
      const totalBg = '#FFD700';
      const totalFg = getContrastColor(totalBg);
      
      // Use red for wins (always distinct)
      const winsBg = '#E63946';
      const winsFg = getContrastColor(winsBg);
      
      return {
        headerBg,
        headerText,
        totalBg,
        totalFg,
        winsBg,
        winsFg,
        text: headerText,
      };
    }
    
    // HEADER: Use darkest vibrant/muted color that's distinct from background
    // Prefer colors that exist in the image palette
    let headerBg = palette.DarkVibrant?.hex || palette.DarkMuted?.hex;
    
    // Ensure header is distinct from background (if background is very dark)
    if (headerBg && backgroundSwatch.luminance < 0.2) {
      const de = deltaE(headerBg, backgroundSwatch.hex);
      if (de < 10) {
        // Too similar, try lighter option
        headerBg = palette.Vibrant?.hex || palette.Muted?.hex || headerBg;
      }
    }
    
    if (!headerBg) {
      headerBg = backgroundSwatch.hex;
    }
    
    // Ensure good contrast for header
    headerBg = adjustForContrast(headerBg, 4.5);
    const headerText = getContrastColor(headerBg);
    
    // TOTAL: Use lightest swatch that's distinct from header (for highlight effect)
    // Prioritize colors from the image palette
    let totalBg = palette.LightVibrant?.hex || palette.LightMuted?.hex;
    
    // Find lightest swatch that's distinct from header
    if (!totalBg || !isDistinctColor(totalBg, headerBg)) {
      const lightSwatches = swatches
        .filter(s => isDistinctColor(s.hex, headerBg))
        .sort((a, b) => b.luminance - a.luminance);
      
      if (lightSwatches.length > 0) {
        totalBg = lightSwatches[0].hex;
      }
    }
    
    // If still no good option, create a lighter version of header
    if (!totalBg || !isDistinctColor(totalBg, headerBg)) {
      const headerRgb = hexToRgb(headerBg);
      if (headerRgb) {
        const hsl = rgbToHsl(headerRgb.r, headerRgb.g, headerRgb.b);
        // Create lighter, more saturated version
        const lighterHsl = { ...hsl, l: Math.min(0.9, hsl.l + 0.3), s: Math.min(1, hsl.s + 0.2) };
        const lighterRgb = hslToRgb(lighterHsl.h, lighterHsl.s, lighterHsl.l);
        totalBg = `#${lighterRgb.r.toString(16).padStart(2, '0')}${lighterRgb.g.toString(16).padStart(2, '0')}${lighterRgb.b.toString(16).padStart(2, '0')}`;
      } else {
        totalBg = '#FFD700';
      }
    }
    
    const totalFg = getContrastColor(totalBg);
    
    // WINS: Must be distinct from both header and total, prefer colors from palette
    // Try all swatches to find one that's distinct from both
    let winsBg: string | undefined;
    
    for (const swatch of swatches) {
      if (isDistinctColor(swatch.hex, headerBg) && isDistinctColor(swatch.hex, totalBg)) {
        winsBg = swatch.hex;
        break;
      }
    }
    
    // If no swatch works, try ones distinct from header only
    if (!winsBg) {
      for (const swatch of swatches) {
        if (isDistinctColor(swatch.hex, headerBg)) {
          winsBg = swatch.hex;
          break;
        }
      }
    }
    
    // If still no match, create complementary color based on header
    if (!winsBg || !isDistinctColor(winsBg, headerBg)) {
      const headerRgb = hexToRgb(headerBg);
      if (headerRgb) {
        const hsl = rgbToHsl(headerRgb.r, headerRgb.g, headerRgb.b);
        // Shift hue by 150-180 degrees for complement
        const complementaryHue = (hsl.h + 150) % 360;
        // Keep similar saturation, adjust lightness for visibility
        const compHsl = { h: complementaryHue, s: Math.max(0.5, hsl.s), l: hsl.l < 0.5 ? 0.6 : 0.4 };
        const compRgb = hslToRgb(compHsl.h, compHsl.s, compHsl.l);
        winsBg = `#${compRgb.r.toString(16).padStart(2, '0')}${compRgb.g.toString(16).padStart(2, '0')}${compRgb.b.toString(16).padStart(2, '0')}`;
      } else {
        winsBg = '#E63946'; // Fallback red
      }
    }
    
    // Ensure wins is distinct from total
    if (winsBg && !isDistinctColor(winsBg, totalBg)) {
      const headerRgb = hexToRgb(headerBg);
      if (headerRgb) {
        const hsl = rgbToHsl(headerRgb.r, headerRgb.g, headerRgb.b);
        // Use opposite side of color wheel
        if (hsl.h >= 60 && hsl.h <= 180) {
          winsBg = '#E63946'; // Red for green
        } else if ((hsl.h >= 0 && hsl.h < 60) || (hsl.h >= 300 && hsl.h <= 360)) {
          winsBg = '#146aae'; // Blue for red
        } else {
          winsBg = '#FF6B35'; // Orange for blue
        }
      }
    }
    
    const winsFg = getContrastColor(winsBg);
    
    // Text color based on overall background luminance
    const text = backgroundSwatch.luminance < 0.5 ? '#FFFFFF' : '#000000';
    
    return {
      headerBg,
      headerText,
      totalBg,
      totalFg,
      winsBg,
      winsFg,
      text,
    };
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error);
    // Return default theme on error
    return {
      headerBg: '#333333',
      headerText: '#FFFFFF',
      totalBg: '#FFD700',
      totalFg: '#000000',
      winsBg: '#E63946',
      winsFg: '#FFFFFF',
      text: '#FFFFFF',
    };
  }
}

// ADD after generateThemeFromImage definition (around line 350)
//
// ----- Tikdam helper utilities -----
function getComplementaryHex(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const compHue = (hsl.h + 150) % 360; // ~opposite but warmer
  const compRgb = hslToRgb(compHue, hsl.s, hsl.l > 0.5 ? hsl.l - 0.1 : hsl.l + 0.1);
  return `#${compRgb.r.toString(16).padStart(2, '0')}${compRgb.g.toString(16).padStart(2, '0')}${compRgb.b.toString(16).padStart(2, '0')}`;
}

function pickAccentTikdam(palette: any): string | undefined {
  // Choose swatch with max(population * saturation)
  const swatchEntries = Object.values(palette) as any[];
  let best: any = undefined;
  let bestScore = -1;
  for (const sw of swatchEntries) {
    if (!sw || !sw.hex) continue;
    const rgb = hexToRgb(sw.hex);
    if (!rgb) continue;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const score = (sw.population || 0) * hsl.s;
    if (score > bestScore) {
      bestScore = score;
      best = sw;
    }
  }
  return best?.hex;
}
// ----- end Tikdam helpers -----

/**
 * Main function to generate themes
 */
async function generateThemes() {
  try {
    console.log('🎨 Generating themes from background images...');
    
    // Find all background images (excluding previews)
    const allImages = await fg(['*.{jpg,jpeg,png,webp}'], { cwd: BG_DIR });
    const images = allImages.filter((img: string) => !img.includes('-preview'));
    
    if (images.length === 0) {
      console.warn('⚠️  No background images found in', BG_DIR);
      return;
    }
    
    console.log(`📸 Found ${images.length} background image(s)`);
    
    const themes: Record<string, ThemeColors> = {};
    
    // Process each image
    for (const file of images) {
      const imagePath = path.join(BG_DIR, file);
      const id = path.parse(file).name;
      
      console.log(`  Processing: ${id}...`);
      const theme = await generateThemeFromImage(imagePath);
      themes[id] = theme;
    }
    
    // Add black theme manually (no image to process)
    themes['black'] = {
      headerBg: '#000000',
      headerText: '#FFFFFF',
      totalBg: '#FFD700',
      totalFg: '#000000',
      winsBg: '#E63946',
      winsFg: '#FFFFFF',
      text: '#FFFFFF',
    };
    
    // Merge manual overrides if present
    if (fs.existsSync(MANUAL)) {
      console.log('📝 Merging manual overrides...');
      const manual = JSON.parse(fs.readFileSync(MANUAL, 'utf8'));
      Object.assign(themes, manual);
    }
    
    // Ensure output directory exists
    const outDir = path.dirname(OUT_FILE);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    // Write generated themes
    fs.writeFileSync(OUT_FILE, JSON.stringify(themes, null, 2));
    console.log(`✅ Generated ${Object.keys(themes).length} theme(s) → ${OUT_FILE}`);
    
  } catch (error) {
    console.error('❌ Error generating themes:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateThemes();
}

module.exports = generateThemes;

