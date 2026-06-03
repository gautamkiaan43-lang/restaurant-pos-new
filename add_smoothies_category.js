const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding Smoothies sub-category under Drinks...');

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

    // 2. Create Smoothies sub-category
    const [existing] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Smoothies' AND deletedAt IS NULL LIMIT 1`
    );

    let smoothieId;
    if (existing.length > 0) {
      smoothieId = existing[0].id;
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, smoothieId]);
      console.log(`ℹ️  Smoothies already exists (ID: ${smoothieId}), parent_id updated.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Smoothies', '🥤', 'smoothies', '#F0FFF4', 4, ?)`,
        [drinksId]
      );
      smoothieId = res.insertId;
      console.log(`✅ Created: Smoothies (ID: ${smoothieId}) under Drinks (ID: ${drinksId})`);
    }

    // 3. Milk/water base addons (from the menu note)
    const smoothieAddons = [
      { name: 'WATER BASE',        price: 0.00 },
      { name: 'FULL CREAM MILK',   price: 0.00 },
      { name: 'SKIM MILK',         price: 0.00 },
      { name: 'ALMOND MILK',       price: 0.70 },
      { name: 'SOY MILK',          price: 0.70 },
      { name: 'OAT MILK',          price: 0.70 },
      { name: 'LACTOSE-FREE MILK', price: 0.70 },
      { name: 'COCONUT MILK',      price: 0.70 },
      { name: 'ADD HONEY',         price: 0.50 },
      { name: 'ADD PROTEIN',       price: 2.00 },
      { name: 'TAKEAWAY',          price: 0.00 },
      { name: 'EAT IN',            price: 0.00 },
    ];

    const sizes = [{ name: 'Regular', price: 0.00 }];

    // 4. Items from image
    const items = [
      {
        item_name: 'Matcha Green Tea Smoothie',
        image: '🍵',
        description: 'Coconut yoghurt, mango and matcha green tea powder blended with your choice of water or milk. Vibrant, antioxidant-rich and energising.',
      },
      {
        item_name: 'Summer Mango Smoothie',
        image: '🥭',
        description: 'Tropical blend of mango, pineapple, banana and passionfruit with your choice of water or milk. Sunshine in a glass.',
      },
      {
        item_name: 'Amazonia Smoothie',
        image: '🫐',
        description: 'Acai, blueberry, raspberry and banana blended with your choice of water or milk. Packed with antioxidants and natural energy.',
      },
      {
        item_name: 'Evergreen Smoothie',
        image: '🥝',
        description: 'Mango, pineapple, kiwi and kale blended with your choice of water or milk. A refreshing green boost full of vitamins.',
        isVeg: 1,
        isVegan: 1,
        dietaryTags: 'VG,V',
      },
    ];

    console.log('\n🌱 Inserting Smoothies items...');
    for (const item of items) {
      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons, isVeg, isVegan, dietaryTags)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?, ?, ?, ?)`,
        [
          item.item_name,
          smoothieId,
          13.50,
          item.image,
          item.description,
          slug,
          JSON.stringify(sizes),
          JSON.stringify(smoothieAddons),
          item.isVeg || 0,
          item.isVegan || 0,
          item.dietaryTags || '',
        ]
      );
      console.log(`   ✅ Added: ${item.item_name} ($13.50)`);
    }

    console.log('\n🚀 Done! Smoothies sub-category with 4 items added under Drinks.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
})();
