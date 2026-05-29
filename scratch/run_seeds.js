const { execSync } = require('child_process');
const path = require('path');

const scripts = [
  'seed_premium_menu.js',
  'add_parent_category.js',
  'add_tea_category.js',
  'add_milkshakes_category.js',
  'add_smoothies_category.js',
  'add_cold_beverages_category.js',
  'add_affogato_category.js',
  'add_flavoured_iced_long_black_category.js',
  'add_iced_matcha_category.js',
  'add_fresh_juice_category.js'
];

console.log('🚀 Starting full database menu seeding process...\n');

for (const script of scripts) {
  const scriptPath = path.join(__dirname, '..', script);
  console.log(`Executing: node ${script}`);
  try {
    const output = execSync(`node "${scriptPath}"`, { encoding: 'utf-8' });
    console.log(output);
  } catch (err) {
    console.error(`❌ Error executing ${script}:`, err.message);
    process.exit(1);
  }
}

console.log('🎉 All seeding scripts completed successfully! The database is fully restored.');
process.exit(0);
