import { query } from './db';

export const validateIdentifier = (id: string) => {
  if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid identifier: ${id}`);
  }
};

export const getTables = async () => {
  const result = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  return result.rows;
};

export const getTableColumns = async (tableName: string) => {
  validateIdentifier(tableName);
  const result = await query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = $1 AND table_schema = 'public'
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows;
};

export const getTableData = async (tableName: string, limit = 100) => {
  validateIdentifier(tableName);
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
  validateIdentifier(tableName);

  // Validate column names against schema
  const columns = await getTableColumns(tableName);
  const allowedColumns = columns.map((c: any) => c.column_name);

  // Validate column names in updates
  Object.keys(updates).forEach(key => {
    validateIdentifier(key);
    if (!allowedColumns.includes(key)) {
      throw new Error(`Invalid column: ${key} for table ${tableName}`);
    }
  });

  // Validate column names in filters
  if (filters) {
    filters.forEach(f => {
      validateIdentifier(f.column);
      if (!allowedColumns.includes(f.column)) {
        throw new Error(`Invalid column: ${f.column} for table ${tableName}`);
      }
    });
  }

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
  validateIdentifier(tableName);

  // Validate column names against schema
  const columns = await getTableColumns(tableName);
  const allowedColumns = columns.map((c: any) => c.column_name);

  // Validate column names in filters
  if (filters) {
    filters.forEach(f => {
      validateIdentifier(f.column);
      if (!allowedColumns.includes(f.column)) {
        throw new Error(`Invalid column: ${f.column} for table ${tableName}`);
      }
    });
  }

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
