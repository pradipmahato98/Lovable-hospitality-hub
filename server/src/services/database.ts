import { query } from './db';

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
  return result.rows[0];
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
  return result.rows;
};
