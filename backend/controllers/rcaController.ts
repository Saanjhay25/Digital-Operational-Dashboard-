import { Request, Response } from 'express';
import RCA from '../models/RCA.js';
import Incident from '../models/Incident.js';
import { logActivity } from '../utils/activityLogger.js';
import { createNotification } from '../utils/notificationUtils.js';

// Create a new RCA
export const createRCA = async (req: Request, res: Response) => {
    try {
        const { incident_id, category, summary, detailed_analysis, preventive_measures } = req.body;
        const userId = (req as any).user._id;

        // Verify incident is resolved
        const incident = await Incident.findById(incident_id);
        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }
        if (incident.status !== 'resolved') {
            return res.status(400).json({ message: 'RCA can only be created for resolved incidents' });
        }

        // Check if RCA already exists
        const existingRCA = await RCA.findOne({ incident_id });
        if (existingRCA) {
            return res.status(400).json({ message: 'RCA already exists for this incident' });
        }

        const newRCA = await RCA.create({
            incident_id,
            title: `RCA: ${incident.title}`,
            category,
            summary,
            detailed_analysis,
            preventive_measures,
            status: 'Draft',
            created_by: userId
        });

        await logActivity(`Created Draft RCA for Incident ${incident.title}`, userId, undefined, incident_id);

        res.status(201).json(newRCA);
    } catch (error) {
        console.error('Error creating RCA:', error);
        res.status(500).json({ message: 'Server error creating RCA' });
    }
};

// Get RCA by Incident ID
export const getRCAByIncident = async (req: Request, res: Response) => {
    try {
        const rca = await RCA.findOne({ incident_id: req.params.incidentId }).populate('created_by', 'name email');
        if (!rca) {
            return res.status(404).json({ message: 'RCA not found for this incident' });
        }
        res.status(200).json(rca);
    } catch (error) {
        console.error('Error fetching RCA:', error);
        res.status(500).json({ message: 'Server error fetching RCA' });
    }
};

// Update RCA
export const updateRCA = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = (req as any).user._id;

        const rca = await RCA.findById(id);
        if (!rca) {
            return res.status(404).json({ message: 'RCA not found' });
        }

        if (rca.status === 'Approved') {
            return res.status(400).json({ message: 'Cannot edit an approved RCA' });
        }

        Object.assign(rca, updates);
        await rca.save();

        await logActivity(`Updated RCA for Incident ${rca.title}`, userId, undefined, String(rca.incident_id));

        res.status(200).json(rca);
    } catch (error) {
        console.error('Error updating RCA:', error);
        res.status(500).json({ message: 'Server error updating RCA' });
    }
};

// Change RCA Status (Submit/Approve/Reject)
export const updateRCAStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = (req as any).user;

        const rca = await RCA.findById(id);
        if (!rca) {
            return res.status(404).json({ message: 'RCA not found' });
        }

        if (status === 'Approved' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can approve RCAs' });
        }

        const oldStatus = rca.status;
        rca.status = status;
        await rca.save();

        await logActivity(`Changed RCA status from ${oldStatus} to ${status} for ${rca.title}`, user._id, undefined, String(rca.incident_id));

        if (status === 'Submitted') {
            await createNotification({
                title: 'RCA Submitted',
                message: `An RCA for "${rca.title}" has been submitted and is pending approval.`,
                type: 'info',
                category: 'rca'
            });
        } else if (status === 'Approved') {
            await createNotification({
                title: 'RCA Approved',
                message: `The RCA for "${rca.title}" has been approved.`,
                type: 'info',
                category: 'rca'
            });
        }

        res.status(200).json(rca);
    } catch (error) {
        console.error('Error updating RCA status:', error);
        res.status(500).json({ message: 'Server error updating RCA status' });
    }
};

// Analytics: Get RCA Category Distribution
export const getRCAAnalytics = async (req: Request, res: Response) => {
    try {
        const distribution = await RCA.aggregate([
            { $match: { status: 'Approved' } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const formatted = distribution.map(d => ({
            name: d._id,
            value: d.count
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching RCA analytics:', error);
        res.status(500).json({ message: 'Server error fetching RCA analytics' });
    }
};
