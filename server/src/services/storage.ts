import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT);
}

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
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid bucket name');
  }

  // Prevent path traversal and enforce naming conventions
  // Only allow alphanumeric characters, dots, underscores, and hyphens
  // We also explicitly forbid '.' and '..'
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name === '.' || name === '..') {
    throw new Error('Invalid bucket name: only alphanumeric, dots, underscores, and hyphens are allowed');
  }

  const bucketPath = path.join(STORAGE_ROOT, name);
  const resolvedPath = path.resolve(bucketPath);
  const resolvedRoot = path.resolve(STORAGE_ROOT);

  // Use path.relative to ensure the path is inside the storage root
  const relative = path.relative(resolvedRoot, resolvedPath);
  const isOutside = relative.startsWith('..') || path.isAbsolute(relative);

  if (isOutside || resolvedPath === resolvedRoot) {
    throw new Error('Security Error: Path traversal detected');
  }

  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }
  return { name, public: true };
};
