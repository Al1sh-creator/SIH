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

// @route   POST /api/disease/detect
// @desc    Detect plant disease from image
// @access  Private
router.post('/detect', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const base64Image = req.file.buffer.toString('base64');
        const cropType = req.body.cropType || 'Unknown/Other';

        // Forward to Django AI Engine
        const djangoRes = await axios.post(
            `${process.env.DJANGO_URL}/api/disease/detect/`,
            { image: base64Image, cropType: cropType },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Key': process.env.DJANGO_INTERNAL_KEY
                }
            }
        );

        res.json(djangoRes.data);
    } catch (err) {
        console.error('Error in disease detection:', err.response?.data || err.message);
        res.status(500).json({ 
            error: 'Failed to analyze image', 
            details: err.response?.data?.error || err.message 
        });
    }
});

module.exports = router;
