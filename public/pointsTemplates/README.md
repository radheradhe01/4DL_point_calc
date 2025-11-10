# Points Templates Setup

## Overview
The Tournament Points Template system uses full template images as backgrounds with data overlaid on top. This provides pixel-perfect alignment with designer artwork.

## Adding a Template Image

1. **Place your full template image** in the template folder:
   ```
   public/pointsTemplates/wildwest_v1/full.jpg
   ```
   
   The image should be exactly **1500px × 2000px** (3:4 aspect ratio) to match the export dimensions.

2. **Update positioning** in `public/pointsTemplates/wildwest_v1/meta.json`:
   - Measure the exact pixel coordinates of the table area in your design tool (Figma, Photoshop, etc.)
   - Update `tablePosition` with:
     - `left`: X position of table start
     - `top`: Y position of table start  
     - `width`: Total table width
     - `height`: Total table height
   - Update `columnWidths` array to match your column widths exactly
   - Adjust `rowHeight` and `headerRowHeight` to match your row heights
   - Update `textStyles` for font sizes, weights, and colors

## Current Template: Wild West

- **Image**: `/pointsTemplates/wildwest_v1/full.jpg`
- **Dimensions**: 1500 × 2000px
- **Table Position**: 
  - Left: 100px
  - Top: 270px
  - Width: 1140px
  - Height: 1160px
- **Columns**: POS (80px), TEAM NAME (300px), MATCH (80px), PLACE. (100px), FINISH (100px), TOTAL (100px), WINS (80px)
- **Rows**: 12 data rows + 1 header row

## How It Works

1. The full template image is set as a background covering the entire 1500×2000px canvas
2. An absolute-positioned CSS Grid overlay is placed exactly where the table should be
3. Data is rendered as transparent text over the template cells
4. Export captures the entire canvas as a PNG with perfect alignment

## Fine-Tuning Alignment

If numbers don't align perfectly:

1. Open your design file and measure the exact pixel positions
2. Update `tablePosition` in `meta.json`
3. Adjust `columnWidths` to match column boundaries
4. Test export and iterate until perfect

The positioning values are in pixels and should match your design tool exactly.

