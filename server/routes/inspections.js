// server/routes/inspections.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { auth } = require('../middleware/auth');
const { generateInvoicePDF } = require('../services/pdfService');
const { sendInspectionInvoiceEmail } = require('../services/emailService');

router.use(auth);

// GET /api/inspections
// Get all inspections for the logged-in user
router.get('/', async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT i.*, f.farm_name, f.district
            FROM soil_inspections i
            JOIN farms f ON i.farm_id = f.id
            WHERE i.user_id = $1
            ORDER BY i.created_at DESC
        `, [req.user.id]);
        
        res.json({ success: true, inspections: result.rows });
    } catch (err) {
        next(err);
    }
});

// POST /api/inspections
// Request a new inspection
router.post('/', async (req, res, next) => {
    try {
        const { preferred_date, notes } = req.body;
        
        // Get user's farm
        const farmRes = await pool.query('SELECT id, farm_name FROM farms WHERE user_id = $1', [req.user.id]);
        if (farmRes.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'You must create a farm profile first.' });
        }
        const farm_id = farmRes.rows[0].id;
        const farm_name = farmRes.rows[0].farm_name || 'My Farm';
        
        const result = await pool.query(`
            INSERT INTO soil_inspections (user_id, farm_id, preferred_date, notes)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [req.user.id, farm_id, preferred_date, notes]);
        
        const inspection = result.rows[0];

        // Generate PDF Invoice
        const invoiceData = {
            inspection_id: inspection.id,
            customer_name: req.user.name,
            customer_email: req.user.email,
            farm_name: farm_name,
            preferred_date: preferred_date,
            amount: 500
        };

        try {
            const pdfBuffer = await generateInvoicePDF(invoiceData);
            await sendInspectionInvoiceEmail(req.user.email, req.user.name, pdfBuffer);
        } catch (emailErr) {
            console.error('Failed to generate or send PDF invoice:', emailErr);
            // We don't fail the booking if email fails, but we log it
        }

        res.status(201).json({ success: true, inspection });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
