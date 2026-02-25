import { Router } from 'express';
import * as storageService from '../services/storage';
import { authenticate, authorizeAdmin } from '../middleware/auth';

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

export default router;
