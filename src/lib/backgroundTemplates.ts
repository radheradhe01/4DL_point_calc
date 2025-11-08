import { promises as fs } from 'fs';
import path from 'path';

export interface BackgroundTemplate {
  id: string;
  name: string;
  previewUrl: string;
  imageUrl: string;
  description?: string;
}

/**
 * Get all background templates dynamically from the backgrounds folder
 */
export async function getBackgroundTemplates(): Promise<BackgroundTemplate[]> {
  try {
    const backgroundsDir = path.join(process.cwd(), 'public', 'backgrounds');
    const files = await fs.readdir(backgroundsDir);
    
    // Filter for image files (jpg, jpeg, png, webp)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });
    
    // Group files by base name (without extension and -preview suffix)
    const templatesMap = new Map<string, { full?: string; preview?: string; fullExt?: string }>();
    
    for (const file of imageFiles) {
      // Extract base name and extension
      const ext = path.extname(file).toLowerCase();
      const baseNameWithExt = file.replace(/-preview\.(jpg|jpeg|png|webp)$/i, '');
      const isPreview = file.includes('-preview');
      
      // Get base name without extension
      const baseName = baseNameWithExt.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      
      if (!templatesMap.has(baseName)) {
        templatesMap.set(baseName, {});
      }
      
      const template = templatesMap.get(baseName)!;
      if (isPreview) {
        template.preview = file;
      } else {
        template.full = file;
        template.fullExt = ext; // Store extension for later use
      }
    }
    
    // Convert to template objects
    const templates: BackgroundTemplate[] = [];
    
    for (const [baseName, files] of templatesMap.entries()) {
      // Only include templates that have both full and preview images
      if (files.full && files.preview) {
        // Generate a readable name from the base name
        const name = baseName
          .split(/[-_]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        templates.push({
          id: baseName,
          name: name,
          previewUrl: `/backgrounds/${files.preview}`,
          imageUrl: `/backgrounds/${files.full}`,
          description: `${name} background template`,
        });
      }
    }
    
    // Sort by ID for consistent ordering
    const sortedTemplates = templates.sort((a, b) => a.id.localeCompare(b.id));
    
    // Add black background template option (code-based, no image)
    sortedTemplates.unshift({
      id: 'black',
      name: 'Solid Black',
      previewUrl: '/backgrounds/black-preview.jpg', // We'll create a simple black square
      imageUrl: '', // Empty = use CSS backgroundColor instead
      description: 'Pure black background (no image)',
    });
    
    return sortedTemplates;
  } catch (error) {
    console.error('Error reading background templates:', error);
    return [];
  }
}

/**
 * Get template by ID (for client-side use)
 */
export function getTemplateById(templates: BackgroundTemplate[], id: string): BackgroundTemplate | undefined {
  return templates.find(template => template.id === id);
}

/**
 * Get template image URL by ID (for client-side use)
 */
export function getTemplateImageUrl(templates: BackgroundTemplate[], templateId: string): string | undefined {
  const template = getTemplateById(templates, templateId);
  return template?.imageUrl;
}
