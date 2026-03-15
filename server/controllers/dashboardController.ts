import { Request, Response } from 'express';
import Log from '../models/Log.js';
import Cluster from '../models/Cluster.js';
import NotificationModel from '../models/Notification.js';
import AnalyticsData from '../models/AnalyticsData.js';

export const getLogs = async (req: Request, res: Response) => {
    try {
        const type = req.query.type as string;
        const query = type ? { type } : {};
        const logs = await Log.find(query).sort({ createdAt: -1 }).limit(100);
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching logs', error: error.message });
    }
};

export const getClusters = async (req: Request, res: Response) => {
    try {
        const clusters = await Cluster.find();
        res.json(clusters);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching clusters', error: error.message });
    }
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await NotificationModel.find().sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

export const createNotification = async (req: Request, res: Response) => {
    try {
        const { title, message, severity, category } = req.body;
        const notification = new NotificationModel({
            notificationId: `notif-${Date.now()}`,
            title,
            message,
            severity: severity || 'info',
            category: category || 'system',
            timestamp: new Date().toISOString(),
            isRead: false
        });
        await notification.save();
        res.status(201).json(notification);
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating notification', error: error.message });
    }
};

export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notification = await NotificationModel.findOneAndUpdate(
            { notificationId: id },
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const { dateRange } = req.query;
        const range = dateRange as string || '7d';
        const analytics = await AnalyticsData.findOne({ dateRange: range });
        
        if (!analytics) {
            // Fallback strategy or return empty
            return res.status(404).json({ message: 'Analytics data not found' });
        }
        res.json(analytics);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching analytics', error: error.message });
    }
};
