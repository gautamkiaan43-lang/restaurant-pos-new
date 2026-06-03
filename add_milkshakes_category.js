const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding Milkshakes sub-category under Drinks...');

    // 1. Get Drinks parent ID
    const [drinkRows] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Drinks' AND deletedAt IS NULL LIMIT 1`
    );
    if (drinkRows.length === 0) {
      console.error('❌ Drinks parent category not found!');
      process.exit(1);
    }
    const drinksId = drinkRows[0].id;
    console.log(`✅ Found Drinks parent (ID: ${drinksId})`);

    // 2. Create Milkshakes sub-category
    const [existing] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Milkshakes' AND deletedAt IS NULL LIMIT 1`
    );

    let milkshakeId;
    if (existing.length > 0) {
      milkshakeId = existing[0].id;
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, milkshakeId]);
      console.log(`ℹ️  Milkshakes already exists (ID: ${milkshakeId}), parent_id updated.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Milkshakes', '🥤', 'milkshakes', '#FFF0F9', 3, ?)`,
        [drinksId]
      );
      milkshakeId = res.insertId;
      console.log(`✅ Created: Milkshakes (ID: ${milkshakeId}) under Drinks (ID: ${drinksId})`);
    }

    // 3. Shared addons
    const milkshakeAddons = [
      { name: 'ALMOND MILK',  price: 0.70 },
      { name: 'SOY MILK',     price: 0.70 },
      { name: 'OAT MILK',     price: 0.70 },
      { name: 'EXTRA SCOOP',  price: 1.50 },
      { name: 'TAKEAWAY',     price: 0.00 },
      { name: 'EAT IN',       price: 0.00 },
    ];

    const sizes = [{ name: 'Regular', price: 0.00 }];

    // 4. Items from image
    const items = [
      { item_name: 'Chocolate Milkshake',  image: '🍫', description: 'Thick, creamy milkshake blended with rich Dutch chocolate and premium vanilla ice cream.' },
      { item_name: 'Strawberry Milkshake', image: '🍓', description: 'Luscious milkshake made with fresh strawberries and smooth vanilla ice cream.' },
      { item_name: 'Vanilla Milkshake',    image: '🍦', description: 'Classic, velvety vanilla milkshake made with premium Madagascar vanilla bean ice cream.' },
      { item_name: 'Caramel Milkshake',    image: '🍮', description: 'Indulgent golden caramel milkshake blended with buttery caramel sauce and ice cream.' },
      { item_name: 'Hazelnut Milkshake',   image: '🌰', description: 'Smooth, nutty milkshake blended with hazelnut praline and creamy vanilla ice cream.' },
      { item_name: 'Blue Heaven Milkshake',image: '💙', description: 'House signature blue heaven milkshake — vanilla ice cream blended with blue raspberry and marshmallow.' },
    ];

    console.log('\n🌱 Inserting Milkshakes items...');
    for (const item of items) {
      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?)`,
        [item.item_name, milkshakeId, 9.30, item.image, item.description, slug,
         JSON.stringify(sizes), JSON.stringify(milkshakeAddons)]
      );
      console.log(`   ✅ Added: ${item.item_name} ($9.30)`);
    }

    console.log('\n🚀 Done! Milkshakes sub-category with 6 items added under Drinks.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
})();
