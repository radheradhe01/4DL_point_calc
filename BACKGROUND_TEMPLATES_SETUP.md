# Background Templates Setup Guide

## Overview
The application now uses predefined background templates instead of file uploads. Users can select from 4-5 templates when creating a lobby.

## Adding Template Images

1. **Create the backgrounds directory** (if it doesn't exist):
   ```bash
   mkdir -p public/backgrounds
   ```

2. **Add your template images**:
   - Place full-resolution images in `public/backgrounds/`
   - Place preview images (smaller, optimized) in `public/backgrounds/`
   - Naming convention:
     - Full images: `template1.jpg`, `template2.jpg`, etc.
     - Preview images: `template1-preview.jpg`, `template2-preview.jpg`, etc.

3. **Update template configuration**:
   - Edit `src/lib/backgroundTemplates.ts`
   - Update the `BACKGROUND_TEMPLATES` array with your template details:
     ```typescript
     {
       id: 'template1',
       name: 'Your Template Name',
       previewUrl: '/backgrounds/template1-preview.jpg',
       imageUrl: '/backgrounds/template1.jpg',
       description: 'Description of the template',
     }
     ```

## Recommended Image Specifications

- **Full Resolution Images**:
  - Format: JPG or PNG
  - Dimensions: 1920x1080px or higher (16:9 aspect ratio)
  - File size: Optimized (under 1MB recommended)

- **Preview Images**:
  - Format: JPG (optimized)
  - Dimensions: 400x225px (16:9 aspect ratio)
  - File size: Under 100KB recommended

## Database Migration

Run the migration SQL to add the `background_template` column:

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE lobbies 
ADD COLUMN IF NOT EXISTS background_template TEXT;
```

## Current Templates

The system is configured for 5 templates:
1. Cosmic Nebula
2. Fire & Fury
3. Electric Blue
4. Dark Arena
5. Championship Gold

Update the template configuration in `src/lib/backgroundTemplates.ts` to match your actual template images.

