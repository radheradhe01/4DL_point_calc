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
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
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
 * Calculate hue difference between two colors (0-180 degrees)
 */
function getHueDifference(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return 180; // Maximum difference if invalid
  
  const hsl1 = rgbToHsl(rgb1.r, rgb1.g, rgb1.b);
  const hsl2 = rgbToHsl(rgb2.r, rgb2.g, rgb2.b);
  
  const diff = Math.abs(hsl1.h - hsl2.h);
  return Math.min(diff, 360 - diff); // Get shortest arc distance
}

/**
 * Check if two colors are distinct (at least 30 degrees hue difference)
 */
function isDistinctColor(hex1: string | undefined, hex2: string | undefined): boolean {
  if (!hex1 || !hex2) return true;
  return getHueDifference(hex1, hex2) >= 30;
}

/**
 * Calculate contrast color (white or black) based on luminance
 */
function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#FFFFFF';
  
  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance < 0.5 ? '#FFFFFF' : '#000000';
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
 * Generate theme colors from image palette
 * Uses maxDimension to optimize performance for large images
 */
async function generateThemeFromImage(imagePath: string): Promise<ThemeColors> {
  try {
    // Create Vibrant instance - optimize for performance with large images
    // Note: node-vibrant v4 may support options as second parameter
    let builder = Vibrant.from(imagePath);
    
    // Try to apply optimizations if methods exist (for better performance)
    // These are optional and won't break if not supported
    if (typeof builder.maxColorCount === 'function') {
      builder = builder.maxColorCount(64); // More colors for better palette extraction
    }
    if (typeof builder.maxDimension === 'function') {
      builder = builder.maxDimension(512); // Scale down large images for faster processing
    }
    
    const palette = await builder.getPalette();
    
    // Strategy: Use different swatches intelligently to ensure color diversity
    // Header: Prefer DarkVibrant for good contrast, fallback to DarkMuted
    const headerBg = palette.DarkVibrant?.hex || palette.DarkMuted?.hex || palette.Vibrant?.hex || '#333333';
    const headerText = getContrastColor(headerBg);
    
    // Total column: Prefer LightVibrant (usually pastel/highlight), ensure distinct from header
    let totalBg = palette.LightVibrant?.hex;
    if (!totalBg || !isDistinctColor(totalBg, headerBg)) {
      totalBg = palette.Muted?.hex;
    }
    if (!totalBg || !isDistinctColor(totalBg, headerBg)) {
      totalBg = palette.LightMuted?.hex;
    }
    if (!totalBg || !isDistinctColor(totalBg, headerBg)) {
      // If still not distinct, use a complementary approach
      const rgb = hexToRgb(headerBg);
      if (rgb) {
        // Create a lighter, more saturated version
        totalBg = `#${Math.min(255, rgb.r + 50).toString(16).padStart(2, '0')}${Math.min(255, rgb.g + 50).toString(16).padStart(2, '0')}${Math.min(255, rgb.b + 50).toString(16).padStart(2, '0')}`;
      } else {
        totalBg = '#FFD700';
      }
    }
    const totalFg = getContrastColor(totalBg);
    
    // Wins column: Must be distinct from headerBg (priority), ideally also from totalBg
    // Try multiple swatches to find a distinct color
    const swatchOptions = [
      palette.Vibrant?.hex,
      palette.DarkVibrant?.hex,
      palette.Muted?.hex,
      palette.LightVibrant?.hex,
      palette.DarkMuted?.hex,
      palette.LightMuted?.hex,
    ].filter(Boolean) as string[];
    
    let winsBg: string | undefined;
    
    // Priority 1: Find first swatch that's distinct from header (required)
    for (const swatch of swatchOptions) {
      if (swatch && isDistinctColor(swatch, headerBg)) {
        winsBg = swatch;
        break;
      }
    }
    
    // Priority 2: Ensure winsBg is also distinct from totalBg
    if (winsBg && !isDistinctColor(winsBg, totalBg)) {
      // Try to find another that's distinct from both header and total
      for (const swatch of swatchOptions) {
        if (swatch && isDistinctColor(swatch, headerBg) && isDistinctColor(swatch, totalBg)) {
          winsBg = swatch;
          break;
        }
      }
    }
    
    // Priority 3: If winsBg matches totalBg, force a contrasting color
    if (winsBg && !isDistinctColor(winsBg, totalBg)) {
      // Use contrasting logic based on header color
      const headerRgb = hexToRgb(headerBg);
      if (headerRgb) {
        const hsl = rgbToHsl(headerRgb.r, headerRgb.g, headerRgb.b);
        if (hsl.h >= 60 && hsl.h <= 180) {
          winsBg = '#E63946'; // Red for green headers
        } else if ((hsl.h >= 0 && hsl.h < 60) || (hsl.h >= 300 && hsl.h <= 360)) {
          winsBg = '#146aae'; // Blue for red headers
        } else if (hsl.h >= 180 && hsl.h < 300) {
          winsBg = '#FF6B35'; // Orange for blue headers
        } else {
          winsBg = '#E63946'; // Default red
        }
      } else {
        winsBg = '#E63946'; // Default fallback
      }
    }
    
    // Final check: If still no distinct color found from header, create a contrasting one
    if (!winsBg || !isDistinctColor(winsBg, headerBg)) {
      const headerRgb = hexToRgb(headerBg);
      if (headerRgb) {
        const hsl = rgbToHsl(headerRgb.r, headerRgb.g, headerRgb.b);
        // Create a contrasting color based on header hue
        // Green range (60-180) -> use red
        // Red range (0-60, 300-360) -> use blue
        // Blue range (180-300) -> use orange/yellow
        if (hsl.h >= 60 && hsl.h <= 180) {
          winsBg = '#E63946'; // Red for green headers
        } else if ((hsl.h >= 0 && hsl.h < 60) || (hsl.h >= 300 && hsl.h <= 360)) {
          winsBg = '#146aae'; // Blue for red headers
        } else if (hsl.h >= 180 && hsl.h < 300) {
          winsBg = '#FF6B35'; // Orange for blue headers
        } else {
          winsBg = '#E63946'; // Default red
        }
      } else {
        winsBg = '#E63946'; // Default fallback
      }
    }
    const winsFg = getContrastColor(winsBg);
    
    // Default text color based on background luminance
    const bgLuminance = hexToRgb(headerBg) 
      ? (0.299 * hexToRgb(headerBg)!.r + 0.587 * hexToRgb(headerBg)!.g + 0.114 * hexToRgb(headerBg)!.b) / 255
      : 0.5;
    const text = bgLuminance < 0.5 ? '#FFFFFF' : '#000000';
    
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
      headerBg: '#FF6B35',
      headerText: '#FFFFFF',
      totalBg: '#FFD700',
      totalFg: '#000000',
      winsBg: '#8B0000',
      winsFg: '#FFFFFF',
      text: '#000000',
    };
  }
}

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

