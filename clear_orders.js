const pool = require('./src/database/connection');

async function clearAllOrders() {
    try {
        console.log('Starting total cleanup of all orders, tickets, carts, and table statuses...');
        
        // 1. Disable Foreign Key Checks to avoid any constraint issues during truncate/delete
        await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        // 2. Truncate/Delete dependent tables
        console.log('Truncating order_items...');
        await pool.execute('TRUNCATE TABLE order_items');
        
        console.log('Truncating kitchen_tickets...');
        await pool.execute('TRUNCATE TABLE kitchen_tickets');
        
        console.log('Truncating cart_items...');
        await pool.execute('TRUNCATE TABLE cart_items');
        
        console.log('Truncating carts...');
        await pool.execute('TRUNCATE TABLE carts');
        
        console.log('Truncating orders...');
        await pool.execute('TRUNCATE TABLE orders');
        
        console.log('Truncating notifications...');
        await pool.execute('TRUNCATE TABLE notifications');
        
        // 3. Reset restaurant tables status to available
        console.log('Resetting all restaurant tables to "available" status...');
        await pool.execute("UPDATE restaurant_tables SET status = 'available'");
        
        // 4. Re-enable Foreign Key Checks
        await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('Cleanup completed successfully! All orders, carts, and kitchen tickets are completely cleared from the database, and all tables have been reset to available.');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

clearAllOrders();
