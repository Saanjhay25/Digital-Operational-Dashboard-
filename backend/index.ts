import { metricsTracker } from './utils/metricsTracker.js';
import { sendEmailAlert } from './utils/notificationUtils.js';
import { logEvent } from './utils/logEvent.js';

process.on('uncaughtException', async (err) => {
    console.error('[UNCAUGHT EXCEPTION]:', err);
    metricsTracker.incrementFailed(); // Track global failure
    await logEvent('error', `Uncaught Exception: ${err.message}`, 'System');

    // Try to send emergency alert
    try {
        await sendEmailAlert(
            process.env.ADMIN_EMAIL || 'admin@opspulse.com',
            'CRITICAL: Server Crash',
            `The server has crashed due to an uncaught exception: ${err.message}\nStack: ${err.stack}`
        );
    } catch (e) {
        console.error('Failed to send crash alert:', e);
    }

    process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
    console.error('[UNHANDLED REJECTION]:', reason);
    metricsTracker.incrementFailed(); // Track global failure
    await logEvent('error', `Unhandled Rejection: ${reason}`, 'System');

    try {
        await sendEmailAlert(
            process.env.ADMIN_EMAIL || 'admin@opspulse.com',
            'CRITICAL: Unhandled Rejection',
            `The server encountered an unhandled rejection: ${reason}`
        );
    } catch (e) {
        console.error('Failed to send rejection alert:', e);
    }
});

import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import seedAdmin from './config/seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import incidentRoutes from './routes/incidents.js';
import dashboardRoutes from './routes/dashboard.js';
import metricsRoutes from './routes/metricsRoutes.js';
import notificationRoutes from './routes/notifications.js';
import activityRoutes from './routes/activity.js';
import logRoutes from './routes/logs.js';
import rcaRoutes from './routes/rcaRoutes.js';
import reportRoutes from './routes/reports.js';
import { metricsMiddleware } from './middleware/metricsMiddleware.js';
import { logMiddleware } from './middleware/logMiddleware.js';
import { logger } from './utils/logger.js';

// Load env from current directory first, or nested backend directory
dotenv.config();
dotenv.config({ path: 'backend/.env' });

const app: Express = express();
const port = process.env.PORT || 5000;

const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: "https://digital-operational-dashboard.vercel.app",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('Client connected as: ', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// MUST BE FIRST: Global request and failure tracking
app.use(metricsMiddleware);
// HTTP request logging — emits new_log over Socket.IO
app.use(logMiddleware);



// Request logging removed to keep Activity Log clean.

// Connect to MongoDB
connectDB().then(() => {
    seedAdmin();
});

// Middlewares
// CORS — allow Vercel frontend + localhost dev
const allowedOrigins = [
    process.env.FRONTEND_URL || '',
    'https://digital-operational-dashboard.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        // Allow any *.vercel.app subdomain
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        // Allow explicitly listed origins
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// JSON Syntax Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
        console.error(`[${new Date().toISOString()}] JSON Syntax Error: ${err.message} on ${req.method} ${req.url}`);
        return res.status(400).json({
            message: 'Malformed JSON in request body',
            error: err.message
        });
    }
    next(err);
});

// Test routes
app.get('/', (req: Request, res: Response) => {
    res.send('OpsPulse Backend API is working');
});

app.get('/ping', (req, res) => {
    res.json({ status: 'alive' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/rca', rcaRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
    console.log(`[${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ message: 'Not Found' });
});

httpServer.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default app;
