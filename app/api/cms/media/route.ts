import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUser, logAdminAction } from '@/lib/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Helper to ensure upload dir exists
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// GET /api/cms/media
// Lists all files in the upload directory
// Protected.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    ensureUploadDir();
    const files = fs.readdirSync(UPLOAD_DIR);
    
    const mediaFiles = files.map(file => {
      const filePath = path.join(UPLOAD_DIR, file);
      const stat = fs.statSync(filePath);
      return {
        name: file,
        url: `/uploads/${file}`,
        size: stat.size,
        createdAt: stat.birthtime
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ success: true, files: mediaFiles });
  } catch (error: any) {
    console.error('Error fetching media library:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/cms/media
// Uploads a file (with optional replacement of existing file to preserve URL).
// Protected.
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const replaceName = formData.get('replaceName') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    ensureUploadDir();

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // WebP replacement or generation
    let filename = replaceName || `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // Automatic WebP file extension if it's an image and not already WebP
    const isImage = file.type.startsWith('image/');
    if (isImage && !filename.toLowerCase().endsWith('.webp') && !replaceName) {
      const ext = path.extname(filename);
      filename = filename.slice(0, -ext.length) + '.webp';
    }

    const targetPath = path.join(UPLOAD_DIR, filename);

    // Dynamic compression engine attempt: if 'sharp' is installed we can convert to WebP,
    // otherwise write file directly. This is robust.
    try {
      const sharp = require('sharp');
      if (isImage) {
        await sharp(buffer)
          .webp({ quality: 80 })
          .toFile(targetPath);
      } else {
        fs.writeFileSync(targetPath, buffer);
      }
    } catch (e) {
      // Fallback: write direct buffer to file
      fs.writeFileSync(targetPath, buffer);
    }

    const url = `/uploads/${filename}`;
    await logAdminAction(user.id, user.email, 'UPLOAD_MEDIA', `File: ${filename} (${url})`, null, { url });

    return NextResponse.json({ 
      success: true, 
      url,
      file: {
        name: filename,
        url,
        size: fs.statSync(targetPath).size
      }
    });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/cms/media
// Removes a file from uploads.
// Protected.
export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ success: false, error: 'Missing filename parameter' }, { status: 400 });
    }

    const targetPath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    fs.unlinkSync(targetPath);

    await logAdminAction(user.id, user.email, 'DELETE_MEDIA', `File: ${filename}`, null, null);

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
