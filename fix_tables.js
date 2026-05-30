const pool = require('./src/database/connection');

pool.execute(`UPDATE restaurant_tables SET table_code = CONCAT(table_code, '_del_', id) WHERE deletedAt IS NOT NULL AND table_code NOT LIKE '%_del_%'`)
  .then(([r]) => console.log('Fixed tables:', r.affectedRows))
  .catch(console.error)
  .finally(() => process.exit(0));
