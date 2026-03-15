import { Request, Response } from 'express';
import Metrics from '../models/Metrics.js';

export const getMetrics = async (req: Request, res: Response) => {
    try {
        // Get the latest metrics entry
        const metrics = await Metrics.findOne().sort({ createdAt: -1 });

        // If no metrics exist, return a default object or empty
        if (!metrics) {
            return res.json({
                errorRate: 0,
                systemDowntime: 0,
                cpuUsage: 0,
                requests: 0,
                timestamp: new Date()
            });
        }

        res.json(metrics);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching metrics', error: error.message });
    }
};

export const updateMetrics = async (req: Request, res: Response) => {
    const { errorRate, systemDowntime, cpuUsage, requests } = req.body;

    try {
        const newMetrics = new Metrics({
            errorRate,
            systemDowntime,
            cpuUsage,
            requests
        });

        await newMetrics.save();
        res.status(201).json(newMetrics);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating metrics', error: error.message });
    }
};
