const pool = require('./config/db');
(async () => {
  try {
    const res = await pool.query('UPDATE soil_inspections SET status = COALESCE($1, status), scheduled_date = COALESCE($2, scheduled_date) WHERE id = 1 RETURNING *', ['completed', null]);
    console.log('Success:', res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
})();
