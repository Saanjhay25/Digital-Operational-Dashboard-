import AppLog from '../models/AppLog.js';
import { io } from '../index.js';

/**
 * logEvent — Core utility to create a log entry and emit it over Socket.IO in real time.
 */
export const logEvent = async (
    level: 'info' | 'warning' | 'error',
    message: string,
    source: string = 'System'
): Promise<void> => {
    try {
        const log = await AppLog.create({ level, message, source, timestamp: new Date() });
        // Emit real-time event to all connected clients
        io.emit('new_log', log);
    } catch (err) {
        // Fail silently — never let logging crash the server
        console.error('[logEvent] Failed to persist log:', err);
    }
};
