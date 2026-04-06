import { Request, Response } from 'express';
import NotificationModel from '../models/Notification.js';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const notifications = await NotificationModel.find().sort({ timestamp: -1 }).limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving notifications', error });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const notification = await NotificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
        if (notification) {
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        await NotificationModel.updateMany({ isRead: false }, { $set: { isRead: true } });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error });
    }
};
