const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding parent_id column to menu_categories if not exists...');

    // 1. Add parent_id column (safe if already exists)
    await pool.query(`
      ALTER TABLE menu_categories
      ADD COLUMN IF NOT EXISTS parent_id INT DEFAULT NULL
    `).catch(() => {
      // MySQL < 8.0 doesn't support IF NOT EXISTS for columns, try anyway
    });

    // Try alternate syntax for older MySQL
    const [cols] = await pool.query(`SHOW COLUMNS FROM menu_categories LIKE 'parent_id'`);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE menu_categories ADD COLUMN parent_id INT DEFAULT NULL`);
      console.log('✅ parent_id column added.');
    } else {
      console.log('ℹ️  parent_id column already exists.');
    }

    // 2. Create the DRINKS parent category if it doesn't exist
    const [existingDrinks] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Drinks' AND deletedAt IS NULL`
    );

    let drinksId;
    if (existingDrinks.length > 0) {
      drinksId = existingDrinks[0].id;
      console.log(`ℹ️  Drinks category already exists (ID: ${drinksId})`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Drinks', '🥤', 'drinks', '#E8F4FD', 9, NULL)`
      );
      drinksId = res.insertId;
      console.log(`✅ Created parent category: Drinks (ID: ${drinksId})`);
    }

    // 3. Create HOT BEVERAGES sub-category under Drinks if not exists
    const [existingHot] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Hot Beverages' AND deletedAt IS NULL`
    );

    let hotBevId;
    if (existingHot.length > 0) {
      hotBevId = existingHot[0].id;
      // Ensure parent_id is set correctly
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, hotBevId]);
      console.log(`ℹ️  Hot Beverages category already exists (ID: ${hotBevId}), parent_id updated.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Hot Beverages', '☕', 'hot-beverages', '#FFF9EA', 1, ?)`,
        [drinksId]
      );
      hotBevId = res.insertId;
      console.log(`✅ Created sub-category: Hot Beverages (ID: ${hotBevId}) under Drinks (ID: ${drinksId})`);
    }

    // Coffee modifier options (shared)
    const coffeeAddons = [
      { name: 'FULL CREAM',        price: 0.00 },
      { name: 'SKIM MILK',         price: 0.00 },
      { name: 'ALMOND MILK',       price: 0.70 },
      { name: 'SOY MILK',          price: 0.70 },
      { name: 'OAT MILK',          price: 0.70 },
      { name: 'LACTOSE-FREE MILK', price: 0.70 },
      { name: 'COCONUT MILK',      price: 0.70 },
      { name: 'EXTRA SHOT',        price: 0.70 },
      { name: 'DECAF',             price: 0.70 },
      { name: '1/2 SUGAR',         price: 0.00 },
      { name: 'SUGAR',             price: 0.00 },
      { name: '2 SUGAR',           price: 0.00 },
      { name: 'EXTRA HOT',         price: 0.00 },
      { name: '3/4 FULL',          price: 0.00 },
      { name: 'WEAK',              price: 0.00 },
      { name: 'HONEY',             price: 0.30 },
      { name: 'ADD VANILLA',       price: 0.50 },
      { name: 'ADD CARAMEL',       price: 0.50 },
      { name: 'ADD HAZELNUT',      price: 0.50 },
      { name: 'TAKEAWAY',          price: 0.00 },
      { name: 'EAT IN',            price: 0.00 },
    ];

    // Standard Large / Regular sizes
    const standardSizes = [
      { name: 'Regular', price: 0.00 },
      { name: 'Large',   price: 1.00 },
    ];

    // Hot Beverages items from the menu image
    // Format: item_name, regular_price, large_price
    // Base price = Regular; Large = size upcharge via sizes[]
    const hotBevItems = [
      { item_name: 'Latte',                  image: '☕', regular: 5.70, large: 6.70, description: 'Espresso with steamed milk and a delicate layer of microfoam.' },
      { item_name: 'Flat White',             image: '☕', regular: 5.70, large: 6.70, description: 'Velvety microfoam espresso with a stronger coffee-to-milk ratio.' },
      { item_name: 'Cappuccino',             image: '☕', regular: 5.70, large: 6.70, description: 'Classic espresso with equal parts steamed milk and thick foam.' },
      { item_name: 'Piccolo',                image: '☕', regular: 5.70, large: 6.70, description: 'A ristretto shot topped with silky steamed milk in a small glass.' },
      { item_name: 'Long Black',             image: '☕', regular: 5.70, large: 6.70, description: 'Hot water with a bold double ristretto shot poured over the top.' },
      { item_name: 'Long Mac',               image: '☕', regular: 5.70, large: 6.70, description: 'Macchiato with extra hot water for a longer, smoother finish.' },
      { item_name: 'Short Mac',              image: '☕', regular: 5.70, large: 6.70, description: 'A traditional macchiato — espresso stained with a touch of foam.' },
      { item_name: 'Espresso',               image: '☕', regular: 5.70, large: 6.70, description: 'Double shot of rich, concentrated espresso.' },
      { item_name: 'Powder Chai',            image: '🍵', regular: 5.70, large: 6.70, description: 'Creamy spiced chai tea latte made with chai powder and steamed milk.' },
      { item_name: 'Hot Chocolate',          image: '🍫', regular: 5.70, large: 6.70, description: 'Rich, velvety hot chocolate made with premium Dutch cocoa.' },
      { item_name: 'Magic Coffee',           image: '☕', regular: 6.20, large: null,  description: 'A Melbourne original — two ristretto shots on ¾ steamed milk in a smaller cup.' },
      { item_name: 'Baby Chino',             image: '☕', regular: 3.80, large: null,  description: 'A small cup of fluffy steamed milk foam for the little ones.' },
      { item_name: 'Mocha',                  image: '☕', regular: 5.80, large: 6.30,  description: 'Espresso blended with rich chocolate and silky steamed milk.' },
      { item_name: 'Golden Turmeric Latte',  image: '🌿', regular: 6.70, large: 7.50,  description: 'Anti-inflammatory golden milk with turmeric, ginger, cinnamon and steamed milk.' },
      { item_name: 'Matcha Latte',           image: '🍵', regular: 6.70, large: 7.50,  description: 'Ceremonial grade Japanese matcha whisked into silky steamed milk.' },
      { item_name: 'Dirty Chai Leaf',        image: '🍵', regular: 6.70, large: 7.50,  description: 'A chai tea brewed with whole spice leaves, shot of espresso and steamed milk.' },
      { item_name: 'Dirty Chai Powder',      image: '🍵', regular: 6.20, large: 6.90,  description: 'Chai powder base with a double ristretto shot and steamed milk.' },
    ];

    console.log('\n🌱 Inserting Hot Beverages items...');
    for (const item of hotBevItems) {
      // Build sizes based on whether large price exists
      let sizes;
      if (item.large !== null) {
        const largeDiff = parseFloat((item.large - item.regular).toFixed(2));
        sizes = [
          { name: 'Regular', price: 0.00 },
          { name: 'Large',   price: largeDiff },
        ];
      } else {
        sizes = [{ name: 'Regular', price: 0.00 }];
      }

      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?)`,
        [
          item.item_name,
          hotBevId,
          item.regular,
          item.image,
          item.description,
          slug,
          JSON.stringify(sizes),
          JSON.stringify(coffeeAddons),
        ]
      );
      console.log(`   ✅ Added: ${item.item_name} (Regular $${item.regular}${item.large ? ` / Large $${item.large}` : ''})`);
    }

    console.log('\n🚀 Done! Drinks parent category + Hot Beverages sub-category with 17 items created.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
