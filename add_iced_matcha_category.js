const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🔧 Adding Iced Matcha sub-category under Drinks...');

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

    // 2. Create Iced Matcha sub-category under Drinks
    const [existingMatcha] = await pool.query(
      `SELECT id FROM menu_categories WHERE category_name = 'Iced Matcha' AND deletedAt IS NULL LIMIT 1`
    );

    let matchaId;
    if (existingMatcha.length > 0) {
      matchaId = existingMatcha[0].id;
      await pool.query(`UPDATE menu_categories SET parent_id = ? WHERE id = ?`, [drinksId, matchaId]);
      console.log(`ℹ️  Iced Matcha category already exists (ID: ${matchaId}), parent_id updated.`);
    } else {
      const [res] = await pool.query(
        `INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder, parent_id)
         VALUES ('Iced Matcha', '🍵', 'iced-matcha', '#E8F8F5', 8, ?)`,
        [drinksId]
      );
      matchaId = res.insertId;
      console.log(`✅ Created sub-category: Iced Matcha (ID: ${matchaId}) under Drinks (ID: ${drinksId})`);
    }

    // 3. Define addons/modifiers for Iced Matcha
    const matchaAddons = [
      { name: 'FULL CREAM MILK',   price: 0.00 },
      { name: 'SKIM MILK',         price: 0.00 },
      { name: 'ALMOND MILK',       price: 0.70 },
      { name: 'SOY MILK',          price: 0.70 },
      { name: 'OAT MILK',          price: 0.70 },
      { name: 'LACTOSE-FREE MILK', price: 0.70 },
      { name: 'COCONUT MILK',      price: 0.70 },
      { name: 'ADD HONEY',         price: 0.50 },
      { name: 'ADD WHIPPED CREAM',  price: 0.80 },
      { name: 'TAKEAWAY',          price: 0.00 },
      { name: 'EAT IN',            price: 0.00 },
    ];

    const sizes = [{ name: 'Regular', price: 0.00 }];

    const matchaItems = [
      {
        item_name: 'Lychee Iced matcha',
        price: 9.20,
        image: '🍈',
        description: 'Vibrant Japanese green tea matcha combined with sweet floral lychee juice, milk of your choice and ice.',
      },
      {
        item_name: 'Blueberry Iced matcha',
        price: 9.20,
        image: '🫐',
        description: 'Premium matcha layered over sweet blueberry compote, chilled milk of your choice and ice.',
      },
      {
        item_name: 'Mango Iced matcha',
        price: 9.20,
        image: '🥭',
        description: 'Chilled matcha poured over a luscious base of tropical mango purée and cold milk over ice.',
      },
      {
        item_name: 'Pitted black cherry Iced matcha',
        price: 9.20,
        image: '🍒',
        description: 'Rich, earthy matcha layered with sweet pitted black cherry syrup and milk over ice.',
      },
      {
        item_name: 'Biscoff Iced matcha',
        price: 9.20,
        image: '🍪',
        description: 'Creamy iced matcha latte infused with sweet Lotus Biscoff spread and topped with biscuit crumbs.',
      },
    ];

    console.log('\n🌱 Inserting Iced Matcha items...');
    for (const item of matchaItems) {
      const slug = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons)
         VALUES (?, ?, ?, ?, ?, 'In Stock', 5.0, 0, ?, ?, ?)`,
        [
          item.item_name,
          matchaId,
          item.price,
          item.image,
          item.description,
          slug,
          JSON.stringify(sizes),
          JSON.stringify(matchaAddons),
        ]
      );
      console.log(`   ✅ Added: ${item.item_name} ($${item.price})`);
    }

    console.log('\n🚀 Done! Iced Matcha sub-category with 5 items added under Drinks.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
