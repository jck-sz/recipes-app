/**
 * Apply Database Performance Indexes
 * Node.js script to apply performance indexes to the database
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function applyIndexes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Connecting to database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', '..', 'migrations', 'performance_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying performance indexes...');
    
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement) {
        try {
          await pool.query(trimmedStatement);
          console.log(`✓ Executed: ${trimmedStatement.substring(0, 50)}...`);
        } catch (error) {
          // Some indexes might already exist, that's okay
          if (error.message.includes('already exists')) {
            console.log(`⚠ Already exists: ${trimmedStatement.substring(0, 50)}...`);
          } else {
            console.error(`✗ Error executing: ${trimmedStatement.substring(0, 50)}...`);
            console.error(`  Error: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n✅ Performance indexes application completed!');
    console.log('Database performance should be improved for common query patterns.');
    
  } catch (error) {
    console.error('❌ Error applying indexes:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  applyIndexes().catch(console.error);
}

module.exports = applyIndexes;
