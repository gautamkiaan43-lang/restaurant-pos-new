const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding Tea sub-category under Drinks...');

    // 1. Get the Drinks parent category ID
    const [drinkRows] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Drinks' AND deletedAt IS NULL LIMIT 1`
    );
    if (drinkRows.length === 0) {
      console.error('❌ Drinks parent category not found! Run add_parent_category.js first.');
      process.exit(1);
    }
    const drinksId = drinkRows[0].id;
    console.log(`✅ Found Drinks parent (ID: ${drinksId})`);

    // 2. Create Tea sub-category under Drinks
    const [existingTea] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Tea' AND deletedAt IS NULL LIMIT 1`
    );

    let teaId;
    if (existingTea.length > 0) {
      teaId = existingTea[0].id;
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, teaId]);
      console.log(`ℹ️  Tea category already exists (ID: ${teaId}), parent_id updated to ${drinksId}.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Tea', '🍵', 'tea', '#F3FFF5', 2, ?)`,
        [drinksId]
      );
      teaId = res.insertId;
      console.log(`✅ Created sub-category: Tea (ID: ${teaId}) under Drinks (ID: ${drinksId})`);
    }

    // 3. Common tea addons
    const teaAddons = [
      { name: 'Add Honey',        price: 0.30 },
      { name: 'Add Lemon',        price: 0.00 },
      { name: 'Add Milk',         price: 0.00 },
      { name: 'Almond Milk',      price: 0.70 },
      { name: 'Oat Milk',         price: 0.70 },
      { name: 'TAKEAWAY',         price: 0.00 },
      { name: 'EAT IN',           price: 0.00 },
    ];

    const teaItems = [
      {
        item_name: 'Breakfast Tea',
        price: 6.20,
        image: '🍵',
        description: 'Classic robust English breakfast tea — full-bodied, malty and perfect with or without milk.',
      },
      {
        item_name: 'Jasmine Dragon Pearl Tea',
        price: 7.50,
        image: '🌸',
        description: 'Hand-rolled green tea pearls scented with fresh jasmine blossoms — delicate, floral and soothing.',
      },
      {
        item_name: 'Chamomile Tea',
        price: 6.20,
        image: '🌼',
        description: 'Gentle, caffeine-free chamomile flowers brew — naturally sweet, calming and perfect before bedtime.',
      },
      {
        item_name: 'Green Tea',
        price: 5.90,
        image: '🍃',
        description: 'Premium Japanese green tea — light, grassy and rich in antioxidants.',
      },
      {
        item_name: 'Lemon Grass Ginger',
        price: 5.90,
        image: '🌿',
        description: 'Zesty lemongrass and warming ginger herbal infusion — refreshing and invigorating.',
      },
      {
        item_name: 'Earl Grey',
        price: 5.90,
        image: '🫖',
        description: 'Timeless bergamot-scented black tea with a citrusy aroma — a true classic.',
      },
    ];

    console.log('\n🌱 Inserting Tea items...');
    for (const item of teaItems) {
      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?)`,
        [
          item.item_name,
          teaId,
          item.price,
          item.image,
          item.description,
          slug,
          JSON.stringify([{ name: 'Regular', price: 0.00 }]),
          JSON.stringify(teaAddons),
        ]
      );
      console.log(`   ✅ Added: ${item.item_name} ($${item.price})`);
    }

    console.log('\n🚀 Done! Tea sub-category with 6 items added under Drinks.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
