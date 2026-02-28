import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

/**
 * 🛡️ Sentinel: Helper to validate that a path is within the STORAGE_ROOT
 * to prevent path traversal attacks.
 */
const validatePath = (targetPath: string) => {
  const resolvedPath = path.resolve(targetPath);
  const relative = path.relative(STORAGE_ROOT, resolvedPath);
  const isOutside = relative.startsWith('..') || path.isAbsolute(relative);

  if (isOutside) {
    throw new Error('🛡️ Sentinel: Security Exception - Invalid path traversal detected');
  }
  return resolvedPath;
};

/**
 * 🛡️ Sentinel: Helper to validate bucket names to prevent directory traversal
 * via bucket names.
 */
const validateBucketName = (name: string) => {
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name === '.' || name === '..') {
    throw new Error('🛡️ Sentinel: Security Exception - Invalid bucket name');
  }
  return name;
};

export const listBuckets = async () => {
  const buckets = fs.readdirSync(STORAGE_ROOT, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const bucketPath = path.join(STORAGE_ROOT, dirent.name);
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
  validateBucketName(name);
  const bucketPath = validatePath(path.join(STORAGE_ROOT, name));

  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }
  return { name, public: true };
};

export const uploadFile = async (bucketName: string, filePath: string, file: Express.Multer.File) => {
  validateBucketName(bucketName);
  const bucketPath = validatePath(path.join(STORAGE_ROOT, bucketName));

  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }

  const destination = validatePath(path.join(bucketPath, filePath));

  // Ensure the destination directory exists if filePath contains subdirectories
  const destDir = path.dirname(destination);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(file.path, destination);
  fs.unlinkSync(file.path);

  return { path: filePath, bucket: bucketName };
};

export const getFilePath = async (bucketName: string, fileName: string) => {
  validateBucketName(bucketName);
  const filePath = validatePath(path.join(STORAGE_ROOT, bucketName, fileName));

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
  return filePath;
};
