import api from './api';

export const quizService = {
    // Get quizzes for a specific module
    getModuleQuizzes: async (courseId, moduleId) => {
        const response = await api.get(`/quizzes/course/${courseId}/module/${moduleId}`);
        return response.data;
    },

    // Get quiz details for taking
    getQuiz: async (quizId) => {
        const response = await api.get(`/quizzes/${quizId}`);
        return response.data;
    },

    // Submit quiz attempt
    submitQuiz: async (quizId, answers, timeSpent) => {
        const response = await api.post(`/quizzes/${quizId}/submit`, {
            answers,
            timeSpent
        });
        return response.data;
    },

    // Get user's quiz attempts
    getQuizAttempts: async (quizId) => {
        const response = await api.get(`/quizzes/${quizId}/attempts`);
        return response.data;
    },

    // Admin functions
    createQuiz: async (quizData) => {
        const response = await api.post('/quizzes', quizData);
        return response.data;
    },

    updateQuiz: async (quizId, quizData) => {
        const response = await api.put(`/quizzes/${quizId}`, quizData);
        return response.data;
    },

    deleteQuiz: async (quizId) => {
        const response = await api.delete(`/quizzes/${quizId}`);
        return response.data;
    },

    getAllQuizzes: async (courseId) => {
        const params = courseId ? `?courseId=${courseId}` : '';
        const response = await api.get(`/quizzes/admin/all${params}`);
        return response.data;
    },

    getQuizStats: async (quizId) => {
        const response = await api.get(`/quizzes/${quizId}/stats`);
        return response.data;
    },

    // Get all attempts for a quiz (admin only)
    getAllQuizAttempts: async (quizId) => {
        const response = await api.get(`/quizzes/${quizId}/stats`);
        return response.data;
    }
};