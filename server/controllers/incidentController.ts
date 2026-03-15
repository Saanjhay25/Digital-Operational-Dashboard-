import { Request, Response } from 'express';
import Incident from '../models/Incident.js';

export const getIncidents = async (req: Request, res: Response) => {
    try {
        const incidents = await Incident.find({}).sort({ timestamp: -1 });
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
    } catch (error) {
        res.status(500).json({ message: 'Error creating incident', error });
    }
};

export const updateIncident = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        // Check if id is valid ObjectId if using default _id, but here used custom ID logic previously?
        // Transitioning to Mongoose default _id or keeping string ID?
        // Plan said "Incident" Schema. Mongoose uses _id by default.
        // We will assume the frontend will adapt or use _id.
        // If the previous code generated "INC-XXX", we might want to keep that or switch to MongoDB _id.
        // For simplicity of MongoDB integration, let's use _id.

        const incident = await Incident.findByIdAndUpdate(id, updates, { new: true });

        if (incident) {
            res.json(incident);
        } else {
            res.status(404).json({ message: 'Incident not found' });
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
        } else {
            res.status(404).json({ message: 'Incident not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting incident', error });
    }
};
