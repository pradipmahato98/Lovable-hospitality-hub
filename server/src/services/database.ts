import { query } from './db';

export const getTables = async () => {
  const result = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  return result.rows;
};

export const getTableData = async (tableName: string, limit = 100) => {
  // Simple injection prevention: check if tableName is in the list of public tables
  const tables = await getTables();
  if (!tables.some(t => t.table_name === tableName)) {
    throw new Error('Invalid table name');
  }

  const result = await query(`SELECT * FROM "${tableName}" LIMIT $1`, [limit]);
  return result.rows;
};

export const executeRawQuery = async (sql: string) => {
  // Be VERY careful with this in production
  const result = await query(sql);
  return result.rows;
};
