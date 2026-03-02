import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT);
}

/**
 * Validates that a path is safe and within the STORAGE_ROOT.
 * Prevents directory traversal attacks.
 */
const getSafePath = (bucketName: string, ...parts: string[]): string => {
  // 1. Validate bucket name format (alphanumeric, dashes, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(bucketName)) {
    throw new Error('Invalid bucket name');
  }

  // 2. Resolve the full path
  const resolvedPath = path.resolve(STORAGE_ROOT, bucketName, ...parts);

  // 3. Resolve bucket path and ensure it's within STORAGE_ROOT
  const bucketPath = path.resolve(STORAGE_ROOT, bucketName);
  if (!bucketPath.startsWith(STORAGE_ROOT + path.sep) && bucketPath !== STORAGE_ROOT) {
    throw new Error('Access denied: Bucket is outside of storage root');
  }

  // 4. Ensure the resolved path is still within the specific bucket
  // Use path.relative to check if the path is truly inside the bucket directory
  const relative = path.relative(bucketPath, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Access denied: Path is outside of the specified bucket');
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
  // Use getSafePath to validate the bucket name and resolve the path
  const bucketPath = getSafePath(name);

  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }
  return { name, public: true };
};

export const uploadFile = async (bucketName: string, filePath: string, file: Express.Multer.File) => {
  // Use getSafePath to validate the bucket and the target file path
  const destination = getSafePath(bucketName, filePath);

  // Ensure the bucket directory exists
  const bucketPath = getSafePath(bucketName);
  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath, { recursive: true });
  }

  // Ensure target directory exists if filePath includes subdirectories
  const targetDir = path.dirname(destination);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(file.path, destination);
  fs.unlinkSync(file.path);

  return { path: filePath, bucket: bucketName };
};

export const getFilePath = async (bucketName: string, fileName: string) => {
  // Use getSafePath to validate access to the specific file
  const filePath = getSafePath(bucketName, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
  return filePath;
};
