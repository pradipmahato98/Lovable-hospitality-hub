import * as dbService from './services/database';

async function testSecurity() {
  console.log('--- Starting Security Verification ---');

  const maliciousInputs = [
    'users; DROP TABLE users; --',
    'users"',
    'users\'',
    'table name',
    'table-name; SELECT * FROM users',
    'id=1',
  ];

  for (const input of maliciousInputs) {
    try {
      console.log(`Testing table name: "${input}"`);
      await dbService.getTableColumns(input);
      console.error(`❌ FAILED: getTableColumns accepted malicious input: ${input}`);
      process.exit(1);
    } catch (error: any) {
      console.log(`✅ Passed: getTableColumns rejected input with error: ${error.message || error}`);
    }

    try {
      console.log(`Testing updateTableData with malicious table: "${input}"`);
      await dbService.updateTableData(input, { name: 'test' }, []);
      console.error(`❌ FAILED: updateTableData accepted malicious table: ${input}`);
      process.exit(1);
    } catch (error: any) {
      console.log(`✅ Passed: updateTableData rejected table with error: ${error.message || error}`);
    }
  }

  // Test malicious column name
  try {
    console.log('Testing updateTableData with malicious column name');
    await dbService.updateTableData('users', { 'name"; DROP TABLE users; --': 'test' }, []);
    console.error('❌ FAILED: updateTableData accepted malicious column name');
    process.exit(1);
  } catch (error: any) {
    console.log(`✅ Passed: updateTableData rejected malicious column with error: "${error.message || error}"`);
  }

  // Test non-existent but "safe" looking column name (Schema check)
  try {
    console.log('Testing schema validation for table: users');
    await dbService.updateTableData('users', { non_existent_column_123: 'test' }, []);
    console.error(`❌ FAILED: updateTableData accepted non-existent column for table users`);
    process.exit(1);
  } catch (error: any) {
    console.log(`✅ Passed: updateTableData rejected non-existent column with error: "${error.message || error}"`);
  }

  console.log('--- Security Verification Successful ---');
  process.exit(0);
}

testSecurity().catch(err => {
  console.error('Unexpected error during security test:', err);
  process.exit(1);
});
