import api from './api';

export const courseService = {
    // Get all courses
    getAllCourses: async () => {
        const response = await api.get('/courses');
        return response.data;
    },

    // Get single course
    getCourse: async (id) => {
        const response = await api.get(`/courses/${id}`);
        return response.data;
    },

    // Create course
    createCourse: async (courseData) => {
        const response = await api.post('/courses', courseData);
        return response.data;
    },

    // Update course
    updateCourse: async (id, courseData) => {
        const response = await api.put(`/courses/${id}`, courseData);
        return response.data;
    },

    // Delete course
    deleteCourse: async (id) => {
        const response = await api.delete(`/courses/${id}`);
        return response.data;
    },

    // Add module to course
    addModule: async (courseId, moduleData) => {
        const response = await api.post(`/courses/${courseId}/modules`, moduleData);
        return response.data;
    },

    // Update module
    updateModule: async (courseId, moduleId, moduleData) => {
        const response = await api.put(`/courses/${courseId}/modules/${moduleId}`, moduleData);
        return response.data;
    },

    // Delete module
    deleteModule: async (courseId, moduleId) => {
        const response = await api.delete(`/courses/${courseId}/modules/${moduleId}`);
        return response.data;
    },

    // Add main topic to module
    addMainTopic: async (courseId, moduleId, topicData) => {
        const response = await api.post(`/courses/${courseId}/modules/${moduleId}/topics`, topicData);
        return response.data;
    },

    // Update main topic
    updateMainTopic: async (courseId, moduleId, topicId, topicData) => {
        const response = await api.put(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}`, topicData);
        return response.data;
    },

    // Delete main topic
    deleteMainTopic: async (courseId, moduleId, topicId) => {
        const response = await api.delete(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}`);
        return response.data;
    }
};