import api from './api';

export const enrollmentService = {
    enrollInCourse: async (courseId) => {
        const response = await api.post(`/enrollments/${courseId}`);
        return response.data;
    },

    getEnrolledCourses: async () => {
        const response = await api.get('/enrollments/my-courses');
        return response.data;
    },

    checkEnrollmentStatus: async (courseId) => {
        const response = await api.get(`/enrollments/${courseId}/status`);
        return response.data;
    },

    updateEnrollmentStatus: async (courseId, status) => {
        const response = await api.put(`/enrollments/${courseId}/status`, { status });
        return response.data;
    },

    // New methods for progress tracking
    markTopicComplete: async (courseId, topicId) => {
        const response = await api.post(`/enrollments/${courseId}/topics/${topicId}/complete`);
        return response.data;
    },

    updateProgress: async (courseId, progress) => {
        const response = await api.put(`/enrollments/${courseId}/progress`, progress);
        return response.data;
    },

    // Admin methods for course management
    getCourseEnrollments: async (courseId) => {
        const response = await api.get(`/enrollments/course/${courseId}`);
        return response.data;
    },

    getAllEnrollments: async () => {
        const response = await api.get('/enrollments/all');
        return response.data;
    }
};