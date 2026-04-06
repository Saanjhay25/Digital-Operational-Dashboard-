import { fetchApi } from '../utils/api';
import { RCA } from '../types';

export class RcaService {
    static async getAnalytics(): Promise<any[]> {
        const response = await fetchApi('/rca/analytics');
        if (!response.ok) {
            throw new Error('Failed to fetch RCA analytics');
        }
        return await response.json();
    }
}
