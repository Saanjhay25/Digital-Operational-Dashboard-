import { fetchApi } from '../utils/api';
import { User } from '../types';

export class UserService {
    static async getAllUsers(page: number = 1, limit: number = 20): Promise<{ users: User[], total: number, pages: number, page: number }> {
        const response = await fetchApi(`/users?page=${page}&limit=${limit}`);
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return await response.json();
    }

    static async createUser(userData: Partial<User>): Promise<User> {
        const response = await fetchApi('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to create user');
        }
        return await response.json();
    }

    static async updateUser(email: string, updates: Partial<User>): Promise<User> {
        const response = await fetchApi(`/users/${email}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update user');
        }
        return await response.json();
    }

    static async deleteUser(email: string): Promise<void> {
        const response = await fetchApi(`/users/${email}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete user');
        }
    }

    static async updateProfile(profileData: Partial<User>): Promise<User> {
        const response = await fetchApi('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update profile');
        }
        return await response.json();
    }

    static async getProfile(): Promise<User> {
        const response = await fetchApi('/users/profile');
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        return await response.json();
    }
}
