#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests if the database connection works with current environment variables
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../docker/.env' });

async function testConnection() {
    console.log('🔍 Testing Database Connection...');
    console.log('================================');
    
    const config = {
        user: process.env.APP_DB_USER || 'recipes_user',
        password: process.env.APP_DB_PASSWORD,
        host: 'localhost',
        port: 5432,
        database: process.env.POSTGRES_DB || 'fodmap_db',
        ssl: false
    };
    
    console.log(`📋 Connection Config:`);
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${config.password ? '***' + config.password.slice(-3) : 'NOT SET'}`);
    console.log('');
    
    const pool = new Pool(config);
    
    try {
        console.log('🔄 Attempting connection...');
        const client = await pool.connect();
        
        console.log('✅ Connection successful!');
        
        // Test basic query
        const result = await client.query('SELECT NOW() as current_time, current_user, current_database()');
        console.log('📊 Database Info:');
        console.log(`   Current Time: ${result.rows[0].current_time}`);
        console.log(`   Current User: ${result.rows[0].current_user}`);
        console.log(`   Current Database: ${result.rows[0].current_database}`);
        
        // Test table access
        try {
            const tables = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            `);
            
            console.log('📋 Available Tables:');
            if (tables.rows.length > 0) {
                tables.rows.forEach(row => {
                    console.log(`   - ${row.table_name}`);
                });
            } else {
                console.log('   No tables found (database may need initialization)');
            }
        } catch (error) {
            console.log('⚠️ Could not list tables:', error.message);
        }
        
        client.release();
        console.log('');
        console.log('🎉 Database connection test PASSED!');
        
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        console.log('');
        console.log('💡 Troubleshooting:');
        console.log('   1. Make sure Docker containers are running');
        console.log('   2. Check if database user was created properly');
        console.log('   3. Verify environment variables in docker/.env');
        console.log('   4. Try: docker-compose down -v && docker-compose up -d');
        process.exit(1);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    testConnection().catch(console.error);
}

module.exports = { testConnection };
