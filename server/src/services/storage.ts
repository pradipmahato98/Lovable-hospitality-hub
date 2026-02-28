import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'storage');

// Ensure storage root exists
if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT);
}

// 🛡️ Sentinel: Ensure core buckets exist on startup to prevent "Bucket not found" errors
const CORE_BUCKETS = ['avatars', 'property-images', 'lost-found-images'];
CORE_BUCKETS.forEach(bucket => {
  const bucketPath = path.join(STORAGE_ROOT, bucket);
  if (!fs.existsSync(bucketPath)) {
    console.log(`🛡️ Sentinel: Creating core bucket: ${bucket}`);
    fs.mkdirSync(bucketPath);
  }
});

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
  const bucketPath = path.join(STORAGE_ROOT, name);
  if (!fs.existsSync(bucketPath)) {
    fs.mkdirSync(bucketPath);
  }
  return { name, public: true };
};
