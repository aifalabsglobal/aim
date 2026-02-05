import express from 'express';
import { upload } from '../services/uploadService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * POST /api/upload
 * Upload a file and return its metadata
 */
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileMeta = {
            id: uuidv4(),
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: `/uploads/${req.file.filename}`
        };

        res.status(200).json(fileMeta);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

export default router;
