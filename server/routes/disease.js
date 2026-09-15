const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { auth } = require('../middleware/auth');

// Multer config for in-memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ─── Helper: forward multipart image as base64 JSON to Django ─────────────────
const toBase64 = (file) => file.buffer.toString('base64');

const djangoHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Internal-Key': process.env.DJANGO_INTERNAL_KEY
});


// @route   POST /api/disease/detect
// @desc    Legacy — detect + Groq in one slow call (kept for compatibility)
// @access  Private
router.post('/detect', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });

        const djangoRes = await axios.post(
            `${process.env.DJANGO_URL}/api/disease/detect/`,
            { image: toBase64(req.file), cropType: req.body.cropType || 'Unknown/Other' },
            { headers: djangoHeaders() }
        );

        res.status(djangoRes.status).json(djangoRes.data);
    } catch (err) {
        console.error('Error in disease detection:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        const data   = err.response?.data  || { error: err.message };
        res.status(status).json(data);
    }
});


// @route   POST /api/disease/detect/fast
// @desc    Stage 1 — instant local CV result (no Groq, ~1-2 sec)
// @access  Private
router.post('/detect/fast', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image provided' });

        const djangoRes = await axios.post(
            `${process.env.DJANGO_URL}/api/disease/detect/fast/`,
            { image: toBase64(req.file), cropType: req.body.cropType || 'Unknown/Other' },
            { headers: djangoHeaders() }
        );

        res.status(djangoRes.status).json(djangoRes.data);
    } catch (err) {
        console.error('Error in fast disease detection:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        const data   = err.response?.data  || { error: err.message };
        res.status(status).json(data);
    }
});


// @route   POST /api/disease/treatment/enhance
// @desc    Stage 2 — Groq AI treatment enhancement (called after Stage 1 result shown)
// @access  Private
router.post('/treatment/enhance', auth, async (req, res) => {
    try {
        const { predicted_class, confidence, cropType } = req.body;

        if (!predicted_class || confidence == null) {
            return res.status(400).json({ error: 'predicted_class and confidence are required.' });
        }

        const djangoRes = await axios.post(
            `${process.env.DJANGO_URL}/api/disease/treatment/enhance/`,
            { predicted_class, confidence, cropType: cropType || 'Unknown/Other' },
            { headers: djangoHeaders() }
        );

        res.status(djangoRes.status).json(djangoRes.data);
    } catch (err) {
        console.error('Error in Groq enhancement:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        const data   = err.response?.data  || { error: err.message };
        res.status(status).json(data);
    }
});


module.exports = router;
