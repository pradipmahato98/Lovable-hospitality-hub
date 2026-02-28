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

router.get('/schema/:tableName/columns', async (req, res, next) => {
  try {
    const columns = await dbService.getTableColumns(req.params.tableName);
    res.json(columns);
  } catch (error) {
    next(error);
  }
});

router.get('/tables/:tableName', async (req, res, next) => {
  try {
    const { limit, single, filters } = req.query;
    const options = {
      limit: limit ? parseInt(limit as string) : 100,
      single: single === 'true',
      filters: filters ? JSON.parse(filters as string) : []
    };
    const data = await dbService.getTableData(req.params.tableName, options);
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

router.patch('/tables/:tableName', async (req, res, next) => {
  try {
    const { updates, filters } = req.body;
    const result = await dbService.updateTableData(req.params.tableName, updates, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/tables/:tableName', async (req, res, next) => {
  try {
    const result = await dbService.insertTableData(req.params.tableName, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/tables/:tableName', async (req, res, next) => {
  try {
    const { filters } = req.body;
    const result = await dbService.deleteTableData(req.params.tableName, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/rpc/:fnName', authenticate, async (req, res) => {
  try {
    // In a real app, you would map fnName to actual Postgres functions
    // For this replacement, we'll allow it if it's a known safe function
    const safeFunctions = ['post_daily_room_charges', 'calculate_occupancy'];
    if (!safeFunctions.includes(req.params.fnName)) {
      return res.status(403).json({ error: 'Function not allowed' });
    }

    // Pass parameters as an array for executeRawQuery if you choose to support them there
    // Or call a dedicated service method.
    const result = await dbService.executeRawQuery(`SELECT * FROM ${req.params.fnName}($1)`, [req.body]);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
