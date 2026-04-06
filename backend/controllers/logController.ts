import { Request, Response } from 'express';
import AppLog from '../models/AppLog.js';

/**
 * GET /api/logs
 * Query params: level, search, limit
 */
export const getLogs = async (req: Request, res: Response): Promise<any> => {
    try {
        const { level, search, limit } = req.query;

        const query: any = {};

        if (level && ['info', 'warning', 'error'].includes(level as string)) {
            query.level = level;
        }

        if (search && typeof search === 'string' && search.trim()) {
            // Use regex for case-insensitive search across message and source
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [{ message: regex }, { source: regex }];
        }

        const maxLimit = Math.min(parseInt(limit as string) || 100, 500);

        const logs = await AppLog.find(query)
            .sort({ timestamp: -1 })
            .limit(maxLimit)
            .lean();

        return res.json(logs);
    } catch (error: any) {
        return res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};
