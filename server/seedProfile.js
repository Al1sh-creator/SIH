const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seedData() {
    try {
        console.log('Seeding data...');
        
        // 1. Create a user
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        const userRes = await pool.query(
            `INSERT INTO users (name, email, phone, password, profile_completed) 
             VALUES ($1, $2, $3, $4, true) 
             ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
             RETURNING id`,
            ['AI Test User', 'test@farmsense.ai', '1234567890', hashedPassword]
        );
        
        const userId = userRes.rows[0].id;
        console.log(`Created/Updated User with ID: ${userId} (test@farmsense.ai / password123)`);

        // 2. Delete existing farms for this user to start fresh
        await pool.query(`DELETE FROM farms WHERE user_id = $1`, [userId]);

        // 3. Create a comprehensive farm profile
        const farmRes = await pool.query(
            `INSERT INTO farms (
                user_id, farm_name, country, state, district, taluka, village, pincode,
                latitude, longitude, farm_area, area_unit, soil_type, irrigation_type, water_source,
                npk_nitrogen, npk_phosphorus, npk_potassium, ph_level,
                current_crop, current_season
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19,
                $20, $21
            ) RETURNING id`,
            [
                userId, 'Gujarat Model Farm', 'India', 'Gujarat', 'Ahmedabad', 'Sanand', 'Sanand', '382110',
                22.9833, 72.3833, 10, 'acre', 'loamy', 'drip', 'borewell',
                45, 30, 40, 6.8, // N, P, K, pH
                'cotton', 'Kharif'
            ]
        );
        
        const farmId = farmRes.rows[0].id;
        console.log(`Created Farm with ID: ${farmId}`);

        // 4. Create some fields
        await pool.query(
            `INSERT INTO fields (farm_id, field_name, field_size, current_crop, crop_stage, status) VALUES 
             ($1, 'North Block', 5, 'cotton', 'vegetative', 'planted'),
             ($1, 'South Block', 5, 'mungbean', 'flowering', 'planted')`,
            [farmId]
        );
        
        console.log('Created Fields');
        
        console.log('Seeding Complete! You can now login with test@farmsense.ai / password123');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seedData();
