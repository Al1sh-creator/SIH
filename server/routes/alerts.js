// server/routes/alerts.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../config/db');
const { auth, requireProfile } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { sendAlertEmail, sendAlertSMS } = require('../services/notifier');

// ==============================================
// GET /api/alerts
// Get active (unread) alerts for farm
// ==============================================
router.get('/', auth, requireProfile, async (req, res, next) => {
    try {
        // Get farm_id for this user
        const farmResult = await pool.query(
            'SELECT id FROM farms WHERE user_id = $1',
            [req.user.id]
        );

        if (farmResult.rows.length === 0) {
            throw new AppError('Farm not found', 404);
        }

        const farmId = farmResult.rows[0].id;

        // Query filters
        const { severity, type, limit = 20 } = req.query;

        let query = `
            SELECT
                id,
                alert_type,
                severity,
                title,
                message,
                alert_date,
                is_read,
                is_sent_email,
                is_sent_sms,
                created_at
            FROM alerts
            WHERE farm_id = $1
              AND is_read = FALSE
        `;

        const params = [farmId];

        // Optional severity filter
        // e.g. GET /api/alerts?severity=critical
        if (severity) {
            params.push(severity);
            query += ` AND severity = $${params.length}`;
        }

        // Optional type filter
        // e.g. GET /api/alerts?type=heavy_rain
        if (type) {
            params.push(type);
            query += ` AND alert_type = $${params.length}`;
        }

        query += ` ORDER BY
                    CASE severity
                        WHEN 'critical' THEN 1
                        WHEN 'warning'  THEN 2
                        WHEN 'positive' THEN 3
                        ELSE 4
                    END,
                    created_at DESC
                   LIMIT $${params.length + 1}`;

        params.push(limit);

        const result = await pool.query(query, params);

        // Count by severity
        const countResult = await pool.query(
            `SELECT
                severity,
                COUNT(*) as count
             FROM alerts
             WHERE farm_id = $1 AND is_read = FALSE
             GROUP BY severity`,
            [farmId]
        );

        const counts = { critical: 0, warning: 0, positive: 0 };
        countResult.rows.forEach(row => {
            counts[row.severity] = parseInt(row.count);
        });

        res.json({
            success: true,
            total_unread: result.rows.length,
            counts,
            alerts: result.rows
        });

    } catch (err) {
        next(err);
    }
});

// ==============================================
// GET /api/alerts/history
// Get all past alerts (read + unread)
// ==============================================
router.get('/history', auth, requireProfile, async (req, res, next) => {
    try {
        const farmResult = await pool.query(
            'SELECT id FROM farms WHERE user_id = $1',
            [req.user.id]
        );

        if (farmResult.rows.length === 0) {
            throw new AppError('Farm not found', 404);
        }

        const farmId = farmResult.rows[0].id;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT
                id,
                alert_type,
                severity,
                title,
                message,
                alert_date,
                is_read,
                created_at
             FROM alerts
             WHERE farm_id = $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [farmId, limit, offset]
        );

        // Total count for pagination
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM alerts WHERE farm_id = $1',
            [farmId]
        );

        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            total_pages: Math.ceil(total / limit),
            alerts: result.rows
        });

    } catch (err) {
        next(err);
    }
});

// ==============================================
// PUT /api/alerts/:alertId/read
// Mark single alert as read
// ==============================================
router.put('/:alertId/read', auth, requireProfile, async (req, res, next) => {
    try {
        const { alertId } = req.params;

        // Verify alert belongs to this user's farm
        const check = await pool.query(
            `SELECT a.id FROM alerts a
             JOIN farms f ON f.id = a.farm_id
             WHERE a.id = $1 AND f.user_id = $2`,
            [alertId, req.user.id]
        );

        if (check.rows.length === 0) {
            throw new AppError('Alert not found or access denied', 404);
        }

        await pool.query(
            `UPDATE alerts
             SET is_read = TRUE
             WHERE id = $1`,
            [alertId]
        );

        res.json({
            success: true,
            message: 'Alert marked as read'
        });

    } catch (err) {
        next(err);
    }
});

// ==============================================
// PUT /api/alerts/read-all
// Mark ALL alerts as read
// ==============================================
router.put('/read-all', auth, requireProfile, async (req, res, next) => {
    try {
        const farmResult = await pool.query(
            'SELECT id FROM farms WHERE user_id = $1',
            [req.user.id]
        );

        if (farmResult.rows.length === 0) {
            throw new AppError('Farm not found', 404);
        }

        const result = await pool.query(
            `UPDATE alerts
             SET is_read = TRUE
             WHERE farm_id = $1
               AND is_read = FALSE`,
            [farmResult.rows[0].id]
        );

        res.json({
            success: true,
            message: `${result.rowCount} alerts marked as read`
        });

    } catch (err) {
        next(err);
    }
});

// ==============================================
// POST /api/alerts/demo
// Generate alerts from REAL weather forecast
// ==============================================
router.post('/demo', auth, async (req, res, next) => {
    try {
        // 1. Get user's farm (location + id)
        const farmResult = await pool.query(
            'SELECT id, latitude, longitude, district, state FROM farms WHERE user_id = $1',
            [req.user.id]
        );

        if (farmResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No farm found. Please complete your farm profile first.' });
        }

        const farm = farmResult.rows[0];

        if (!farm.latitude || !farm.longitude) {
            return res.status(400).json({
                success: false,
                error: 'Farm coordinates not set. Please update your farm location in Farm Profile.'
            });
        }

        // 2. Fetch real weather from Open-Meteo
        const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: farm.latitude,
                longitude: farm.longitude,
                daily: [
                    'temperature_2m_max',
                    'temperature_2m_min',
                    'precipitation_sum',
                    'relative_humidity_2m_max',
                    'windspeed_10m_max',
                ].join(','),
                forecast_days: 7,
                timezone: 'Asia/Kolkata',
            },
            timeout: 10000
        });

        const daily = weatherRes.data.daily;
        const days = daily.time.map((date, i) => ({
            date,
            temp_max:    daily.temperature_2m_max[i],
            temp_min:    daily.temperature_2m_min[i],
            rainfall_mm: daily.precipitation_sum[i] || 0,
            humidity:    daily.relative_humidity_2m_max[i],
            wind_kmh:    daily.windspeed_10m_max[i],
        }));

        // 3. Run same alert logic as dashboard weather route
        const alertsToInsert = [];
        const seen = new Set();

        for (const day of days) {
            if (day.rainfall_mm > 50 && !seen.has('heavy_rain')) {
                alertsToInsert.push({ type: 'heavy_rain', severity: 'critical',
                    title: `🌧️ Heavy Rain Alert — ${day.rainfall_mm}mm`,
                    message: `${day.rainfall_mm}mm of heavy rainfall expected on ${day.date} in ${farm.district}. Avoid fertilizer or pesticide application. Ensure proper field drainage to prevent waterlogging.`,
                    date: day.date });
                seen.add('heavy_rain');
            }
            if (day.temp_max > 42 && !seen.has('heatwave')) {
                alertsToInsert.push({ type: 'heatwave', severity: 'critical',
                    title: `🔥 Heatwave Alert — ${day.temp_max}°C`,
                    message: `Extreme temperature of ${day.temp_max}°C forecast on ${day.date}. Irrigate early morning (6-8 AM only). Avoid afternoon field work. Cover young seedlings.`,
                    date: day.date });
                seen.add('heatwave');
            }
            if (day.humidity > 85 && day.temp_max > 22 && day.temp_max < 32 && !seen.has('fungal_risk')) {
                alertsToInsert.push({ type: 'fungal_risk', severity: 'warning',
                    title: `🍄 High Fungal Disease Risk`,
                    message: `Humidity at ${day.humidity}% with ${day.temp_max}°C on ${day.date} — ideal for fungal outbreaks. Consider preventive neem oil or copper fungicide spray on your crop.`,
                    date: day.date });
                seen.add('fungal_risk');
            }
            if (day.wind_kmh > 40 && !seen.has('strong_wind')) {
                alertsToInsert.push({ type: 'strong_wind', severity: 'warning',
                    title: `💨 Strong Wind Alert — ${day.wind_kmh} km/h`,
                    message: `Wind speeds of ${day.wind_kmh} km/h expected on ${day.date}. Do not spray pesticides or fertilizers — drift will reduce effectiveness.`,
                    date: day.date });
                seen.add('strong_wind');
            }
            if (day.temp_max >= 18 && day.temp_max <= 32 && day.rainfall_mm < 10 && day.humidity < 70 && !seen.has('good_conditions')) {
                alertsToInsert.push({ type: 'good_conditions', severity: 'positive',
                    title: `☀️ Ideal Conditions on ${day.date}`,
                    message: `Perfect weather on ${day.date}: ${day.temp_max}°C, low rainfall (${day.rainfall_mm}mm), humidity ${day.humidity}%. Excellent window for sowing, spraying or transplanting.`,
                    date: day.date });
                seen.add('good_conditions');
            }
        }

        // Drought check
        const dryDays = days.filter(d => d.rainfall_mm < 2).length;
        if (dryDays >= 5 && !seen.has('drought_risk')) {
            alertsToInsert.push({ type: 'drought_risk', severity: 'critical',
                title: `⚠️ Drought Risk — ${dryDays} Dry Days Ahead`,
                message: `No significant rainfall expected for ${dryDays} consecutive days in ${farm.district}. Irrigate immediately if your crop is in flowering or fruiting stage.`,
                date: days[0].date });
        }

        if (alertsToInsert.length === 0) {
            return res.json({
                success: true,
                message: `✅ Weather looks normal for ${farm.district} — no critical alerts to generate right now. Check again later or try during monsoon season.`,
                count: 0
            });
        }

        // 4. Insert alerts into DB
        const savedAlerts = [];
        for (const alert of alertsToInsert) {
            const resAlert = await pool.query(
                `INSERT INTO alerts (farm_id, alert_type, severity, title, message, alert_date, is_read)
                 VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING id, alert_type, severity, title, message`,
                [farm.id, alert.type, alert.severity, alert.title, alert.message, alert.date]
            );
            savedAlerts.push(resAlert.rows[0]);
        }

        // Trigger SMS and Email Notifications
        if (savedAlerts.length > 0) {
            // These run concurrently without blocking the response
            sendAlertEmail(req.user.id, savedAlerts).catch(console.error);
            sendAlertSMS(req.user.id, savedAlerts).catch(console.error);
        }

        // 5. Fire Socket.IO event for the first critical alert
        const io = req.app.get('io');
        const firstCritical = alertsToInsert.find(a => a.severity === 'critical');
        if (io && firstCritical) {
            io.to(`farm_${farm.id}`).emit('new_alert', {
                id: Date.now(),
                severity: firstCritical.severity,
                title: firstCritical.title,
                message: firstCritical.message,
                alert_date: firstCritical.date,
            });
        }

        res.json({
            success: true,
            message: `✅ ${alertsToInsert.length} real weather-based alert(s) generated for ${farm.district}! Refresh the Alerts page.`,
            count: alertsToInsert.length,
            alerts_generated: alertsToInsert.map(a => ({ title: a.title, severity: a.severity, date: a.date }))
        });

    } catch (err) {
        next(err);
    }
});

module.exports = router;