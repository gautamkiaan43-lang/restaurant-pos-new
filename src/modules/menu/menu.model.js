const BaseModel = require('../../database/BaseModel');
const pool = require('../../database/connection');

class MenuModel extends BaseModel {
  constructor() {
    super('menu_items');
  }

  async findWithCategory(filters = {}) {
    let sql = `
      SELECT m.*, m.availability as available, m.availability as status, c.category_name 
      FROM menu_items m 
      LEFT JOIN menu_categories c ON m.category_id = c.id 
      WHERE m.deletedAt IS NULL
    `;
    const params = [];

    if (filters.category) {
      sql += ` AND c.category_name = ?`;
      params.push(filters.category);
    }

    if (filters.search) {
      sql += ` AND (m.item_name LIKE ? OR m.description LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.popular) {
      sql += ` AND m.popular = TRUE`;
    }

    const [rows] = await pool.execute(sql, params);
    return rows;
  }

  async create(data) {
    const { name, item_name, category, category_id, price, image, description, available } = data;
    
    // 1. Resolve Category ID
    let categoryId = category_id || null;
    
    if (!categoryId && category) {
      // Clean up category name (remove "All Items" if it was sent by mistake)
      const cleanCategory = category === 'All Items' ? 'General' : category;
      
      const [catRows] = await pool.execute(
        'SELECT id FROM menu_categories WHERE category_name = ? AND deletedAt IS NULL',
        [cleanCategory]
      );
      
      if (catRows.length > 0) {
        categoryId = catRows[0].id;
      } else {
        // Create new category if it doesn't exist
        const [result] = await pool.execute(
          'INSERT INTO menu_categories (category_name, icon) VALUES (?, ?)',
          [cleanCategory, '🍽️']
        );
        categoryId = result.insertId;
      }
    }

    // 2. Resolve availability — DB column is varchar(20)
    const validStatuses = ['In Stock', 'Out of Stock', 'Low Stock'];
    const availabilityStr = validStatuses.includes(available) ? available : 'In Stock';

    // 3. Serialize addons/sizes
    const addonsStr = data.addons ? (typeof data.addons === 'string' ? data.addons : JSON.stringify(data.addons)) : null;
    const sizesStr = data.sizes ? (typeof data.sizes === 'string' ? data.sizes : JSON.stringify(data.sizes)) : null;

    const sql = `
      INSERT INTO menu_items (item_name, category_id, price, image, description, availability, rating, popular, addons, sizes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      item_name || name || 'New Item',
      categoryId,
      price || 0,
      image || '🍽️',
      description || '',
      availabilityStr,
      data.rating || 0,
      data.popular ? 1 : 0,
      addonsStr,
      sizesStr
    ];

    const [insertResult] = await pool.execute(sql, params);
    return insertResult.insertId;
  }

  async update(id, data) {
    const { name, item_name, category, category_id, price, image, description, available, addons, sizes } = data;
    
    const updateData = {};
    
    // Map fields if they exist
    if (name || item_name) updateData.item_name = name || item_name;
    if (price !== undefined) updateData.price = price;
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) updateData.description = description;
    if (available !== undefined) {
      const validStatuses = ['In Stock', 'Out of Stock', 'Low Stock'];
      updateData.availability = validStatuses.includes(available) ? available : 'In Stock';
    }
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.popular !== undefined) updateData.popular = data.popular ? 1 : 0;

    if (addons !== undefined) {
      updateData.addons = addons ? (typeof addons === 'string' ? addons : JSON.stringify(addons)) : null;
    }
    if (sizes !== undefined) {
      updateData.sizes = sizes ? (typeof sizes === 'string' ? sizes : JSON.stringify(sizes)) : null;
    }

    // Resolve Category if name is provided
    if (category && !category_id) {
      const cleanCategory = category === 'All Items' ? 'General' : category;
      const [catRows] = await pool.execute(
        'SELECT id FROM menu_categories WHERE category_name = ? AND deletedAt IS NULL',
        [cleanCategory]
      );
      
      if (catRows.length > 0) {
        updateData.category_id = catRows[0].id;
      } else {
        const [result] = await pool.execute(
          'INSERT INTO menu_categories (category_name, icon) VALUES (?, ?)',
          [cleanCategory, '🍽️']
        );
        updateData.category_id = result.insertId;
      }
    } else if (category_id) {
      updateData.category_id = category_id;
    }

    if (Object.keys(updateData).length === 0) return 0;

    const keys = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const sql = `UPDATE menu_items SET ${setClause} WHERE id = ?`;
    const [result] = await pool.execute(sql, [...values, id]);
    return result.affectedRows;
  }

  async getCategories() {
    const [rows] = await pool.execute('SELECT * FROM menu_categories WHERE deletedAt IS NULL ORDER BY sortOrder ASC, id ASC');
    return rows;
  }

  async createCategory(data) {
    const { name, category_name, icon } = data;
    const finalName = category_name || name;
    const sql = 'INSERT INTO menu_categories (category_name, icon) VALUES (?, ?)';
    const [result] = await pool.execute(sql, [finalName, icon || '🍽️']);
    return result.insertId;
  }

  async updateCategory(id, data) {
    const { name, category_name, icon } = data;
    const finalName = category_name || name;
    
    const updateFields = [];
    const params = [];
    
    if (finalName !== undefined) {
      updateFields.push('category_name = ?');
      params.push(finalName);
    }
    
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      params.push(icon);
    }
    
    if (updateFields.length === 0) return 0;
    
    params.push(id);
    const sql = `UPDATE menu_categories SET ${updateFields.join(', ')} WHERE id = ?`;
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  }

  async deleteCategory(id) {
    const sql = 'UPDATE menu_categories SET deletedAt = CURRENT_TIMESTAMP WHERE id = ?';
    const [result] = await pool.execute(sql, [id]);
    return result.affectedRows;
  }
}

module.exports = new MenuModel();
