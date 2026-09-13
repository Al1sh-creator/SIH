// server/routes/admin.js

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth, requireAdmin } = require('../middleware/auth');

// Apply auth and requireAdmin to all routes in this file
router.use(auth);
router.use(requireAdmin);

// ==============================================
// GET /api/admin/stats
// ==============================================
router.get('/stats', async (req, res, next) => {
    try {
        const usersCountRes = await pool.query('SELECT COUNT(*) FROM users');
        const farmsCountRes = await pool.query('SELECT COUNT(*) FROM farms');
        const alertsCountRes = await pool.query('SELECT COUNT(*) FROM alerts');

        const cropsRes = await pool.query(`
            SELECT current_crop as name, COUNT(*) as count 
            FROM farms 
            WHERE current_crop IS NOT NULL AND current_crop != ''
            GROUP BY current_crop
            ORDER BY count DESC
        `);

        res.json({
            success: true,
            stats: {
                totalUsers: parseInt(usersCountRes.rows[0].count, 10),
                totalFarms: parseInt(farmsCountRes.rows[0].count, 10),
                totalAlerts: parseInt(alertsCountRes.rows[0].count, 10),
                crops: cropsRes.rows.map(row => ({ name: row.name, count: parseInt(row.count, 10) }))
            }
        });
    } catch (err) {
        next(err);
    }
});

// ==============================================
// GET /api/admin/users
// ==============================================
router.get('/users', async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, u.name, u.email, u.phone, u.profile_completed, u.created_at, u.is_admin,
                f.id as farm_id, f.farm_name, f.state, f.current_crop
            FROM users u
            LEFT JOIN farms f ON u.id = f.user_id
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            users: result.rows
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;

// ==============================================
// DELETE /api/admin/users/:id
// ==============================================
router.delete('/users/:id', async (req, res, next) => {
    try {
        const targetId = req.params.id;
        if (targetId == req.user.id) {
            return res.status(400).json({ success: false, error: "You cannot delete yourself." });
        }
        
        await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        next(err);
    }
});

// ==============================================
// POST /api/admin/broadcast
// ==============================================
router.post('/broadcast', async (req, res, next) => {
    try {
        const { message, severity = 'info' } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: "Message is required." });
        }

        // Get all farms to attach the alert to
        const farmsRes = await pool.query('SELECT id, user_id FROM farms');
        const farms = farmsRes.rows;

        // Insert alert for each farm
        if (farms.length > 0) {
            let queryVals = [];
            let queryParams = [];
            let i = 1;

            for (const farm of farms) {
                queryVals.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
                queryParams.push(
                    farm.id,
                    'system',
                    severity,
                    'System Broadcast',
                    message
                );
            }

            await pool.query(`
                INSERT INTO alerts (farm_id, alert_type, severity, title, message)
                VALUES ${queryVals.join(', ')}
            `, queryParams);
        }

        // Emit Socket.io event globally
        const io = req.app.get('io');
        if (io) {
            io.emit('broadcast', {
                title: 'System Broadcast',
                message: message,
                severity: severity
            });
        }

        res.json({ success: true, message: `Broadcast sent to ${farms.length} users.` });
    } catch (err) {
        next(err);
    }
});

// ==============================================
// GET /api/admin/inspections
// ==============================================
router.get('/inspections', async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.*, 
                u.name as user_name, u.phone, 
                f.farm_name, f.district
            FROM soil_inspections i
            JOIN users u ON i.user_id = u.id
            JOIN farms f ON i.farm_id = f.id
            ORDER BY CASE WHEN i.status = 'pending' THEN 1 WHEN i.status = 'scheduled' THEN 2 ELSE 3 END, i.created_at DESC
        `);
        res.json({ success: true, inspections: result.rows });
    } catch (err) {
        next(err);
    }
});

// ==============================================
// PUT /api/admin/inspections/:id
// ==============================================
router.put('/inspections/:id', async (req, res, next) => {
    try {
        const status = req.body.status || null;
        const scheduled_date = req.body.scheduled_date || null;
        
        
        const result = await pool.query(`
            UPDATE soil_inspections 
            SET status = COALESCE($1, status),
                scheduled_date = COALESCE($2, scheduled_date)
            WHERE id = $3
            RETURNING *
        `, [status, scheduled_date, req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Inspection not found' });
        }

        // Notify user about status change
        const inspection = result.rows[0];
        let msg = '';
        if (status === 'scheduled') {
            msg = `Your soil inspection has been scheduled for ${new Date(inspection.scheduled_date).toLocaleDateString()}.`;
        } else if (status === 'completed') {
            msg = `Your soil inspection is marked as completed! Check your profile for the latest data.`;
        }

        if (msg) {
            await pool.query(`
                INSERT INTO alerts (farm_id, alert_type, severity, title, message)
                VALUES ($1, 'system', 'info', 'Inspection Update', $2)
            `, [inspection.farm_id, msg]);
            
            const io = req.app.get('io');
            if (io) io.to(`farm_${inspection.farm_id}`).emit('new_alert', { title: 'Inspection Update', message: msg });
        }

        res.json({ success: true, inspection });
    } catch (err) {
        console.error("Error updating inspection:", err);
        next(err);
    }
});
