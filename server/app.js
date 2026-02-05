import express from 'express';
import cors from 'cors';
import chatRoutes from './src/routes/chatRoutes.js';
import conversationRoutes from './src/routes/conversationRoutes.js';
import modelRoutes from './src/routes/modelRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';
import executeRoutes from './src/routes/executeRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import path from 'path';
import fs from 'fs';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Static files (uploads)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/execute', executeRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
