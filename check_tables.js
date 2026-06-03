const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔍 Inspecting zones in table_zones...');
    const [zones] = await pool.query('SELECT * FROM table_zones');
    console.table(zones);

    console.log('\n🔍 Inspecting tables in restaurant_tables...');
    const [tables] = await pool.query(`
      SELECT t.id, t.table_code, t.capacity, t.status, z.zone_name 
      FROM restaurant_tables t
      JOIN table_zones z ON t.zone_id = z.id
      WHERE t.deletedAt IS NULL
    `);
    console.table(tables);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
