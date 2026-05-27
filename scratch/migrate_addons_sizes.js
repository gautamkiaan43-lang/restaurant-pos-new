const pool = require('../src/database/connection');

async function migrate() {
  try {
    await pool.execute("ALTER TABLE menu_items ADD COLUMN addons LONGTEXT NULL, ADD COLUMN sizes LONGTEXT NULL;");
    console.log("Columns 'addons' and 'sizes' added to 'menu_items' table.");
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("Columns 'addons' and 'sizes' already exist in 'menu_items'.");
    } else {
      console.error("Migration for menu_items failed:", err);
      process.exit(1);
    }
  }

  try {
    await pool.execute("ALTER TABLE order_items ADD COLUMN addons LONGTEXT NULL;");
    console.log("Column 'addons' added to 'order_items' table.");
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("Column 'addons' already exists in 'order_items'.");
      process.exit(0);
    } else {
      console.error("Migration for order_items failed:", err);
      process.exit(1);
    }
  }
}

migrate();
