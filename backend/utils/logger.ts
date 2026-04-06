import Log from '../models/Log.js';
import { logEvent } from './logEvent.js';

// Legacy logger wrapper to prevent crashes in existing code
// Maps old calls to the new simplified Activity Log format
export const logger = {
    info: async (msg: string) => {
        try {
            await Log.create({
                message: `[INFO] ${msg}`,
                performedBy: new Object('000000000000000000000000') // Placeholder for system
            });
            await logEvent('info', msg, 'LegacyLog');
        } catch (err) {
            console.error('Logging failed:', err);
        }
    },
    warn: async (msg: string) => {
        try {
            await Log.create({
                message: `[WARN] ${msg}`,
                performedBy: new Object('000000000000000000000000')
            });
            await logEvent('warning', msg, 'LegacyLog');
        } catch (err) {
            console.error('Logging failed:', err);
        }
    },
    error: async (msg: string) => {
        try {
            await Log.create({
                message: `[ERROR] ${msg}`,
                performedBy: new Object('000000000000000000000000')
            });
            await logEvent('error', msg, 'LegacyLog');
        } catch (err) {
            console.error('Logging failed:', err);
        }
    }
};
