require('dotenv').config();
const pool = require('./config/db');

async function setAdmin() {
  try {
    // Find matching users
    const match = await pool.query(`SELECT id, name, email FROM users WHERE name ILIKE '%memoir%' OR name ILIKE '%patel%' OR email ILIKE '%memoir%'`);
    console.log('Matches:', match.rows);
    
    // Revoke admin from everyone
    await pool.query('UPDATE users SET is_admin = FALSE');
    console.log('Revoked admin from all users.');
    
    // Set admin for the specific user (assuming memoir015@gmail.com or similar)
    const updateRes = await pool.query(`
      UPDATE users 
      SET is_admin = TRUE 
      WHERE email = 'memoir015@gmail.com' OR name ILIKE '%memoir patel%'
      RETURNING id, name, email
    `);
    
    if (updateRes.rows.length > 0) {
      console.log('Successfully set admin to:', updateRes.rows);
    } else {
      console.log('Could not find user Memoir Patel. Trying just Memoir...');
      const fallback = await pool.query(`
        UPDATE users 
        SET is_admin = TRUE 
        WHERE name ILIKE '%memoir%'
        RETURNING id, name, email
      `);
      console.log('Fallback admin set to:', fallback.rows);
    }
    
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
setAdmin();
