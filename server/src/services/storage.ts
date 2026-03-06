import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT);
}

/**
 * 🛡️ Sentinel: Helper to prevent path traversal and validate bucket names.
 * Ensures the resolved path is within the designated bucket directory.
 */
const getSafePath = (bucketName: string, subPath: string = '') => {
  // Validate bucket name: alphanumeric, underscores, hyphens only
  if (!/^[a-zA-Z0-9_-]+$/.test(bucketName)) {
    throw new Error('Invalid bucket name');
  }

  const bucketPath = path.resolve(STORAGE_ROOT, bucketName);
  const finalPath = path.resolve(bucketPath, subPath);

  // Security Check: Ensure finalPath is still inside bucketPath
  // Using path.sep to prevent prefix bypass (e.g., /bucket vs /bucket_secret)
  if (finalPath !== bucketPath && !finalPath.startsWith(bucketPath + path.sep)) {
    throw new Error('Path traversal attempt detected');
  }

  return { bucketPath, finalPath };
};

export const listBuckets = async () => {
  const buckets = fs.readdirSync(STORAGE_ROOT, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const { bucketPath } = getSafePath(dirent.name);
      const stats = fs.statSync(bucketPath);
      const files = fs.readdirSync(bucketPath);

      // Calculate total size
      let totalSize = 0;
      files.forEach(file => {
        totalSize += fs.statSync(path.join(bucketPath, file)).size;
      });

      return {
        name: dirent.name,
        size: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
        files: files.length,
        public: true, // Simplified
        createdAt: stats.birthtime
      };
    });
  return buckets;
};

export const createBucket = async (name: string) => {
  const { bucketPath } = getSafePath(name);
  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }
  return { name, public: true };
};

export const uploadFile = async (bucketName: string, filePath: string, file: Express.Multer.File) => {
  const { bucketPath, finalPath } = getSafePath(bucketName, filePath);

  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }

  // Ensure parent directories for the file exist
  const parentDir = path.dirname(finalPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.copyFileSync(file.path, finalPath);
  fs.unlinkSync(file.path);

  return { path: filePath, bucket: bucketName };
};

export const getFilePath = async (bucketName: string, fileName: string) => {
  const { finalPath } = getSafePath(bucketName, fileName);
  if (!fs.existsSync(finalPath)) {
    throw new Error('File not found');
  }
  return finalPath;
};
