import { query } from './db';
import { broadcastChange } from './realtime';

export const getTables = async () => {
  const result = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  return result.rows;
};

export const getTableColumns = async (tableName: string) => {
  const result = await query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = $1 AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows;
};

export const getTableData = async (tableName: string, options: any = {}) => {
  const { limit = 100, single = false, filters = [] } = options;

  // Simple injection prevention: check if tableName is in the list of public tables
  const tables = await getTables();
  if (!tables.some(t => t.table_name === tableName)) {
    throw new Error('Invalid table name');
  }

  let whereClause = '';
  const values: any[] = [];

  if (filters && filters.length > 0) {
    whereClause = 'WHERE ' + filters.map((f: any, i: number) => `"${f.column}" = $${i + 1}`).join(' AND ');
    values.push(...filters.map((f: any) => f.value));
  }

  const sql = `SELECT * FROM "${tableName}" ${whereClause} LIMIT $${values.length + 1}`;
  const result = await query(sql, [...values, limit]);

  if (single) return result.rows[0];
  return result.rows;
};

export const executeRawQuery = async (sql: string, params: any[] = []) => {
  // Be VERY careful with this in production
  const result = await query(sql, params);
  return result.rows;
};

export const insertTableData = async (tableName: string, item: any) => {
  const columns = Object.keys(item).map(k => `"${k}"`).join(', ');
  const placeholders = Object.keys(item).map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *`;
  const result = await query(sql, Object.values(item));

  const insertedData = result.rows[0];
  broadcastChange(tableName, 'INSERT', insertedData);

  return insertedData;
};

export const updateTableData = async (tableName: string, updates: any, filters: any[]) => {
  const setClause = Object.keys(updates)
    .map((key, i) => `"${key}" = $${i + 1}`)
    .join(', ');
  const values = Object.values(updates);

  let whereClause = '';
  if (filters && filters.length > 0) {
    whereClause = 'WHERE ' + filters.map((f, i) => `"${f.column}" = $${values.length + i + 1}`).join(' AND ');
    values.push(...filters.map(f => f.value));
  }

  const sql = `UPDATE "${tableName}" SET ${setClause} ${whereClause} RETURNING *`;
  const result = await query(sql, values);
  const updatedData = result.rows[0];

  if (updatedData) {
    broadcastChange(tableName, 'UPDATE', updatedData);
  }

  return updatedData;
};

export const deleteTableData = async (tableName: string, filters: any[]) => {
  let whereClause = '';
  const values: any[] = [];
  if (filters && filters.length > 0) {
    whereClause = 'WHERE ' + filters.map((f, i) => `"${f.column}" = $${i + 1}`).join(' AND ');
    values.push(...filters.map(f => f.value));
  }

  const sql = `DELETE FROM "${tableName}" ${whereClause} RETURNING *`;
  const result = await query(sql, values);
  const deletedData = result.rows[0];

  if (deletedData) {
    broadcastChange(tableName, 'DELETE', deletedData);
  }

  return result.rows;
};
