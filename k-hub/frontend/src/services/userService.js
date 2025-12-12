import api from './api';

export const userService = {
    // Get all users
    getAllUsers: async () => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    // Add a single user
    addUser: async (userData) => {
        const response = await api.post('/admin/users', userData);
        return response.data;
    },

    // Bulk upload users via Excel
    bulkUploadUsers: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/admin/users/bulk-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};