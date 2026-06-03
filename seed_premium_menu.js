const pool = require('./src/database/connection');

(async () => {
  try {
    console.log('🧹 Clearing old menu items and categories...');

    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DELETE FROM menu_items');
    await pool.query('DELETE FROM menu_categories');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Old menu database records cleared.');

    // Only 8 categories as specified
    const categories = [
      { category_name: 'Rice Bowls',        icon: '🍜', slug: 'rice-bowls',         color: '#F4FFE5', sortOrder: 1 },
      { category_name: 'English Breakfast', icon: '🍳', slug: 'english-breakfast',   color: '#FFF5D7', sortOrder: 2 },
      { category_name: 'Breakfast Wrap',    icon: '🌯', slug: 'breakfast-wrap',       color: '#EAFBF3', sortOrder: 3 },
      { category_name: 'Classics',          icon: '🍞', slug: 'classics',             color: '#FFF8E7', sortOrder: 4 },
      { category_name: 'BAHN-MI-BAGUETTES', icon: '🥖', slug: 'bahn-mi-baguettes',  color: '#FFF3E8', sortOrder: 5 },
      { category_name: 'LIGHT & SWEET',     icon: '🍰', slug: 'light-sweet',          color: '#FFF0F4', sortOrder: 6 },
      { category_name: 'Sides',             icon: '🍟', slug: 'sides',                color: '#FFF8E0', sortOrder: 7 },
      { category_name: 'Dietary Key',       icon: '🏷️', slug: 'dietary-key',         color: '#F0FBF8', sortOrder: 8 },
    ];

    const categoryIdMap = {};

    console.log('🌱 Inserting 8 categories...');
    for (const cat of categories) {
      const [res] = await pool.query(
        'INSERT INTO menu_categories (category_name, icon, slug, color, sortOrder) VALUES (?, ?, ?, ?, ?)',
        [cat.category_name, cat.icon, cat.slug, cat.color, cat.sortOrder]
      );
      categoryIdMap[cat.category_name] = res.insertId;
      console.log(`   - Created category: ${cat.category_name} (ID: ${res.insertId})`);
    }

    // ── Reusable modifier sets ──────────────────────────────────────────────

    const breakfastAddons = [
      { name: 'Extra Bacon',       price: 3.00 },
      { name: 'Extra Pork Sausage',price: 3.00 },
      { name: 'Extra Egg',         price: 1.50 },
      { name: 'Extra Toast',       price: 1.00 },
      { name: 'Extra Avocado',     price: 2.50 },
      { name: 'Extra Hash Brown',  price: 1.50 },
      { name: 'TAKEAWAY',          price: 0.00 },
      { name: 'EAT IN',            price: 0.00 },
    ];

    const wrapAddons = [
      { name: 'Spinach Wrap Option',       price: 3.00 },
      { name: 'Gluten-Free Wrap Option',   price: 3.00 },
      { name: 'Extra Cheese',              price: 1.50 },
      { name: 'Extra Egg',                 price: 1.50 },
      { name: 'Extra Avocado',             price: 2.50 },
      { name: 'TAKEAWAY',                  price: 0.00 },
      { name: 'EAT IN',                    price: 0.00 },
    ];

    const wrapSizes = [{ name: 'Regular Size', price: 0.00 }];

    const riceBowlSizes = [
      { name: 'Rice Vermicelli', price: 0.00 },
      { name: 'Quinoa',          price: 5.00 },
    ];

    const riceBowlAddons = [
      { name: 'Extra Salads',              price: 1.50 },
      { name: 'Extra Red Pickled Cabbage', price: 1.50 },
      { name: 'Extra Avocado',             price: 2.50 },
      { name: 'TAKEAWAY',                  price: 0.00 },
      { name: 'EAT IN',                    price: 0.00 },
    ];

    // ── Items ───────────────────────────────────────────────────────────────

    const items = [

      // ── RICE BOWLS ────────────────────────────────────────────────────────
      {
        item_name: 'GRILLED LEMON GRASS CHICKEN',
        price: 15.50,
        image: '🍜',
        description: 'Grilled lemon grass chicken thighs in our house lemon grass marinade, extra salads and red pickled cabbage.',
        category: 'Rice Bowls',
        sizes: riceBowlSizes,
        addons: riceBowlAddons,
      },
      {
        item_name: 'PORK BELLY',
        price: 15.50,
        image: '🥩',
        description: 'Slow roasted pork belly, marinated in a soy and 5 spice blend, extra salads and red pickled cabbage.',
        category: 'Rice Bowls',
        sizes: riceBowlSizes,
        addons: riceBowlAddons,
      },
      {
        item_name: 'SALT AND PEPPER TOFU',
        price: 15.50,
        image: '🍲',
        description: 'Crispy 5 spice salt and pepper tofu, extra salads and red pickled cabbage.',
        category: 'Rice Bowls',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: riceBowlSizes,
        addons: riceBowlAddons,
      },

      // ── ENGLISH BREAKFAST ─────────────────────────────────────────────────
      {
        item_name: 'FULL ENGLISH BREAKFAST',
        price: 27.50,
        image: '🍳',
        description: 'Eggs your way, bacon, pork sausages, roasted tomatoes, mushrooms, house beans & sourdough.',
        category: 'English Breakfast',
        sizes: [{ name: 'Regular Portion', price: 0.00 }],
        addons: breakfastAddons,
      },
      {
        item_name: 'MINI ENGLISH',
        price: 19.50,
        image: '🍳',
        description: 'One egg, bacon or sausage, house beans & sourdough.',
        category: 'English Breakfast',
        sizes: [
          { name: 'Bacon Option',   price: 0.00 },
          { name: 'Sausage Option', price: 0.00 },
        ],
        addons: breakfastAddons,
      },
      {
        item_name: 'VEGETARIAN BREAKFAST',
        price: 24.00,
        image: '🥗',
        description: 'Eggs (optional), halloumi, avocado, mushrooms, roasted tomatoes, beans & sourdough.',
        category: 'English Breakfast',
        isVeg: 1,
        dietaryTags: 'V,VGO',
        sizes: [
          { name: 'With Eggs',              price: 0.00 },
          { name: 'No Eggs (Vegan Option)', price: 0.00 },
        ],
        addons: [
          { name: 'Extra Halloumi',   price: 3.00 },
          { name: 'Extra Avocado',    price: 2.50 },
          { name: 'Extra Hash Brown', price: 1.50 },
          { name: 'TAKEAWAY',         price: 0.00 },
          { name: 'EAT IN',           price: 0.00 },
        ],
      },
      {
        item_name: 'VEGAN BREAKFAST',
        price: 25.50,
        image: '🌱',
        description: 'Plant-based sausages, avocado, mushrooms, roasted tomatoes, beans, hash browns & sourdough.',
        category: 'English Breakfast',
        isVeg: 1,
        isVegan: 1,
        dietaryTags: 'VG',
        sizes: [{ name: 'Regular Portion', price: 0.00 }],
        addons: [
          { name: 'Extra Plant Sausage', price: 3.00 },
          { name: 'Extra Avocado',       price: 2.50 },
          { name: 'Extra Hash Brown',    price: 1.50 },
          { name: 'TAKEAWAY',            price: 0.00 },
          { name: 'EAT IN',             price: 0.00 },
        ],
      },

      // ── BREAKFAST WRAP ────────────────────────────────────────────────────
      {
        item_name: 'EGG WRAP',
        price: 14.50,
        image: '🌯',
        description: 'Soft wrap toasted with omelette, spinach, avo, tomatoes, sweet chilli, mayo.',
        category: 'Breakfast Wrap',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: wrapSizes,
        addons: wrapAddons,
      },
      {
        item_name: 'FALAFEL WRAP',
        price: 14.50,
        image: '🌯',
        description: 'Toasted wrap with layer of hummus, falafel balls, spinach, avo, tomatoes, sweet chilli, mayo.',
        category: 'Breakfast Wrap',
        isVeg: 1,
        isGlutenFree: 1,
        dietaryTags: 'V,GFO',
        sizes: wrapSizes,
        addons: wrapAddons,
      },
      {
        item_name: 'CHICKEN WRAP',
        price: 15.50,
        image: '🌯',
        description: 'Toasted wrap with cooked chicken, spinach, avo, tomatoes, sweet chilli, mayo.',
        category: 'Breakfast Wrap',
        sizes: wrapSizes,
        addons: [...wrapAddons, { name: 'Extra Chicken', price: 3.50 }],
      },
      {
        item_name: 'KATHI WRAP',
        price: 16.50,
        image: '🌯',
        description: 'Sautéed onion & capsicum green chutney, tomato ketchup. Choice of Protein.',
        category: 'Breakfast Wrap',
        isVeg: 1,
        isVegan: 1,
        isGlutenFree: 1,
        dietaryTags: 'GFO,V,VG',
        sizes: [
          { name: 'Potato',  price: 0.00 },
          { name: 'Paneer',  price: 0.00 },
          { name: 'Chicken', price: 0.00 },
          { name: 'Tofu',    price: 0.00 },
        ],
        addons: [
          { name: 'Spinach Wrap Option',     price: 3.00 },
          { name: 'Gluten-Free Wrap Option', price: 3.00 },
          { name: 'TAKEAWAY',                price: 0.00 },
          { name: 'EAT IN',                  price: 0.00 },
        ],
      },
      {
        item_name: 'GRILLED BURGER',
        price: 22.50,
        image: '🍔',
        description: "Veggie patty or grilled chicken schnitzel, lettuce, tomato, pickled onion, Gurkin's cucumber, cheese & house sauce in a milk bun. Served with chips.",
        category: 'Breakfast Wrap',
        dietaryTags: 'VGO',
        sizes: [
          { name: 'Veggie Patty',             price: 0.00 },
          { name: 'Grilled Chicken Schnitzel', price: 5.00 },
        ],
        addons: [
          { name: 'Extra Cheese', price: 1.50 },
          { name: 'Extra Bacon',  price: 3.00 },
          { name: 'TAKEAWAY',     price: 0.00 },
          { name: 'EAT IN',       price: 0.00 },
        ],
      },

      // ── CLASSICS ──────────────────────────────────────────────────────────
      {
        item_name: 'TOAST',
        price: 7.50,
        image: '🍞',
        description: 'Sourdough/Multigrain/Dark Rye. Served with butter, jam, peanut butter, honey or vegemite.',
        category: 'Classics',
        isVeg: 1,
        isVegan: 1,
        isGlutenFree: 1,
        dietaryTags: 'VG,GFO',
        sizes: [
          { name: 'Sourdough',  price: 0.00 },
          { name: 'Multigrain', price: 0.00 },
          { name: 'Dark Rye',   price: 0.00 },
        ],
        addons: [
          { name: 'Butter',             price: 0.00 },
          { name: 'Jam',                price: 0.00 },
          { name: 'Peanut Butter',      price: 0.00 },
          { name: 'Honey',              price: 0.00 },
          { name: 'Vegemite',           price: 0.00 },
          { name: 'Fruit Toast Option', price: 2.00 },
          { name: 'Gluten-Free Bread',  price: 2.00 },
        ],
      },
      {
        item_name: 'AVO TOAST',
        price: 22.50,
        image: '🥑',
        description: 'Egg, smashed avocado, beetroot hummus, cherry tomatoes, micro herbs, vegan feta, walnut dukkah & sweet potato crisps.',
        category: 'Classics',
        isVeg: 1,
        isGlutenFree: 1,
        dietaryTags: 'V,GFO',
        sizes: [{ name: 'Regular Size', price: 0.00 }],
        addons: [
          { name: 'Extra Egg',             price: 3.00 },
          { name: 'Extra Beetroot Hummus', price: 1.50 },
          { name: 'Gluten-Free Option',    price: 2.00 },
        ],
      },
      {
        item_name: 'BREKKIE ROLL',
        price: 16.50,
        image: '🍳',
        description: 'Bacon, fried eggs, cheddar, aioli, rocket & tomato relish on Turkish bread.',
        category: 'Classics',
        isGlutenFree: 1,
        dietaryTags: 'GFO,VGO',
        sizes: [{ name: 'Regular Portion', price: 0.00 }],
        addons: [
          { name: 'Add Hash Brown',     price: 4.00 },
          { name: 'Gluten-Free Option', price: 2.00 },
          { name: 'Vegan Option',       price: 0.00 },
        ],
      },
      {
        item_name: 'POTATO HASH STACK',
        price: 24.50,
        image: '🥔',
        description: 'Potato hash, halloumi, smash avo, poached egg, hollandaise sauce, dukkah.',
        category: 'Classics',
        sizes: [{ name: 'Regular Portion', price: 0.00 }],
        addons: [
          { name: 'Extra Halloumi',    price: 3.00 },
          { name: 'Extra Poached Egg', price: 3.00 },
        ],
      },
      {
        item_name: 'SMOKED SALMON BUBBLE SQUEEZE HASH STACK',
        price: 22.50,
        image: '🍣',
        description: 'Smoked salmon, veggie hash, cherry tomatoes, beetroot hummus, micro herbs.',
        category: 'Classics',
        sizes: [{ name: 'Regular Portion', price: 0.00 }],
        addons: [{ name: 'Add Egg', price: 3.00 }],
      },
      {
        item_name: 'SMASHED AVO CROISSANT',
        price: 18.50,
        image: '🥐',
        description: 'Toasted croissant with smashed avo, garnished with chilli flakes.',
        category: 'Classics',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [{ name: 'Regular Size', price: 0.00 }],
      },
      {
        item_name: 'CHILLI SCRAMBLED EGGS CROISSANT',
        price: 23.50,
        image: '🥐',
        description: 'Toasted croissant with chilli scrambled eggs, feta, cherry tomatoes, pickle onion and garnished with parsley and chives.',
        category: 'Classics',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [{ name: 'Regular Size', price: 0.00 }],
      },
      {
        item_name: 'BRUSCHETTA',
        price: 20.00,
        image: '🥖',
        description: 'Toasted multigrain bread with garlic butter, cherry tomatoes, avo, homemade pesto, Bocchini cheese, fresh basil.',
        category: 'Classics',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [{ name: 'Regular Size', price: 0.00 }],
        addons: [{ name: 'Add Egg', price: 3.00 }],
      },
      {
        item_name: 'NACHOS',
        price: 16.50,
        image: '🍟',
        description: 'Nacho with mozzarella cheese, crispy bacon, guacamole, sour cream with spicy sauce.',
        category: 'Classics',
        sizes: [{ name: 'Regular Portion', price: 0.00 }],
      },
      {
        item_name: 'LOADED FRIES',
        price: 15.50,
        image: '🍟',
        description: 'Crispy Potato fries with mozzarella cheese, crispy bacon, with spicy sauce.',
        category: 'Classics',
        sizes: [{ name: 'Regular Portion', price: 0.00 }],
      },

      // ── BAHN-MI-BAGUETTES ─────────────────────────────────────────────────
      {
        item_name: 'GRILLED LEMON GRASS CHICKEN',
        price: 12.50,
        image: '🥖',
        description: 'Grilled lemon grass chicken thighs in our house lemon grass marinade, extra salads and red pickled cabbage, hoisin sauce.',
        category: 'BAHN-MI-BAGUETTES',
        sizes: [{ name: 'Regular Baguette', price: 0.00 }],
        addons: [
          { name: 'Extra Salads',              price: 1.50 },
          { name: 'Extra Red Pickled Cabbage', price: 1.50 },
          { name: 'Extra Hoisin Sauce',        price: 0.50 },
          { name: 'TAKEAWAY',                  price: 0.00 },
          { name: 'EAT IN',                    price: 0.00 },
        ],
      },
      {
        item_name: 'PORK BELLY',
        price: 12.50,
        image: '🥖',
        description: 'Slow roasted pork belly marinated in a soy and 5 spice blends, extra salads and red pickled cabbage, hoisin sauce.',
        category: 'BAHN-MI-BAGUETTES',
        sizes: [{ name: 'Regular Baguette', price: 0.00 }],
        addons: [
          { name: 'Extra Salads',              price: 1.50 },
          { name: 'Extra Red Pickled Cabbage', price: 1.50 },
          { name: 'Extra Hoisin Sauce',        price: 0.50 },
          { name: 'TAKEAWAY',                  price: 0.00 },
          { name: 'EAT IN',                    price: 0.00 },
        ],
      },
      {
        item_name: 'SALT AND PEPPER TOFU',
        price: 12.50,
        image: '🥖',
        description: 'Crispy 5 spice salt and pepper tofu, extra salads and red pickled cabbage, hoisin sauce.',
        category: 'BAHN-MI-BAGUETTES',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [{ name: 'Regular Baguette', price: 0.00 }],
        addons: [
          { name: 'Extra Salads',              price: 1.50 },
          { name: 'Extra Red Pickled Cabbage', price: 1.50 },
          { name: 'Extra Hoisin Sauce',        price: 0.50 },
          { name: 'TAKEAWAY',                  price: 0.00 },
          { name: 'EAT IN',                    price: 0.00 },
        ],
      },

      // ── LIGHT & SWEET ─────────────────────────────────────────────────────
      {
        item_name: 'CROISSANT',
        price: 7.50,
        image: '🥐',
        description: 'Buttery French croissant served with your choice of Cream, Nutella, or Apricot jam.',
        category: 'LIGHT & SWEET',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [{ name: 'Regular Croissant', price: 0.00 }],
        addons: [
          { name: 'Cream',       price: 0.00 },
          { name: 'Nutella',     price: 0.00 },
          { name: 'Apricot Jam', price: 0.00 },
          { name: 'TAKEAWAY',    price: 0.00 },
          { name: 'EAT IN',      price: 0.00 },
        ],
      },
      {
        item_name: 'CARROT CAKE',
        price: 5.50,
        image: '🍰',
        description: 'Spiced cake loaded with carrots, nuts, and frosted with cream cheese.',
        category: 'LIGHT & SWEET',
        isGlutenFree: 1,
        dietaryTags: 'GFO',
        sizes: [{ name: 'Regular Slice', price: 0.00 }],
        addons: [
          { name: 'Gluten-Free Option', price: 0.00 },
          { name: 'TAKEAWAY',           price: 0.00 },
          { name: 'EAT IN',             price: 0.00 },
        ],
      },
      {
        item_name: 'PANCAKE',
        price: 16.50,
        image: '🥞',
        description: 'Honey / Maple drizzle on pancake with berries.',
        category: 'LIGHT & SWEET',
        sizes: [
          { name: 'With Honey',        price: 0.00 },
          { name: 'With Maple Drizzle', price: 0.00 },
        ],
        addons: [
          { name: 'Extra Berries',       price: 2.50 },
          { name: 'Extra Whipped Cream', price: 1.00 },
          { name: 'TAKEAWAY',            price: 0.00 },
          { name: 'EAT IN',             price: 0.00 },
        ],
      },

      // ── SIDES ─────────────────────────────────────────────────────────────
      {
        item_name: 'HASH BROWN',
        price: 4.00,
        image: '🥔',
        description: 'Golden crispy hash brown, perfectly seasoned and fried to perfection.',
        category: 'Sides',
        sizes: [{ name: 'Single', price: 0.00 }, { name: 'Double', price: 3.50 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'BACON',
        price: 4.00,
        image: '🥓',
        description: 'Crispy streaky bacon rashers, grilled to golden perfection.',
        category: 'Sides',
        sizes: [{ name: '2 Rashers', price: 0.00 }, { name: '4 Rashers', price: 3.50 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'PORK SAUSAGE',
        price: 4.00,
        image: '🌭',
        description: 'Juicy, seasoned pork sausages grilled until beautifully caramelised.',
        category: 'Sides',
        sizes: [{ name: '1 Sausage', price: 0.00 }, { name: '2 Sausages', price: 3.50 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'EGGS YOUR WAY',
        price: 4.00,
        image: '🍳',
        description: 'Farm-fresh eggs cooked exactly as you like — poached, scrambled, or fried.',
        category: 'Sides',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [
          { name: 'Poached',   price: 0.00 },
          { name: 'Scrambled', price: 0.00 },
          { name: 'Fried',     price: 0.00 },
        ],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'SMASHED AVOCADO',
        price: 5.50,
        image: '🥑',
        description: 'Freshly smashed avocado with a squeeze of lemon and a pinch of chilli flakes.',
        category: 'Sides',
        isVeg: 1,
        isVegan: 1,
        dietaryTags: 'V,VG',
        sizes: [{ name: 'Regular', price: 0.00 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'ROASTED TOMATOES',
        price: 3.50,
        image: '🍅',
        description: 'Oven-roasted vine tomatoes with olive oil, garlic and fresh herbs.',
        category: 'Sides',
        isVeg: 1,
        isVegan: 1,
        dietaryTags: 'V,VG',
        sizes: [{ name: 'Regular', price: 0.00 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'SAUTÉED MUSHROOMS',
        price: 4.00,
        image: '🍄',
        description: 'Pan-fried button mushrooms in garlic butter with fresh thyme.',
        category: 'Sides',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [{ name: 'Regular', price: 0.00 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'HOUSE BEANS',
        price: 3.50,
        image: '🫘',
        description: 'Slow-cooked house baked beans in a rich tomato and herb sauce.',
        category: 'Sides',
        isVeg: 1,
        isVegan: 1,
        dietaryTags: 'V,VG',
        sizes: [{ name: 'Regular', price: 0.00 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'SOURDOUGH TOAST',
        price: 3.50,
        image: '🍞',
        description: 'Thick sliced sourdough toasted and served with butter.',
        category: 'Sides',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [
          { name: 'Sourdough',   price: 0.00 },
          { name: 'Multigrain',  price: 0.00 },
          { name: 'Gluten-Free', price: 1.50 },
        ],
        addons: [
          { name: 'Butter',   price: 0.00 },
          { name: 'Jam',      price: 0.00 },
          { name: 'TAKEAWAY', price: 0.00 },
          { name: 'EAT IN',   price: 0.00 },
        ],
      },
      {
        item_name: 'CHIPS / FRIES',
        price: 5.50,
        image: '🍟',
        description: 'Golden crispy chips seasoned with sea salt, served with your choice of sauce.',
        category: 'Sides',
        isVeg: 1,
        isVegan: 1,
        dietaryTags: 'V,VG',
        sizes: [{ name: 'Regular', price: 0.00 }, { name: 'Large', price: 2.50 }],
        addons: [
          { name: 'Tomato Sauce', price: 0.00 },
          { name: 'Aioli',        price: 0.00 },
          { name: 'Sweet Chilli', price: 0.00 },
          { name: 'TAKEAWAY',     price: 0.00 },
          { name: 'EAT IN',       price: 0.00 },
        ],
      },
      {
        item_name: 'HALLOUMI',
        price: 5.00,
        image: '🧀',
        description: 'Pan-fried halloumi slices, golden on the outside with a soft, squeaky centre.',
        category: 'Sides',
        isVeg: 1,
        dietaryTags: 'V',
        sizes: [{ name: 'Regular', price: 0.00 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },
      {
        item_name: 'SMOKED SALMON',
        price: 7.00,
        image: '🍣',
        description: 'Premium cold-smoked Atlantic salmon with lemon and capers.',
        category: 'Sides',
        sizes: [{ name: 'Regular', price: 0.00 }],
        addons: [{ name: 'TAKEAWAY', price: 0.00 }, { name: 'EAT IN', price: 0.00 }],
      },

      // ── DIETARY KEY (reference / legend) ──────────────────────────────────
      {
        item_name: 'VG – Vegan',
        price: 0.00,
        image: '🌱',
        description: 'This dish is 100% plant-based — no animal products whatsoever. Suitable for vegans.',
        category: 'Dietary Key',
        isVeg: 1,
        isVegan: 1,
        dietaryTags: 'VG',
      },
      {
        item_name: 'V – Vegetarian',
        price: 0.00,
        image: '🥗',
        description: 'This dish contains no meat or fish. May include eggs and dairy. Suitable for vegetarians.',
        category: 'Dietary Key',
        isVeg: 1,
        dietaryTags: 'V',
      },
      {
        item_name: 'GFO – Gluten-Free Option Available',
        price: 0.00,
        image: '🌾',
        description: 'A gluten-free alternative is available for this dish. Please inform staff of your dietary requirement.',
        category: 'Dietary Key',
        isGlutenFree: 1,
        dietaryTags: 'GFO',
      },
      {
        item_name: 'VGO – Vegan Option Available',
        price: 0.00,
        image: '🌿',
        description: 'A vegan alternative is available for this dish. Please inform staff of your dietary requirement.',
        category: 'Dietary Key',
        isVeg: 1,
        isVegan: 1,
        dietaryTags: 'VGO',
      },

    ]; // end items

    console.log('🌱 Inserting menu items...');
    for (const item of items) {
      const catId = categoryIdMap[item.category];
      if (!catId) {
        console.warn(`⚠️  Skipping "${item.item_name}" — category "${item.category}" not found!`);
        continue;
      }

      const sizesStr       = item.sizes    ? JSON.stringify(item.sizes)  : null;
      const addonsStr      = item.addons   ? JSON.stringify(item.addons) : null;
      const itemSlug       = item.item_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const isVeg          = item.isVeg         || 0;
      const isVegan        = item.isVegan       || 0;
      const isGlutenFree   = item.isGlutenFree  || 0;
      const dietaryTags    = item.dietaryTags   || '';

      await pool.query(
        `INSERT INTO menu_items
         (item_name, category_id, price, image, description, availability, rating, popular, slug, sizes, addons, isVeg, isVegan, isGlutenFree, dietaryTags)
         VALUES (?, ?, ?, ?, ?, "In Stock", 5.0, 0, ?, ?, ?, ?, ?, ?, ?)`,
        [item.item_name, catId, item.price, item.image, item.description,
         itemSlug, sizesStr, addonsStr, isVeg, isVegan, isGlutenFree, dietaryTags]
      );
    }

    console.log('🚀 Seeding complete! 8 categories + all items inserted successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
})();
