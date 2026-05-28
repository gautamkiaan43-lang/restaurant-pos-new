const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding Fresh Juice sub-category under Drinks...');

    // 1. Get the Drinks parent category ID
    const [drinkRows] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Drinks' AND deletedAt IS NULL LIMIT 1`
    );
    if (drinkRows.length === 0) {
      console.error('❌ Drinks parent category not found!');
      process.exit(1);
    }
    const drinksId = drinkRows[0].id;
    console.log(`✅ Found Drinks parent (ID: ${drinksId})`);

    // 2. Create Fresh Juice sub-category under Drinks
    const [existingJuice] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Fresh Juice' AND deletedAt IS NULL LIMIT 1`
    );

    let juiceId;
    if (existingJuice.length > 0) {
      juiceId = existingJuice[0].id;
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, juiceId]);
      console.log(`ℹ️  Fresh Juice category already exists (ID: ${juiceId}), parent_id updated.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Fresh Juice', '🍊', 'fresh-juice', '#FFFDE7', 9, ?)`,
        [drinksId]
      );
      juiceId = res.insertId;
      console.log(`✅ Created sub-category: Fresh Juice (ID: ${juiceId}) under Drinks (ID: ${drinksId})`);
    }

    // 3. Define addons/modifiers for Fresh Juice (including ADD GINGER & LEMON)
    const juiceAddons = [
      { name: 'ADD GINGER',         price: 0.50 },
      { name: 'ADD LEMON',          price: 0.50 },
      { name: 'ADD GINGER & LEMON', price: 0.80 },
      { name: 'ADD ICE',            price: 0.00 },
      { name: 'NO ICE',             price: 0.00 },
      { name: 'TAKEAWAY',           price: 0.00 },
      { name: 'EAT IN',             price: 0.00 },
    ];

    const sizes = [{ name: 'Regular', price: 0.00 }];

    const juiceItems = [
      {
        item_name: 'Orange juice',
        price: 9.50,
        image: '🍊',
        description: 'Freshly squeezed premium oranges, served cold and packed with natural vitamin C.',
      },
      {
        item_name: 'Apple juice',
        price: 9.50,
        image: '🍎',
        description: 'Crisp and sweet juice cold-pressed from premium fresh apples.',
      },
      {
        item_name: 'Carrot juice',
        price: 9.50,
        image: '🥕',
        description: 'Naturally sweet and earthy juice freshly squeezed from crisp whole carrots.',
      },
    ];

    console.log('\n🌱 Inserting Fresh Juice items...');
    for (const item of juiceItems) {
      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?)`,
        [
          item.item_name,
          juiceId,
          item.price,
          item.image,
          item.description,
          slug,
          JSON.stringify(sizes),
          JSON.stringify(juiceAddons),
        ]
      );
      console.log(`   ✅ Added: ${item.item_name} ($${item.price})`);
    }

    console.log('\n🚀 Done! Fresh Juice sub-category with 3 items added under Drinks.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
