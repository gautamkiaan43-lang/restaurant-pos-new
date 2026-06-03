const BaseModel = require('../../database/BaseModel');
const pool = require('../../database/connection');

class HouseAccountsModel extends BaseModel {
  constructor() {
    super('house_accounts');
  }

  async findWithOutstandingBalance() {
    const sql = `
      SELECT ha.*, 
             CAST(COALESCE(SUM(hat.amount), 0.00) AS DECIMAL(10,2)) AS outstanding_balance,
             CAST(ABS(COALESCE(SUM(CASE WHEN hat.transaction_type = 'PAYMENT' THEN hat.amount ELSE 0 END), 0.00)) AS DECIMAL(10,2)) AS total_payments
      FROM house_accounts ha
      LEFT JOIN house_account_transactions hat ON ha.id = hat.house_account_id
      WHERE ha.deletedAt IS NULL
      GROUP BY ha.id
    `;
    const [rows] = await pool.execute(sql);
    return rows;
  }

  async getStatement(accountId) {
    const sql = `
      SELECT hat.*, o.order_number, o.grand_total, o.createdAt as orderDate,
             (
               SELECT GROUP_CONCAT(CONCAT(oi.quantity, 'x ', mi.item_name) SEPARATOR ', ')
               FROM order_items oi
               JOIN menu_items mi ON oi.menu_item_id = mi.id
               WHERE oi.order_id = hat.order_id AND oi.deletedAt IS NULL
             ) AS order_items_summary
      FROM house_account_transactions hat
      LEFT JOIN orders o ON hat.order_id = o.id
      WHERE hat.house_account_id = ?
      ORDER BY hat.createdAt DESC
    `;
    const [rows] = await pool.execute(sql, [accountId]);
    return rows;
  }

  async createTransaction(data) {
    const keys = Object.keys(data);
    const values = Object.values(data).map(v => v === undefined ? null : v);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO house_account_transactions (${keys.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.execute(sql, values);
    return result.insertId;
  }

  async softDelete(id) {
    const sql = `UPDATE house_accounts SET deletedAt = NOW() WHERE id = ?`;
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows;
  }
}

module.exports = new HouseAccountsModel();
