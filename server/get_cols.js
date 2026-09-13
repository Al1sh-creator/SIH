require('dotenv').config();
const pool = require('./config/db');

async function getCols() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
getCols();
