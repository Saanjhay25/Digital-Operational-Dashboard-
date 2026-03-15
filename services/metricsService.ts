import { fetchApi } from '../utils/api';

export interface MetricsData {
    _id?: string;
    errorRate: number;
    systemDowntime: number;
    cpuUsage: number;
    requests: number;
    timestamp: string;
}

export class MetricsService {
    static async getMetrics(): Promise<{ success: boolean; data?: MetricsData; error?: string }> {
        try {
            const response = await fetchApi('/metrics');

            if (!response.ok) {
                const data = await response.json();
                return { success: false, error: data.message || 'Failed to fetch metrics' };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (e: any) {
            console.error('MetricsService.getMetrics error:', e);
            return { success: false, error: 'Server unreachable' };
        }
    }

    static async updateMetrics(metrics: Omit<MetricsData, '_id' | 'timestamp'>): Promise<{ success: boolean; data?: MetricsData; error?: string }> {
        try {
            const response = await fetchApi('/metrics', {
                method: 'POST',
                body: JSON.stringify(metrics)
            });

            if (!response.ok) {
                const data = await response.json();
                return { success: false, error: data.message || 'Failed to update metrics' };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (e: any) {
            console.error('MetricsService.updateMetrics error:', e);
            return { success: false, error: 'Server unreachable' };
        }
    }
}
