import { Request, Response, NextFunction } from 'express';
import { metricsTracker } from '../utils/metricsTracker.js';

/**
 * metricsMiddleware
 * Tracks every incoming request and increments the failure count if the response
 * status code is 400 or higher.
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Increment total requests for every incoming call
    metricsTracker.incrementTotal();

    // Listen for the response to finish to check the status code
    res.on('finish', () => {
        if (res.statusCode >= 400) {
            metricsTracker.incrementFailed();
        }
    });

    next();
};
