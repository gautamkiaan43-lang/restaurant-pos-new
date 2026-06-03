const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding Cold Beverages sub-category under Drinks...');

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

    // 2. Create Cold Beverages sub-category under Drinks
    const [existingCold] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Cold Beverages' AND deletedAt IS NULL LIMIT 1`
    );

    let coldBeveragesId;
    if (existingCold.length > 0) {
      coldBeveragesId = existingCold[0].id;
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, coldBeveragesId]);
      console.log(`ℹ️  Cold Beverages category already exists (ID: ${coldBeveragesId}), parent_id updated.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Cold Beverages', '🥤', 'cold-beverages', '#FFF5FB', 5, ?)`,
        [drinksId]
      );
      coldBeveragesId = res.insertId;
      console.log(`✅ Created sub-category: Cold Beverages (ID: ${coldBeveragesId}) under Drinks (ID: ${drinksId})`);
    }

    // 3. Define cold beverages addons/modifiers
    const coldAddons = [
      { name: 'FULL CREAM MILK',   price: 0.00 },
      { name: 'SKIM MILK',         price: 0.00 },
      { name: 'ALMOND MILK',       price: 0.70 },
      { name: 'SOY MILK',          price: 0.70 },
      { name: 'OAT MILK',          price: 0.70 },
      { name: 'LACTOSE-FREE MILK', price: 0.70 },
      { name: 'COCONUT MILK',      price: 0.70 },
      { name: 'ADD VANILLA SYRUP',  price: 0.50 },
      { name: 'ADD CARAMEL SYRUP',  price: 0.50 },
      { name: 'ADD HAZELNUT SYRUP', price: 0.50 },
      { name: 'ADD WHIPPED CREAM',  price: 0.80 },
      { name: 'ADD ICE CREAM SCOOP',price: 2.30 },
      { name: 'TAKEAWAY',          price: 0.00 },
      { name: 'EAT IN',            price: 0.00 },
    ];

    const sizes = [{ name: 'Regular', price: 0.00 }];

    const coldItems = [
      {
        item_name: 'Iced Latte',
        price: 6.90,
        image: '🥤',
        description: 'Chilled espresso poured over fresh cold milk and ice. Perfect as is or customized with your choice of sweet syrups.',
      },
      {
        item_name: 'Iced Mocha',
        price: 6.90,
        image: '🍫',
        description: 'Chilled rich espresso blended with chocolate sauce and cold milk, served over ice.',
      },
      {
        item_name: 'Iced Long Black',
        price: 6.90,
        image: '☕',
        description: 'Chilled double espresso shots poured over cold water and ice for a crisp, intense coffee experience.',
      },
      {
        item_name: 'Biscoff Iced Latte',
        price: 6.90,
        image: '🍪',
        description: 'Indulgent iced latte infused with sweet Lotus Biscoff cookie spread and crushed cookies.',
      },
      {
        item_name: 'Iced Chocolate with Whipped Cream',
        price: 6.90,
        image: '🍦',
        description: 'Decadent premium cold chocolate served over ice and topped with a generous swirl of whipped cream.',
      },
      {
        item_name: 'Iced Powder Chai',
        price: 6.90,
        image: '🥛',
        description: 'Chilled milk blended with aromatic, sweetened spiced chai powder over ice.',
      },
      {
        item_name: 'Iced Masala Chai',
        price: 6.90,
        image: '🌶️',
        description: 'Traditional spiced black tea brewed with fresh spices, chilled down and served refreshing over ice.',
      },
      {
        item_name: 'Iced Mocha with Ice Cream',
        price: 9.20,
        image: '🍨',
        description: 'Chilled rich mocha poured over milk and topped with a premium scoop of vanilla ice cream.',
      },
      {
        item_name: 'Iced Coffee with Ice Cream',
        price: 9.20,
        image: '🍧',
        description: 'Classic cold brew style coffee topped with a smooth, luxurious scoop of vanilla ice cream.',
      },
    ];

    console.log('\n🌱 Inserting Cold Beverages items...');
    for (const item of coldItems) {
      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Let's filter specific addons if needed, but keeping the full premium list makes customization amazing
      const itemAddons = [...coldAddons];

      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?)`,
        [
          item.item_name,
          coldBeveragesId,
          item.price,
          item.image,
          item.description,
          slug,
          JSON.stringify(sizes),
          JSON.stringify(itemAddons),
        ]
      );
      console.log(`   ✅ Added: ${item.item_name} ($${item.price})`);
    }

    console.log('\n🚀 Done! Cold Beverages sub-category with 9 items added under Drinks.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
