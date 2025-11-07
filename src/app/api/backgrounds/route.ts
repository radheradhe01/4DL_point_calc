import { NextResponse } from 'next/server';
import { getBackgroundTemplates } from '@/lib/backgroundTemplates';

/**
 * API route to fetch background templates dynamically
 */
export async function GET() {
  try {
    const templates = await getBackgroundTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

