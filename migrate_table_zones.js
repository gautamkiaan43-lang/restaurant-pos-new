const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Starting table zones database migration...');

    // 1. Rename "Rooftop" zone (ID 2) to "Outdoor VIP"
    await pool.query(
      `UPDATE table_zones SET zone_name = 'Outdoor VIP', updatedAt = CURRENT_TIMESTAMP WHERE id = 2`
    );
    console.log('✅ Renamed "Rooftop" zone to "Outdoor VIP" in the database.');

    // 2. Soft-delete "Ground Floor" zone (ID 1)
    await pool.query(
      `UPDATE table_zones SET deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = 1`
    );
    console.log('✅ Soft-deleted "Ground Floor" zone in the database.');

    // 3. Soft-delete all tables currently in "Ground Floor" zone (zone_id = 1)
    await pool.query(
      `UPDATE restaurant_tables SET deletedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE zone_id = 1`
    );
    console.log('✅ Soft-deleted all tables associated with "Ground Floor".');

    // 4. Ensure "Indoor VIP" zone exists in database
    const [existingIndoor] = await pool.query(
      `SELECT id FROM table_zones WHERE zone_name = 'Indoor VIP' AND deletedAt IS NULL LIMIT 1`
    );

    if (existingIndoor.length === 0) {
      const [res] = await pool.query(
        `INSERT INTO table_zones (zone_name) VALUES ('Indoor VIP')`
      );
      console.log(`✅ Created "Indoor VIP" zone with ID: ${res.insertId} in the database.`);
    } else {
      console.log(`ℹ️  "Indoor VIP" zone already exists (ID: ${existingIndoor[0].id}).`);
    }

    console.log('\n🚀 Database migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
