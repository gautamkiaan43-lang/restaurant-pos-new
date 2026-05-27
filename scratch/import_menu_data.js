const pool = require('../src/database/connection');

(async () => {
  try {
    console.log('🚀 Starting Enterprise POS Menu Database Migration & Seeding...');

    // 1. Additive Column Migrations on Existing Tables
    console.log('⌛ Altering menu_categories table (additive)...');
    await pool.execute(`
      ALTER TABLE menu_categories 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS color VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS sortOrder INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS isActive TINYINT DEFAULT 1;
    `);
    console.log('✅ menu_categories altered successfully.');

    console.log('⌛ Altering menu_items table (additive)...');
    await pool.execute(`
      ALTER TABLE menu_items 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NULL,
      ADD COLUMN IF NOT EXISTS isVeg TINYINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS isVegan TINYINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS isGlutenFree TINYINT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS dietaryTags VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS isActive TINYINT DEFAULT 1;
    `);
    console.log('✅ menu_items altered successfully.');

    // 2. Create Modifiers & Variants Tables
    console.log('⌛ Creating modifier_groups table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS modifier_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'single' or 'multiple'
        isRequired TINYINT DEFAULT 0,
        minSelect INT DEFAULT 0,
        maxSelect INT DEFAULT 1
      );
    `);
    console.log('✅ modifier_groups table ready.');

    console.log('⌛ Creating modifiers table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS modifiers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        groupId INT,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) DEFAULT 0.00,
        FOREIGN KEY (groupId) REFERENCES modifier_groups(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ modifiers table ready.');

    console.log('⌛ Creating menu_modifier_relations table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS menu_modifier_relations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menuItemId INT,
        modifierGroupId INT,
        FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE CASCADE,
        FOREIGN KEY (modifierGroupId) REFERENCES modifier_groups(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ menu_modifier_relations table ready.');

    console.log('⌛ Creating menu_variants table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS menu_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        menuItemId INT,
        variantName VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (menuItemId) REFERENCES menu_items(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ menu_variants table ready.');

    // 3. Define and Seeding Categories
    const categories = [
      { name: 'Classics', slug: 'classics', icon: '🍳', color: '#FFF8E7', sortOrder: 1 },
      { name: 'Breakfast Wrap', slug: 'breakfast-wrap', icon: '🌯', color: '#EAFBF3', sortOrder: 2 },
      { name: 'Burgers', slug: 'burgers', icon: '🍔', color: '#FFE0EB', sortOrder: 3 },
      { name: 'English Breakfast', slug: 'english-breakfast', icon: '🥓', color: '#FFF5D7', sortOrder: 4 },
      { name: 'Rice Bowls', slug: 'rice-bowls', icon: '🍚', color: '#E7F4FF', sortOrder: 5 },
      { name: 'Baguettes', slug: 'baguettes', icon: '🥖', color: '#FFF8E7', sortOrder: 6 },
      { name: 'Light & Sweet', slug: 'light-sweet', icon: '🥐', color: '#FFF0F5', sortOrder: 7 },
      { name: 'Sides', slug: 'sides', icon: '🍟', color: '#E5DBFF', sortOrder: 8 },
      { name: 'Hot Beverages', slug: 'hot-beverages', icon: '☕', color: '#FFF5D7', sortOrder: 9 },
      { name: 'Tea', slug: 'tea', icon: '🍵', color: '#EAFBF3', sortOrder: 10 },
      { name: 'Cold Beverages', slug: 'cold-beverages', icon: '🍹', color: '#E7F4FF', sortOrder: 11 },
      { name: 'Milkshakes', slug: 'milkshakes', icon: '🥤', color: '#FFE0EB', sortOrder: 12 },
      { name: 'Smoothies', slug: 'smoothies', icon: '🥤', color: '#F3EEFF', sortOrder: 13 }
    ];

    console.log('⌛ Seeding Categories...');
    const catMap = {}; // mapping name to inserted id
    for (const cat of categories) {
      // Check if category already exists
      const [existing] = await pool.execute('SELECT id FROM menu_categories WHERE category_name = ?', [cat.name]);
      let catId;
      if (existing.length > 0) {
        catId = existing[0].id;
        await pool.execute(
          'UPDATE menu_categories SET slug = ?, icon = ?, color = ?, sortOrder = ?, isActive = 1, deletedAt = NULL WHERE id = ?',
          [cat.slug, cat.icon, cat.color, cat.sortOrder, catId]
        );
      } else {
        const [result] = await pool.execute(
          'INSERT INTO menu_categories (category_name, slug, icon, color, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, 1)',
          [cat.name, cat.slug, cat.icon, cat.color, cat.sortOrder]
        );
        catId = result.insertId;
      }
      catMap[cat.name] = catId;
    }
    console.log('✅ Categories seeded successfully.');

    // 4. Define and Seeding Modifier Groups & Modifiers
    const modifierGroups = [
      {
        name: 'Add Extra',
        type: 'multiple',
        isRequired: 0,
        minSelect: 0,
        maxSelect: 5,
        items: [
          { name: 'extra egg', price: 1.50 },
          { name: 'avocado', price: 2.50 },
          { name: 'halloumi', price: 3.00 },
          { name: 'bacon', price: 3.00 },
          { name: 'sausage', price: 3.00 },
          { name: 'smoked salmon', price: 5.00 }
        ]
      },
      {
        name: 'Bread Options',
        type: 'single',
        isRequired: 0,
        minSelect: 0,
        maxSelect: 1,
        items: [
          { name: 'sourdough', price: 0.00 },
          { name: 'multigrain', price: 0.00 },
          { name: 'rye', price: 0.00 },
          { name: 'gluten-free', price: 1.50 }
        ]
      },
      {
        name: 'Milk Options',
        type: 'single',
        isRequired: 0,
        minSelect: 0,
        maxSelect: 1,
        items: [
          { name: 'almond', price: 0.70 },
          { name: 'soy', price: 0.70 },
          { name: 'oat', price: 0.70 },
          { name: 'lactose free', price: 0.70 },
          { name: 'coconut', price: 0.70 },
          { name: 'full cream', price: 0.00 },
          { name: 'skim milk', price: 0.00 }
        ]
      },
      {
        name: 'Wrap Options',
        type: 'single',
        isRequired: 0,
        minSelect: 0,
        maxSelect: 1,
        items: [
          { name: 'spinach wrap', price: 0.00 },
          { name: 'gluten free wrap', price: 1.50 }
        ]
      },
      {
        name: 'Sweet Options',
        type: 'multiple',
        isRequired: 0,
        minSelect: 0,
        maxSelect: 3,
        items: [
          { name: 'Nutella', price: 1.50 },
          { name: 'Cream', price: 1.00 },
          { name: 'Apricot jam', price: 1.00 }
        ]
      }
    ];

    console.log('⌛ Seeding Modifier Groups & Modifiers...');
    const groupMap = {}; // mapping name to group id
    for (const group of modifierGroups) {
      // Check if exists
      const [existingGroup] = await pool.execute('SELECT id FROM modifier_groups WHERE name = ?', [group.name]);
      let groupId;
      if (existingGroup.length > 0) {
        groupId = existingGroup[0].id;
        await pool.execute(
          'UPDATE modifier_groups SET type = ?, isRequired = ?, minSelect = ?, maxSelect = ? WHERE id = ?',
          [group.type, group.isRequired, group.minSelect, group.maxSelect, groupId]
        );
      } else {
        const [result] = await pool.execute(
          'INSERT INTO modifier_groups (name, type, isRequired, minSelect, maxSelect) VALUES (?, ?, ?, ?, ?)',
          [group.name, group.type, group.isRequired, group.minSelect, group.maxSelect]
        );
        groupId = result.insertId;
      }
      groupMap[group.name] = groupId;

      // Seed Modifiers under this group
      for (const item of group.items) {
        const [existingMod] = await pool.execute('SELECT id FROM modifiers WHERE name = ? AND groupId = ?', [item.name, groupId]);
        if (existingMod.length > 0) {
          await pool.execute('UPDATE modifiers SET price = ? WHERE id = ?', [item.price, existingMod[0].id]);
        } else {
          await pool.execute('INSERT INTO modifiers (groupId, name, price) VALUES (?, ?, ?)', [groupId, item.name, item.price]);
        }
      }
    }
    console.log('✅ Modifiers seeded successfully.');

    // 5. Define Menu Items
    const menuItems = [
      {
        category: 'Classics',
        name: 'TOAST',
        description: 'Warm, toasted artisan bread of your choice, served with premium butter and spreads.',
        price: 5.50,
        isVeg: 1,
        modifierGroups: ['Bread Options'],
        image: '🍞'
      },
      {
        category: 'Classics',
        name: 'AVO TOAST',
        description: 'Smashed fresh avocado, sea salt, pepper, and cherry tomatoes on toasted sourdough.',
        price: 12.50,
        isVeg: 1,
        modifierGroups: ['Bread Options', 'Add Extra'],
        image: '🥑'
      },
      {
        category: 'Classics',
        name: 'BREKKIE ROLL',
        description: 'Classic morning roll loaded with bacon, sausage, fried egg, and choice of sauce.',
        price: 9.50,
        modifierGroups: ['Add Extra'],
        image: '🍳'
      },
      {
        category: 'Classics',
        name: 'POTATO HASH STACK',
        description: 'Crisp layered bubble and squeeze potato cake stack, seasoned with herbs.',
        price: 14.50,
        isVeg: 1,
        modifierGroups: ['Add Extra'],
        image: '🥞'
      },
      {
        category: 'Classics',
        name: 'SMOKED SALMON BUBBLE SQUEEZE HASH STACK',
        description: 'Crisp potato hash cake stack loaded with rich smoked salmon, dill, and capers.',
        price: 19.50,
        modifierGroups: ['Add Extra'],
        image: '🍣'
      },
      {
        category: 'Breakfast Wrap',
        name: 'EGG WRAP',
        description: 'Scrambled eggs, dynamic garden spinach, and sweet tomato relish in a soft grilled wrap.',
        price: 9.50,
        isVeg: 1,
        modifierGroups: ['Wrap Options', 'Add Extra'],
        image: '🌯'
      },
      {
        category: 'Breakfast Wrap',
        name: 'FALAFEL WRAP',
        description: 'Crisp spiced falafel balls, rich house hummus, fresh greens, and cucumber tahini.',
        price: 11.50,
        isVeg: 1,
        isVegan: 1,
        modifierGroups: ['Wrap Options'],
        image: '🌯'
      },
      {
        category: 'Breakfast Wrap',
        name: 'CHICKEN WRAP',
        description: 'Tender grilled breast strips, smashed avocado, field greens, and creamy garlic aioli.',
        price: 13.50,
        modifierGroups: ['Wrap Options', 'Add Extra'],
        image: '🌯'
      },
      {
        category: 'Breakfast Wrap',
        name: 'KATHI WRAP',
        description: 'Spiced skewered cottage paneer/chicken rolled in an elegant hot paratha wrap.',
        price: 12.50,
        isVeg: 1,
        modifierGroups: ['Wrap Options'],
        image: '🌯'
      },
      {
        category: 'Burgers',
        name: 'GRILLED BURGER',
        description: 'Prime grilled beef patty, melted cheddar, lettuce, tomatoes, pickles, and dynamic house sauce.',
        price: 14.50,
        modifierGroups: ['Add Extra'],
        image: '🍔'
      },
      {
        category: 'English Breakfast',
        name: 'FULL ENGLISH BREAKFAST',
        description: 'The ultimate morning feast: two fried eggs, back bacon, sausage, baked beans, mushrooms, and toast.',
        price: 18.50,
        modifierGroups: ['Bread Options'],
        image: '🍳'
      },
      {
        category: 'English Breakfast',
        name: 'VEGETARIAN BREAKFAST',
        description: 'Two eggs, rich grilled halloumi, beans, avocado, mushrooms, spinach, and toast.',
        price: 17.50,
        isVeg: 1,
        modifierGroups: ['Bread Options'],
        image: '🥗'
      },
      {
        category: 'English Breakfast',
        name: 'VEGAN BREAKFAST',
        description: 'Spiced tofu scramble, organic beans, avocado, mushrooms, spinach, and sourdough.',
        price: 17.50,
        isVeg: 1,
        isVegan: 1,
        modifierGroups: ['Bread Options'],
        image: '🌱'
      },
      {
        category: 'Rice Bowls',
        name: 'TERIYAKI CHICKEN BOWL',
        description: 'Succulent grilled chicken, premium jasmin rice, edamame, and home teriyaki glaze.',
        price: 15.50,
        image: '🍚'
      },
      {
        category: 'Baguettes',
        name: 'HAM & CHEESE BAGUETTE',
        description: 'Toasted french baguette loaded with honey ham, swiss cheese, and dijon mustard.',
        price: 9.50,
        image: '🥖'
      },
      {
        category: 'Light & Sweet',
        name: 'SMASHED AVO CROISSANT',
        description: 'Flaky warm croissant filled with seasoned smashed avocado and sea salt.',
        price: 9.50,
        isVeg: 1,
        image: '🥐'
      },
      {
        category: 'Light & Sweet',
        name: 'CHILLI SCRAMBLED EGGS CROISSANT',
        description: 'Buttery croissant stuffed to the brim with fluffy scrambles eggs and house chilli crisp.',
        price: 11.50,
        isVeg: 1,
        image: '🥐'
      },
      {
        category: 'Sides',
        name: 'BRUSCHETTA',
        description: 'Toasted sourdough topped with marinated cherry tomatoes, fresh garlic, and sweet basil.',
        price: 12.50,
        isVeg: 1,
        modifierGroups: ['Bread Options'],
        image: '🍞'
      },
      {
        category: 'Sides',
        name: 'NACHOS',
        description: 'Crisp tortilla chips baked with cheese, loaded with fresh guacamole, sour cream, and salsa.',
        price: 9.50,
        isVeg: 1,
        image: '🍟'
      },
      {
        category: 'Sides',
        name: 'LOADED FRIES',
        description: 'Golden beer-battered fries loaded with cheddar cheese sauce, bacon bits, and green onions.',
        price: 8.50,
        image: '🍟'
      },
      // Beverages with Portions (Variants)
      {
        category: 'Hot Beverages',
        name: 'Latte',
        description: 'Silky double shot espresso with warm textured microfoam.',
        price: 5.70,
        isVeg: 1,
        isVegan: 0,
        modifierGroups: ['Milk Options'],
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '☕'
      },
      {
        category: 'Hot Beverages',
        name: 'Flat White',
        description: 'Velvety espresso blended with steamed milk for a strong, smooth profile.',
        price: 5.70,
        isVeg: 1,
        modifierGroups: ['Milk Options'],
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '☕'
      },
      {
        category: 'Hot Beverages',
        name: 'Cappuccino',
        description: 'Traditional espresso shot topped with equal parts steamed and foamed milk, dusted with cocoa.',
        price: 5.70,
        isVeg: 1,
        modifierGroups: ['Milk Options'],
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '☕'
      },
      {
        category: 'Hot Beverages',
        name: 'Espresso',
        description: 'Rich, bold, and concentrated single or double shot of pure coffee beans.',
        price: 3.50,
        isVeg: 1,
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '☕'
      },
      {
        category: 'Tea',
        name: 'Black Tea',
        description: 'Premium organic black tea leaves, brewed to perfection.',
        price: 4.00,
        isVeg: 1,
        modifierGroups: ['Milk Options'],
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '🍵'
      },
      {
        category: 'Tea',
        name: 'Green Tea',
        description: 'Refreshing organic green tea leaves loaded with antioxidants.',
        price: 4.00,
        isVeg: 1,
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '🍵'
      },
      {
        category: 'Cold Beverages',
        name: 'Iced Coffee',
        description: 'Double espresso poured over ice milk, sweetened with a syrup dash.',
        price: 6.00,
        isVeg: 1,
        modifierGroups: ['Milk Options'],
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '🍹'
      },
      {
        category: 'Cold Beverages',
        name: 'Iced Tea',
        description: 'Chilled house-brewed black tea with fresh lemon slices and mint.',
        price: 5.50,
        isVeg: 1,
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '🍹'
      },
      {
        category: 'Milkshakes',
        name: 'Chocolate Milkshake',
        description: 'Creamy premium vanilla ice cream blended with rich dark cocoa syrup and milk.',
        price: 7.50,
        isVeg: 1,
        modifierGroups: ['Milk Options'],
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '🥤'
      },
      {
        category: 'Milkshakes',
        name: 'Strawberry Milkshake',
        description: 'Blended dynamic fresh strawberries, double scoop ice cream, and chilled whole milk.',
        price: 7.50,
        isVeg: 1,
        modifierGroups: ['Milk Options'],
        sizes: [
          { name: 'Regular', price: 0.00 },
          { name: 'Large', price: 1.00 }
        ],
        image: '🥤'
      },
      {
        category: 'Smoothies',
        name: 'Berry Smoothie',
        description: 'Thick blend of strawberries, blueberries, blackberries, Greek yogurt, and honey.',
        price: 8.50,
        isVeg: 1,
        modifierGroups: ['Milk Options'],
        image: '🥤'
      },
      {
        category: 'Smoothies',
        name: 'Green Smoothie',
        description: 'Healthy and satisfying blend of fresh spinach, banana, green apple, and almond milk.',
        price: 8.50,
        isVeg: 1,
        isVegan: 1,
        modifierGroups: ['Milk Options'],
        image: '🥤'
      }
    ];

    console.log('⌛ Seeding Menu Items...');
    for (const item of menuItems) {
      const categoryId = catMap[item.category];
      if (!categoryId) {
        console.warn(`⚠️ Skipped item ${item.name} due to missing category: ${item.category}`);
        continue;
      }

      // 1. Build Addons JSON based on assigned modifier groups
      const addonsArray = [];
      const itemGroupIds = [];
      if (item.modifierGroups) {
        for (const gName of item.modifierGroups) {
          const groupId = groupMap[gName];
          if (groupId) {
            itemGroupIds.push(groupId);
            const [mods] = await pool.execute('SELECT name, price FROM modifiers WHERE groupId = ?', [groupId]);
            addonsArray.push(...mods.map(m => ({ name: m.name, price: parseFloat(m.price) })));
          }
        }
      }
      const addonsStr = addonsArray.length > 0 ? JSON.stringify(addonsArray) : null;
      const sizesStr = item.sizes ? JSON.stringify(item.sizes) : null;

      // 2. Generate slug
      const itemSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const dietaryTagsStr = [
        item.isVeg ? 'V' : '',
        item.isVegan ? 'VG' : '',
        item.isGlutenFree ? 'GFO' : ''
      ].filter(Boolean).join(',');

      // 3. Upsert Menu Item in menu_items
      const [existingItem] = await pool.execute('SELECT id FROM menu_items WHERE item_name = ?', [item.name]);
      let menuItemId;
      if (existingItem.length > 0) {
        menuItemId = existingItem[0].id;
        await pool.execute(
          `UPDATE menu_items 
           SET category_id = ?, description = ?, price = ?, image = ?, addons = ?, sizes = ?, 
               slug = ?, isVeg = ?, isVegan = ?, isGlutenFree = ?, dietaryTags = ?, isActive = 1, deletedAt = NULL
           WHERE id = ?`,
          [
            categoryId, item.description, item.price, item.image, addonsStr, sizesStr,
            itemSlug, item.isVeg || 0, item.isVegan || 0, item.isGlutenFree || 0, dietaryTagsStr,
            menuItemId
          ]
        );
      } else {
        const [insertResult] = await pool.execute(
          `INSERT INTO menu_items 
           (category_id, item_name, description, price, image, addons, sizes, slug, isVeg, isVegan, isGlutenFree, dietaryTags, isActive) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            categoryId, item.name, item.description, item.price, item.image, addonsStr, sizesStr,
            itemSlug, item.isVeg || 0, item.isVegan || 0, item.isGlutenFree || 0, dietaryTagsStr
          ]
        );
        menuItemId = insertResult.insertId;
      }

      // 4. Seeding relational menu_modifier_relations
      await pool.execute('DELETE FROM menu_modifier_relations WHERE menuItemId = ?', [menuItemId]);
      for (const groupId of itemGroupIds) {
        await pool.execute('INSERT INTO menu_modifier_relations (menuItemId, modifierGroupId) VALUES (?, ?)', [menuItemId, groupId]);
      }

      // 5. Seeding relational menu_variants
      await pool.execute('DELETE FROM menu_variants WHERE menuItemId = ?', [menuItemId]);
      if (item.sizes) {
        for (const sz of item.sizes) {
          // Absolute variant price = base item price + size delta
          const variantAbsPrice = parseFloat(item.price) + sz.price;
          await pool.execute(
            'INSERT INTO menu_variants (menuItemId, variantName, price) VALUES (?, ?, ?)',
            [menuItemId, sz.name, variantAbsPrice]
          );
        }
      }
    }
    console.log('✅ Menu items, modifiers relations, and variants successfully seeded.');
    console.log('🎉 Enterprise Menu Import Seeding Script Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Failed:', err);
    process.exit(1);
  }
})();
