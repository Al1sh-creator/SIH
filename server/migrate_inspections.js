require('dotenv').config();
const pool = require('./config/db');

async function migrate() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS soil_inspections (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                farm_id INT REFERENCES farms(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending',
                preferred_date DATE,
                scheduled_date DATE,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created soil_inspections table successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
migrate();
