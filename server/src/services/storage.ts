import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

/**
 * Validates bucket name to prevent path traversal and ensure it follows a safe format.
 */
const validateBucketName = (name: string) => {
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    throw new Error('Invalid bucket name');
  }
};

/**
 * Safely resolves a path and ensures it is within the BUCKET'S directory,
 * which must be under STORAGE_ROOT.
 */
const getSafePath = (bucketName: string, ...subPaths: string[]) => {
  validateBucketName(bucketName);
  const bucketPath = path.resolve(STORAGE_ROOT, bucketName);

  // Double check that bucketPath is still within STORAGE_ROOT
  const relativeToRoot = path.relative(STORAGE_ROOT, bucketPath);
  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    throw new Error('Path traversal attempt detected');
  }

  const resolvedPath = path.resolve(bucketPath, ...subPaths);
  const relativeToBucket = path.relative(bucketPath, resolvedPath);

  if (relativeToBucket.startsWith('..') || path.isAbsolute(relativeToBucket)) {
    throw new Error('Path traversal attempt detected');
  }

  return resolvedPath;
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
  const bucketPath = getSafePath(name);
  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }
  return { name, public: true };
};

export const uploadFile = async (bucketName: string, filePath: string, file: Express.Multer.File) => {
  const bucketPath = getSafePath(bucketName);
  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }

  const destination = getSafePath(bucketName, filePath);
  fs.copyFileSync(file.path, destination);
  fs.unlinkSync(file.path);

  return { path: filePath, bucket: bucketName };
};

export const getFilePath = async (bucketName: string, fileName: string) => {
  const filePath = getSafePath(bucketName, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
  return filePath;
};
