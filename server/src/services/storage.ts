import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

/**
 * Validates and resolves a safe path within the STORAGE_ROOT.
 * Prevents path traversal and ensures the path is within the intended bucket.
 */
const getSafePath = (bucketName: string, fileName?: string): string => {
  // Validate bucket name for security (only allow alphanumeric, underscore, and hyphen)
  if (!/^[a-zA-Z0-9_-]+$/.test(bucketName)) {
    throw new Error('Invalid bucket name');
  }

  // Resolve absolute path
  const fullPath = fileName
    ? path.resolve(STORAGE_ROOT, bucketName, fileName)
    : path.resolve(STORAGE_ROOT, bucketName);

  // Ensure the resolved path starts with STORAGE_ROOT followed by bucketName
  // This prevents traversing to sibling buckets via '../' in fileName
  const bucketPath = path.resolve(STORAGE_ROOT, bucketName);
  const bucketPathWithSep = bucketPath.endsWith(path.sep) ? bucketPath : bucketPath + path.sep;

  if (!fullPath.startsWith(bucketPathWithSep) && fullPath !== bucketPath) {
    throw new Error('Security Error: Path traversal detected');
  }

  return fullPath;
};

export const listBuckets = async () => {
  const buckets = fs.readdirSync(STORAGE_ROOT, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const bucketPath = getSafePath(dirent.name);
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

  // fileName here is passed from the route which might include subpaths
  // We should be careful about filePath too.
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
