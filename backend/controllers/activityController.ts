import { Request, Response } from 'express';
import ActivityLog from '../models/ActivityLog.js';
import { io } from '../index.js';

export const getActivities = async (req: Request, res: Response) => {
    try {
        const activities = await ActivityLog.find()
            .populate('userId', 'name email')
            .populate('incidentId', 'title')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity logs', error });
    }
};

export const createActivity = async (req: Request, res: Response) => {
    const { action, description, incidentId } = req.body;
    try {
        const activity = await ActivityLog.create({
            action,
            description,
            userId: req.user._id,
            incidentId
        });

        const populatedActivity = await activity.populate([
            { path: 'userId', select: 'name email' },
            { path: 'incidentId', select: 'title' }
        ]);

        if (io) {
            io.emit('activity_log_created', populatedActivity);
        }

        res.status(201).json(populatedActivity);
    } catch (error) {
        res.status(500).json({ message: 'Error creating activity log', error });
    }
};

// Internal helper for auto-logging
export const logInternalActivity = async (data: { action: string; description: string; userId: string; incidentId?: string }) => {
    try {
        const activity = await ActivityLog.create(data);
        const populatedActivity = await activity.populate([
            { path: 'userId', select: 'name email' },
            { path: 'incidentId', select: 'title' }
        ]);
        if (io) {
            io.emit('activity_log_created', populatedActivity);
        }
        return populatedActivity;
    } catch (error) {
        console.error('Error logging internal activity:', error);
    }
};
