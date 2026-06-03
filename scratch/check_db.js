const pool = require('../src/database/connection');

(async () => {
  try {
    const [counts] = await pool.query(`
      SELECT c.category_name, COUNT(m.id) as item_count
      FROM menu_categories c
      LEFT JOIN menu_items m ON m.category_id = c.id
      GROUP BY c.id, c.category_name
    `);
    console.log('--- ITEMS PER CATEGORY ---');
    console.table(counts);

    const [totalItems] = await pool.query('SELECT COUNT(*) as count FROM menu_items');
    console.log('Total items in database:', totalItems[0].count);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
