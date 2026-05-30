const mysql = require('mysql2/promise');

async function fixLiveDatabase() {
  console.log("Connecting to Live Railway Database...");
  
  // Hardcoded Railway connection details so it doesn't disturb your local .env
  const livePool = mysql.createPool({
    host: 'yamabiko.proxy.rlwy.net',
    user: 'root',
    password: 'tmOugXQQCXhTFCTsLwCDtysrGFvdgPde',
    database: 'railway',
    port: 15098,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
  });

  try {
    // Ye SQL command pehle se delete ki gayi tables ke aage '_del_' laga dega
    // taaki purane naam free ho jayein aur 'Duplicate entry' ka error na aaye.
    const sql = `UPDATE restaurant_tables SET table_code = CONCAT(table_code, '_del_', id) WHERE deletedAt IS NOT NULL AND table_code NOT LIKE '%_del_%'`;
    
    console.log("Running the cleanup script on Live DB...");
    const [result] = await livePool.execute(sql);
    
    console.log("✅ Perfect! Live Database fixed safely.");
    console.log(`Total old deleted tables cleaned up: ${result.affectedRows}`);
    
  } catch (error) {
    console.error("❌ Error running script on Live DB:", error.message);
  } finally {
    // Database connection band karna
    await livePool.end();
    console.log("Connection closed.");
  }
}

fixLiveDatabase();
