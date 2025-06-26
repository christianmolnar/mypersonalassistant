import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
    res.status(500).json({ error: 'Failed to create uploads directory' });
    return;
  }
  const form = new IncomingForm({
    uploadDir: uploadsDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
  });
  form.parse(req, (err: any, fields: any, files: any) => {
    console.log('Files received:', files);
    if (err) {
      console.error('Formidable error:', err);
      res.status(500).json({ error: 'Upload failed' });
      return;
    }
    let file = files.file as any;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    // Handle array or single file
    if (Array.isArray(file)) file = file[0];
    if (!file.filepath) {
      console.error('File object missing filepath:', file);
      res.status(500).json({ error: 'Filepath missing in uploaded file.' });
      return;
    }
    const url = `/uploads/${path.basename(file.filepath)}`;
    res.status(200).json({ url });
  });
}
