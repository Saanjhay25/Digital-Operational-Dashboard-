import { fetchApi } from '../utils/api';

export class DashboardService {
    static async getLogs() {
        try {
            const response = await fetchApi('/dashboard/logs');
            if (!response.ok) return { success: false, error: 'Failed' };
            const data = await response.json();
            return { success: true, data };
        } catch (e) {
            return { success: false, error: 'Fetch failed' };
        }
    }

    static async getClusters() {
        try {
            const response = await fetchApi('/dashboard/clusters');
            if (!response.ok) return { success: false, error: 'Failed' };
            const data = await response.json();
            return { success: true, data };
        } catch (e) {
            return { success: false, error: 'Fetch failed' };
        }
    }

    static async getNotifications() {
        try {
            const response = await fetchApi('/dashboard/notifications');
            if (!response.ok) return { success: false, error: 'Failed' };
            const data = await response.json();
            return { success: true, data };
        } catch (e) {
            return { success: false, error: 'Fetch failed' };
        }
    }

    static async createNotification(notification: any) {
        try {
            const response = await fetchApi('/dashboard/notifications', {
                method: 'POST',
                body: JSON.stringify(notification)
            });
            if (!response.ok) return { success: false, error: 'Failed' };
            const data = await response.json();
            return { success: true, data };
        } catch (e) {
            return { success: false, error: 'Fetch failed' };
        }
    }

    static async markNotificationRead(id: string) {
        try {
            const response = await fetchApi(`/dashboard/notifications/${id}/read`, { method: 'PATCH' });
            if (!response.ok) return { success: false, error: 'Failed' };
            const data = await response.json();
            return { success: true, data };
        } catch (e) {
            return { success: false, error: 'Fetch failed' };
        }
    }

    static async getAnalytics(dateRange: string) {
        try {
            const response = await fetchApi(`/dashboard/analytics?dateRange=${dateRange}`);
            if (!response.ok) return { success: false, error: 'Failed' };
            const data = await response.json();
            return { success: true, data };
        } catch (e) {
            return { success: false, error: 'Fetch failed' };
        }
    }
}
