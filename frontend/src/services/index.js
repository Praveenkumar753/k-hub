import api from './api';
import { userService } from './userService';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    isAdmin: () => {
        const user = JSON.parse(localStorage.getItem('user'));
        return user?.role === 'admin';
    }
};

export const contestService = {
    // User contest services
    getContests: async () => {
        const response = await api.get('/contests');
        return response.data;
    },

    getContest: async (id) => {
        const response = await api.get(`/contests/${id}`);
        return response.data;
    },

    getQuestion: async (contestId, questionId) => {
        const response = await api.get(`/contests/${contestId}/questions/${questionId}`);
        return response.data;
    },

    // Admin contest services
    createContest: async (contestData) => {
        const response = await api.post('/admin/contests', contestData);
        return response.data;
    },

    updateContest: async (id, contestData) => {
        const response = await api.put(`/admin/contests/${id}`, contestData);
        return response.data;
    },

    deleteContest: async (id) => {
        const response = await api.delete(`/admin/contests/${id}`);
        return response.data;
    },

    getAdminContests: async () => {
        const response = await api.get('/admin/contests');
        return response.data;
    },

    getAdminContest: async (id) => {
        const response = await api.get(`/admin/contests/${id}`);
        return response.data;
    },

    addQuestion: async (contestId, questionData) => {
        const response = await api.post(`/admin/contests/${contestId}/questions`, questionData);
        return response.data;
    },

    updateQuestion: async (contestId, questionId, questionData) => {
        const response = await api.put(`/admin/contests/${contestId}/questions/${questionId}`, questionData);
        return response.data;
    },

    deleteQuestion: async (contestId, questionId) => {
        const response = await api.delete(`/admin/contests/${contestId}/questions/${questionId}`);
        return response.data;
    },

    getContestStats: async (contestId) => {
        const response = await api.get(`/admin/contests/${contestId}/stats`);
        return response.data;
    }
};

export const submissionService = {
    submitCode: async (submissionData) => {
        const response = await api.post('/submissions', submissionData);
        return response.data;
    },

    runCode: async (codeData) => {
        const response = await api.post('/submissions/run', codeData);
        return response.data;
    },

    getSubmission: async (id) => {
        const response = await api.get(`/submissions/${id}`);
        return response.data;
    },

    getUserSubmissions: async (contestId) => {
        const response = await api.get(`/submissions/contest/${contestId}/user`);
        return response.data;
    },

    getQuestionSubmissions: async (contestId, questionId) => {
        const response = await api.get(`/submissions/contest/${contestId}/question/${questionId}/user`);
        return response.data;
    },

    // Admin submission services
    getAllSubmissions: async (contestId, userId) => {
        const params = new URLSearchParams();
        if (contestId) params.append('contestId', contestId);
        if (userId) params.append('userId', userId);
        
        const response = await api.get(`/admin/submissions?${params.toString()}`);
        return response.data;
    },

    getSubmissionDetails: async (id) => {
        const response = await api.get(`/admin/submissions/${id}`);
        return response.data;
    }
};

export { userService };
