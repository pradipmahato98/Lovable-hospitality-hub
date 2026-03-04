import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

/**
 * Validates and returns a safe absolute path within a bucket.
 * Prevents path traversal attacks and path prefix vulnerabilities.
 */
const getSafePath = (bucketName: string, filePath: string = '') => {
  // Validate bucket name (alphanumeric, underscore, hyphen only)
  if (!/^[a-zA-Z0-9_-]+$/.test(bucketName)) {
    throw new Error('Invalid bucket name');
  }

  const bucketPath = path.resolve(STORAGE_ROOT, bucketName);
  const fullPath = path.resolve(bucketPath, filePath);

  // Add trailing separator to prevent prefix vulnerabilities (e.g., 'data' vs 'data-private')
  const rootWithSep = STORAGE_ROOT.endsWith(path.sep) ? STORAGE_ROOT : STORAGE_ROOT + path.sep;
  const bucketWithSep = bucketPath.endsWith(path.sep) ? bucketPath : bucketPath + path.sep;

  // Ensure bucket path is within STORAGE_ROOT
  if (!bucketPath.startsWith(rootWithSep) && bucketPath !== STORAGE_ROOT) {
    throw new Error('Bucket path traversal detected');
  }

  // Ensure full path is within the bucket path
  if (!fullPath.startsWith(bucketWithSep) && fullPath !== bucketPath) {
    throw new Error('File path traversal detected');
  }

  return fullPath;
};

export const listBuckets = async () => {
  return fs.readdirSync(STORAGE_ROOT, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const bucketName = dirent.name;
      const bucketPath = getSafePath(bucketName);

      const stats = fs.statSync(bucketPath);
      const files = fs.readdirSync(bucketPath, { withFileTypes: true });

      // Calculate total size
      let totalSize = 0;
      files.forEach(fileDirent => {
        if (fileDirent.isFile()) {
           const filePath = path.join(bucketPath, fileDirent.name);
           totalSize += fs.statSync(filePath).size;
        }
      });

      return {
        name: bucketName,
        size: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
        files: files.length,
        public: true, // Simplified
        createdAt: stats.birthtime
      };
    });
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

  // Ensure the directory for the file exists
  const destDir = path.dirname(destination);
  if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
  }

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
