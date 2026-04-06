import Log from '../models/Log.js';

/**
 * Logs a simple activity to the database.
 * @param message The human-readable activity message.
 * @param performedBy The ID of the user performing the action.
 * @param relatedUser Optional ID of the user being acted upon.
 * @param incidentId Optional ID of the associated incident.
 */
export const logActivity = async (
    message: string, 
    performedBy: string, 
    relatedUser?: string, 
    incidentId?: string
) => {
    try {
        await Log.create({
            message,
            performedBy,
            relatedUser,
            incidentId
        });
        console.log(`[ACTIVITY LOG]: ${message}`);
    } catch (error) {
        console.error('[ACTIVITY LOG ERROR]:', error);
    }
};
