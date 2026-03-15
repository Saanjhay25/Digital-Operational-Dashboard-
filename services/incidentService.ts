import { fetchApi } from '../utils/api';
import { SystemIncident } from '../types';

export class IncidentService {
    static async getIncidents(): Promise<SystemIncident[]> {
        const response = await fetchApi('/incidents');
        if (!response.ok) {
            throw new Error('Failed to fetch incidents');
        }
        return await response.json();
    }

    static async createIncident(incident: Partial<SystemIncident>): Promise<SystemIncident> {
        const response = await fetchApi('/incidents', {
            method: 'POST',
            body: JSON.stringify(incident),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to create incident');
        }
        return await response.json();
    }

    static async updateIncident(id: string, updates: Partial<SystemIncident>): Promise<SystemIncident> {
        const response = await fetchApi(`/incidents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update incident');
        }
        return await response.json();
    }

    static async deleteIncident(id: string): Promise<void> {
        const response = await fetchApi(`/incidents/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete incident');
        }
    }
}
