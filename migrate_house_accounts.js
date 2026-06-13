const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  });

  try {
    console.log("Connected to DB.");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS house_accounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          account_name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255),
          phone VARCHAR(50),
          email VARCHAR(100),
          credit_limit DECIMAL(10, 2) DEFAULT 50000.00,
          status VARCHAR(50) DEFAULT 'active',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deletedAt TIMESTAMP NULL
      )
    `);
    console.log("house_accounts verified");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS house_account_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          house_account_id INT NOT NULL,
          order_id INT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          payment_method VARCHAR(50) NULL,
          notes TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (house_account_id) REFERENCES house_accounts(id),
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
      )
    `);
    console.log("house_account_transactions verified");

    console.log("SUCCESS");
  } catch(e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}

run();
