import { Request, Response } from 'express';
import Incident from '../models/Incident.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification, sendEmailAlert, sendSlackAlert, sendWhatsAppAlert } from '../utils/notificationUtils.js';
import { logInternalActivity } from './activityController.js';

export const getIncidents = async (req: Request, res: Response) => {
    try {
        const query: any = {};
        
        // If user is operator, only show assigned incidents
        if (req.user && req.user.role === 'operator') {
            query.assignedTo = req.user._id;
        }

        const incidents = await Incident.find(query)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email')
            .sort({ timestamp: -1 });
            
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving incidents', error });
    }
};

export const getIncidentStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const stats = await Incident.aggregate([
            {
                $facet: {
                    total: [{ $count: "count" }],
                    open: [
                        { $match: { status: { $in: ['active', 'investigating'] } } },
                        { $count: "count" }
                    ],
                    closed: [
                        { $match: { status: 'resolved' } },
                        { $count: "count" }
                    ],
                    highPriority: [
                        { $match: { severity: { $in: ['critical', 'high'] } } },
                        { $count: "count" }
                    ],
                    last7Days: [
                        { $match: { timestamp: { $gte: sevenDaysAgo } } },
                        { $count: "count" }
                    ]
                }
            },
            {
                $project: {
                    total: { $arrayElemAt: ["$total.count", 0] },
                    open: { $arrayElemAt: ["$open.count", 0] },
                    closed: { $arrayElemAt: ["$closed.count", 0] },
                    highPriority: { $arrayElemAt: ["$highPriority.count", 0] },
                    last7Days: { $arrayElemAt: ["$last7Days.count", 0] }
                }
            }
        ]);

        const result = stats[0] || {};

        return res.json({
            total: result.total || 0,
            open: result.open || 0,
            closed: result.closed || 0,
            highPriority: result.highPriority || 0,
            last7Days: result.last7Days || 0
        });

    } catch (error) {
        return res.status(500).json({ message: 'Error calculating stats', error });
    }
};

export const getIncidentById = async (req: Request, res: Response): Promise<any> => {
    try {
        const incident = await Incident.findById(req.params.id);
        if (incident) {
            return res.json(incident);
        } else {
            return res.status(404).json({ message: 'Incident not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error retrieving incident', error });
    }
};

export const createIncident = async (req: Request, res: Response) => {
    const { title, severity, status, affectedServices, rootCause, resolutionSteps } = req.body;

    try {
        const incident = await Incident.create({
            title,
            severity,
            status: status || 'active',
            affectedServices: affectedServices || [],
            rootCause: rootCause || '',
            resolutionSteps: resolutionSteps || []
        });
        res.status(201).json(incident);
        
        // Trigger Notification
        await createNotification({
            title: 'New Incident Created',
            message: `Incident: ${incident.title} (Severity: ${incident.severity})`,
            type: incident.severity === 'critical' ? 'critical' : (incident.severity === 'high' ? 'warning' : 'info'),
            category: 'incident'
        });

        // Log Activity
        await logInternalActivity({
            action: 'Incident Created',
            description: `Incident "${incident.title}" was created with ${incident.severity} severity.`,
            userId: req.user._id,
            incidentId: incident._id as any
        });

        // Email Alert for Critical Incidents
        if (incident.severity === 'critical') {
            const adminUser = await User.findOne({ role: 'admin' });
            if (adminUser) {
                await sendEmailAlert(
                    adminUser.email, 
                    `CRITICAL ALERT: ${incident.title}`, 
                    `A critical incident has been reported: ${incident.title}\nStatus: ${incident.status}`
                );
                await sendSlackAlert(`🚨 *CRITICAL INCIDENT*: ${incident.title}\nSeverity: ${incident.severity}\nTime: ${new Date().toLocaleString()}`);
                await sendWhatsAppAlert(adminUser.phone || '', `Critical Incident: ${incident.title}`);
            }
        }

        // Log incident creation to system logs
        logger.info(`Incident created: ${incident.title}`);
    } catch (error) {
        res.status(500).json({ message: 'Error creating incident', error });
    }
};

export const updateIncident = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const incident = await Incident.findById(id);

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        // Access Control: Admins can update anything. Operators only assigned incidents.
        if (req.user.role !== 'admin') {
            const isAssigned = incident.assignedTo && incident.assignedTo.toString() === req.user._id.toString();
            if (!isAssigned) {
                return res.status(403).json({ message: 'Access denied: You can only update incidents assigned to you.' });
            }
        }

        const updatedIncident = await Incident.findByIdAndUpdate(id, updates, { new: true })
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name');

        res.json(updatedIncident);

        // Activity Logging: When an operator/admin resolves an incident
        if (updates.status === 'resolved' && updatedIncident) {
            const userName = req.user.name || 'Managed User';
            const logMessage = `Operator ${userName} resolved incident '${updatedIncident.title}'`;
            await logActivity(logMessage, req.user._id.toString(), undefined, updatedIncident._id.toString());
        }

        logger.info(`Incident updated: ${updatedIncident?.title}`);

        // Log Activity for status changes
        if (updates.status) {
            await logInternalActivity({
                action: `Incident ${updates.status.charAt(0).toUpperCase() + updates.status.slice(1)}`,
                description: `Incident "${updatedIncident?.title}" status updated to ${updates.status}.`,
                userId: req.user._id,
                incidentId: updatedIncident?._id.toString()
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating incident', error });
    }
};

export const deleteIncident = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const incident = await Incident.findByIdAndDelete(id);

        if (incident) {
            res.json({ message: 'Incident deleted successfully' });
            logger.info(`Incident deleted: ${incident.title}`);
        } else {
            res.status(404).json({ message: 'Incident not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting incident', error });
    }
};

export const assignIncident = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const { operatorId } = req.body;

    try {
        const incident = await Incident.findById(id);
        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        // Strict Validation: Cannot assign/reassign resolved (closed) incidents
        if (incident.status === 'resolved') {
            return res.status(400).json({ message: 'Cannot assign or reassign a closed incident' });
        }

        // Strict Validation: Cannot reassign to the same operator
        if (incident.assignedTo && incident.assignedTo.toString() === operatorId) {
            return res.status(400).json({ message: 'Incident is already assigned to this operator' });
        }

        const operator = await User.findById(operatorId);
        if (!operator) {
            return res.status(404).json({ message: 'Operator not found' });
        }
        
        if (operator.role !== 'operator' || operator.status !== 'active') {
            return res.status(400).json({ message: 'Incident can only be assigned to an active operator' });
        }

        const previousOperatorId = incident.assignedTo;
        const actionType = previousOperatorId ? 'REASSIGNED' : 'ASSIGNED';

        // Update incident with metadata
        incident.assignedTo = operator._id as any;
        incident.assignedBy = req.user._id;
        incident.assignedAt = new Date();
        await incident.save();

        // Create audit log with details
        await AuditLog.create({
            incidentId: incident._id,
            adminId: req.user._id,
            previousOperatorId,
            newOperatorId: operator._id,
            action: actionType,
            details: `Incident "${incident.title}" ${actionType.toLowerCase()} to ${operator.name}`
        });

        res.json({ 
            message: `Incident ${actionType.toLowerCase()} successfully`, 
            incident 
        });

        logger.info(`Incident ${actionType.toLowerCase()}: ${incident.title} to ${operator.name}`);

        // Log Activity
        await logInternalActivity({
            action: 'Incident Assigned',
            description: `Incident "${incident.title}" was assigned to ${operator.name}.`,
            userId: req.user._id,
            incidentId: incident._id as any
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error assigning incident', error: error.message });
    }
};
