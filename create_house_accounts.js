const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('Creating house_accounts table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS house_accounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          account_name VARCHAR(255) NOT NULL UNIQUE,
          contact_person VARCHAR(255),
          phone VARCHAR(50),
          email VARCHAR(100),
          credit_limit DECIMAL(10, 2) DEFAULT 50000.00,
          status ENUM('active', 'suspended') DEFAULT 'active',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deletedAt TIMESTAMP NULL
      )
    `);

    console.log('Creating house_account_transactions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS house_account_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          house_account_id INT NOT NULL,
          order_id INT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          transaction_type ENUM('CHARGE', 'PAYMENT') NOT NULL,
          payment_method VARCHAR(50) NULL,
          notes TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (house_account_id) REFERENCES house_accounts(id),
          FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);

    // Seed sample accounts
    const [existing] = await pool.query("SELECT id FROM house_accounts WHERE account_name = 'Alpha Pharma Medical Group'");
    if (existing.length === 0) {
      console.log('Seeding sample house accounts...');
      await pool.query(`
        INSERT INTO house_accounts (account_name, contact_person, phone, email, credit_limit)
        VALUES 
        ('Alpha Pharma Medical Group', 'Rajesh Sharma', '+91 98765 43210', 'rajesh@alphapharma.com', 75000.00),
        ('Regular Staff Tab', 'Amit Kumar', '+91 87654 32109', 'amit@restaurant.com', 20000.00)
      `);
      console.log('Sample house accounts seeded.');
    }

    console.log('Database tables setup complete.');
  } catch (err) {
    console.error('Error during house accounts DB setup:', err);
  } finally {
    process.exit(0);
  }
})();
