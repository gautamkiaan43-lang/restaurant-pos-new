const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding Flavoured Iced Long Black sub-category under Drinks...');

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

    // 2. Create Flavoured Iced Long Black sub-category under Drinks
    const [existingFlavoured] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Flavoured Iced Long Black' AND deletedAt IS NULL LIMIT 1`
    );

    let flavouredId;
    if (existingFlavoured.length > 0) {
      flavouredId = existingFlavoured[0].id;
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, flavouredId]);
      console.log(`ℹ️  Flavoured Iced Long Black category already exists (ID: ${flavouredId}), parent_id updated.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Flavoured Iced Long Black', '🍊', 'flavoured-iced-long-black', '#FFF3E0', 7, ?)`,
        [drinksId]
      );
      flavouredId = res.insertId;
      console.log(`✅ Created sub-category: Flavoured Iced Long Black (ID: ${flavouredId}) under Drinks (ID: ${drinksId})`);
    }

    // 3. Define addons/modifiers for Flavoured Iced Long Black
    const flavouredAddons = [
      { name: 'EXTRA ESPRESSO SHOT', price: 1.50 },
      { name: 'ADD HONEY',          price: 0.50 },
      { name: 'TAKEAWAY',           price: 0.00 },
      { name: 'EAT IN',             price: 0.00 },
    ];

    const sizes = [{ name: 'Regular', price: 0.00 }];

    const flavouredItems = [
      {
        item_name: 'Iced orange Americano long black',
        price: 7.50,
        image: '🍊',
        description: 'Chilled double shot espresso poured over sweet refreshing orange juice and ice.',
      },
      {
        item_name: 'Iced pineapple long black',
        price: 7.50,
        image: '🍍',
        description: 'Bold double shot espresso layered beautifully with sweet, tropical pineapple juice and ice.',
      },
      {
        item_name: 'Iced lemonade long black',
        price: 7.50,
        image: '🍋',
        description: 'Refreshing and zesty lemonade topped with two rich shots of espresso over ice.',
      },
      {
        item_name: 'Iced coconut water long black',
        price: 7.50,
        image: '🥥',
        description: 'Naturally hydrating and sweet chilled coconut water combined with a double shot of bold espresso over ice.',
      },
    ];

    console.log('\n🌱 Inserting Flavoured Iced Long Black items...');
    for (const item of flavouredItems) {
      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?)`,
        [
          item.item_name,
          flavouredId,
          item.price,
          item.image,
          item.description,
          slug,
          JSON.stringify(sizes),
          JSON.stringify(flavouredAddons),
        ]
      );
      console.log(`   ✅ Added: ${item.item_name} ($${item.price})`);
    }

    console.log('\n🚀 Done! Flavoured Iced Long Black sub-category with 4 items added under Drinks.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
