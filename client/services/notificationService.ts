
const API_URL = `${import.meta.env.VITE_API_URL}/notifications`;

export const NotificationService = {
    async getNotifications() {
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    },

    async markAsRead(id: string) {
        const response = await fetch(`${API_URL}/${id}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    },

    async markAllAsRead() {
        const response = await fetch(`${API_URL}/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.json();
    }
};
