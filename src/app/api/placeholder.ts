import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  // Create a simple placeholder SVG
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f8f9fa" />
      <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#6c757d" text-anchor="middle" dominant-baseline="middle">
        No Image Available
      </text>
    </svg>
  `;

  // Save the SVG to public folder
  try {
    const placeholderPath = path.join(process.cwd(), 'public', 'images', 'placeholder.png');
    
    // Only write the file if it doesn't exist yet
    if (!fs.existsSync(placeholderPath)) {
      // For simplicity we're saving the SVG with a .png extension
      // In a real app you'd want to convert SVG to PNG
      fs.writeFileSync(placeholderPath, svg);
    }
    
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  } catch (error) {
    console.error('Error creating placeholder:', error);
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }
} 