import { Request, Response, NextFunction } from 'express';
import { logEvent } from '../utils/logEvent.js';

const SKIP_PATHS = ['/ping', '/'];

/**
 * logMiddleware
 * Captures every HTTP request and logs it to AppLog with the correct severity level.
 * 2xx → info | 4xx → warning | 5xx → error
 */
export const logMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Skip noise routes
    if (SKIP_PATHS.includes(req.path)) {
        return next();
    }

    res.on('finish', () => {
        const { method, originalUrl } = req;
        const status = res.statusCode;

        let level: 'info' | 'warning' | 'error';
        if (status >= 500) {
            level = 'error';
        } else if (status >= 400) {
            level = 'warning';
        } else {
            level = 'info';
        }

        // Derive a readable source from the URL segment
        const source = deriveSource(originalUrl);
        const message = `${method} ${originalUrl} → ${status}`;

        // Fire-and-forget — do not await to keep request pipeline fast
        logEvent(level, message, source);
    });

    next();
};

function deriveSource(url: string): string {
    const segment = url.split('/')[2]; // e.g. /api/users → 'users'
    if (!segment) return 'API';
    const map: Record<string, string> = {
        auth: 'AuthService',
        users: 'UserService',
        incidents: 'IncidentService',
        metrics: 'MetricsService',
        logs: 'LogService',
        dashboard: 'DashboardService',
        notifications: 'NotificationService',
        activity: 'ActivityService',
    };
    return map[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}
