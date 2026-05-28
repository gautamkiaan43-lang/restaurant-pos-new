const pool = require('../src/database/connection');

(async () => {
  try {
    const [items] = await pool.query('SELECT id, item_name, price, sizes FROM menu_items LIMIT 10');
    console.log('--- MENU ITEMS ---');
    console.table(items);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
