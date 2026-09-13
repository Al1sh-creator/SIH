require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
  try {
    console.log('Adding is_admin column...');
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`);
    console.log('Setting existing users to admin...');
    await pool.query(`UPDATE users SET is_admin = TRUE`); // For now, elevate all existing to admin
    console.log('Done!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();
