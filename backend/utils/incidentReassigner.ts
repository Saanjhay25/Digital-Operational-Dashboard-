import Incident from '../models/Incident.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { logger } from './logger.js';

/**
 * Reassigns all non-resolved incidents from a given user to other available operators.
 * @param userId The ID of the user whose incidents need reassigning.
 * @param adminId The ID of the admin performing the action (for audit logs).
 */
export const reassignUserIncidents = async (userId: string, adminId: string) => {
    try {
        // Find all non-resolved incidents assigned to this user
        const incidents = await Incident.find({ 
            assignedTo: userId,
            status: { $ne: 'resolved' } 
        });

        if (incidents.length === 0) {
            console.log(`[REASSIGN] No active incidents found for user ${userId}.`);
            return;
        }

        // Find available operators (exclude the one being suspended/deleted)
        const availableOperators = await User.find({
            role: 'operator',
            status: 'active',
            _id: { $ne: userId }
        });

        if (availableOperators.length > 0) {
            console.log(`[REASSIGN] Moving ${incidents.length} incidents to ${availableOperators.length} available operators.`);
            
            // Reassign each incident to an available operator (round-robin)
            for (let i = 0; i < incidents.length; i++) {
                const incident = incidents[i];
                const newOperator = availableOperators[i % availableOperators.length];

                const previousOperatorId = incident.assignedTo;
                incident.assignedTo = newOperator._id as any;
                incident.assignedBy = adminId as any;
                incident.assignedAt = new Date();
                await incident.save();

                // Create audit log for each reassignment
                await AuditLog.create({
                    incidentId: incident._id,
                    adminId,
                    previousOperatorId,
                    newOperatorId: newOperator._id,
                    action: 'REASSIGNED',
                    details: `Auto-reassigned from suspended/deleted operator to ${newOperator.name}`
                });

                logger.info(`Auto-reassigned incident "${incident.title}" to ${newOperator.name}`);
            }
        } else {
            console.log(`[REASSIGN] No available replacements. Unassigning ${incidents.length} incidents.`);
            
            // No operators available, unassign
            for (const incident of incidents) {
                const previousOperatorId = incident.assignedTo;
                incident.assignedTo = null;
                await incident.save();

                await AuditLog.create({
                    incidentId: incident._id,
                    adminId,
                    previousOperatorId,
                    newOperatorId: null,
                    action: 'UNASSIGNED',
                    details: `Unassigned due to operator suspension/deletion and no available replacements`
                });

                logger.info(`Unassigned incident "${incident.title}" (no available replacements)`);
            }
        }
    } catch (error: any) {
        console.error(`[REASSIGN ERROR]: Failed to reassign incidents for user ${userId}:`, error);
        logger.error(`Failed to reassign incidents for user ${userId}: ${error.message}`);
    }
};
