const path = require('path');
const fs = require('fs');

/**
 * Upload a file buffer.
 * - Production (BLOB_READ_WRITE_TOKEN set): uploads to Vercel Blob
 * - Local dev: saves to /uploads directory, returns relative URL
 */
async function uploadFile(buffer, filename, mimetype) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = require('@vercel/blob');
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: mimetype,
    });
    return blob.url;
  }

  // Local dev fallback
  const subdir = filename.includes('gallery') ? 'gallery' : 'references';
  const uploadDir = path.join(__dirname, '../../uploads', subdir);
  fs.mkdirSync(uploadDir, { recursive: true });
  const basename = path.basename(filename);
  fs.writeFileSync(path.join(uploadDir, basename), buffer);
  return `/uploads/${subdir}/${basename}`;
}

module.exports = { uploadFile };
