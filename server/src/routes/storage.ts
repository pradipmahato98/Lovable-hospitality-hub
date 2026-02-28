import { Router } from 'express';
import * as storageService from '../services/storage';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/buckets', async (req, res, next) => {
  try {
    const buckets = await storageService.listBuckets();
    res.json(buckets);
  } catch (error) {
    next(error);
  }
});

router.post('/buckets', async (req, res, next) => {
  try {
    const bucket = await storageService.createBucket(req.body.name);
    res.json(bucket);
  } catch (error) {
    next(error);
  }
});

router.post('/buckets/:bucketName/upload', upload.single('file'), async (req, res, next) => {
  try {
    const { bucketName } = req.params;
    const { path: filePath } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await storageService.uploadFile(bucketName, filePath, file);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/buckets/:bucketName/files/:fileName', async (req, res, next) => {
  try {
    const { bucketName, fileName } = req.params;
    const filePath = await storageService.getFilePath(bucketName, fileName);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

export default router;
