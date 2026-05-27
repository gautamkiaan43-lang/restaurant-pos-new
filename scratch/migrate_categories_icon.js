const pool = require('../src/database/connection');

async function migrate() {
  try {
    await pool.execute("ALTER TABLE menu_categories MODIFY COLUMN icon LONGTEXT;");
    console.log("Column 'icon' in 'menu_categories' successfully modified to LONGTEXT.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
