const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding Affogato sub-category under Drinks...');

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

    // 2. Create Affogato sub-category under Drinks
    const [existingAffogato] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Affogato' AND deletedAt IS NULL LIMIT 1`
    );

    let affogatoId;
    if (existingAffogato.length > 0) {
      affogatoId = existingAffogato[0].id;
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, affogatoId]);
      console.log(`ℹ️  Affogato category already exists (ID: ${affogatoId}), parent_id updated.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Affogato', '🍨', 'affogato', '#F3E9FF', 6, ?)`,
        [drinksId]
      );
      affogatoId = res.insertId;
      console.log(`✅ Created sub-category: Affogato (ID: ${affogatoId}) under Drinks (ID: ${drinksId})`);
    }

    // 3. Define Affogato addons/modifiers
    const affogatoAddons = [
      { name: 'EXTRA VANILLA SCOOP', price: 2.00 },
      { name: 'ADD WHIPPED CREAM',   price: 0.80 },
      { name: 'ADD CHOCOLATE FLAKES',price: 0.50 },
      { name: 'ADD CARAMEL DRIZZLE', price: 0.50 },
      { name: 'ADD BISCOFF CRUMBS',  price: 0.50 },
      { name: 'TAKEAWAY',            price: 0.00 },
      { name: 'EAT IN',              price: 0.00 },
    ];

    const sizes = [{ name: 'Regular', price: 0.00 }];

    const affogatoItems = [
      {
        item_name: 'Expresso with vanilla ice cream',
        price: 7.90,
        image: '🍨',
        description: 'A shot of hot, rich espresso poured over a scoop of premium vanilla ice cream for a bittersweet Italian dessert.',
      }
    ];

    console.log('\n🌱 Inserting Affogato items...');
    for (const item of affogatoItems) {
      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?)`,
        [
          item.item_name,
          affogatoId,
          item.price,
          item.image,
          item.description,
          slug,
          JSON.stringify(sizes),
          JSON.stringify(affogatoAddons),
        ]
      );
      console.log(`   ✅ Added: ${item.item_name} ($${item.price})`);
    }

    console.log('\n🚀 Done! Affogato sub-category with 1 item added under Drinks.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
