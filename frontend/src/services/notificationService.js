import api from './api';

export const notificationService = {
    getAllNotifications: async () => {
        const response = await api.get('/notifications');
        return response.data;
    },

    getCourseNotifications: async (courseId) => {
        const response = await api.get(`/notifications/course/${courseId}`);
        return response.data;
    },

    markAsRead: async (notificationIds) => {
        try {
            const response = await api.put('/notifications/read', { notificationIds });
            return response.data;
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            throw error;
        }
    },

    createNotification: async (notificationData) => {
        const response = await api.post('/notifications', notificationData);
        return response.data;
    }
};