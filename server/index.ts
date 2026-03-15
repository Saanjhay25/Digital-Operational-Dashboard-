import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import seedAdmin from './config/seed.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import incidentRoutes from './routes/incidents.js';
import metricsRoutes from './routes/metrics.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(() => {
    seedAdmin();
});

// Middlewares
app.use(cors());
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

// Request logging for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
