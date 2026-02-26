import { Router } from 'express';
import * as dbService from '../services/database';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = Router();

// Apply auth to all database routes
router.use(authenticate);
router.use(authorizeAdmin);

router.get('/tables', async (req, res, next) => {
  try {
    const tables = await dbService.getTables();
    res.json(tables);
  } catch (error) {
    next(error);
  }
});

router.get('/tables/:tableName', async (req, res, next) => {
  try {
    const data = await dbService.getTableData(req.params.tableName);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/query', async (req, res, next) => {
  try {
    const results = await dbService.executeRawQuery(req.body.sql);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
