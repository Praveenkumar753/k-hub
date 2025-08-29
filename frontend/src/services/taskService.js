import api from './api';

export const taskService = {
    // Get all tasks for a specific module
    getModuleTasks: async (courseId, moduleId) => {
        const response = await api.get(`/tasks/course/${courseId}/module/${moduleId}`);
        return response.data;
    },

    // Get a specific task by ID
    getTask: async (taskId) => {
        const response = await api.get(`/tasks/${taskId}`);
        return response.data;
    },

    // Submit a task
    submitTask: async (taskId, submissionData) => {
        const response = await api.post(`/tasks/${taskId}/submit`, submissionData, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    },

    // Get user's submissions for a task
    getUserTaskSubmissions: async (taskId) => {
        const response = await api.get(`/tasks/${taskId}/user-submissions`);
        return response.data;
    },

    // Download task file
    downloadTaskFile: async (taskId, filename) => {
        const response = await api.get(`/tasks/${taskId}/files/${filename}`, {
            responseType: 'blob',
        });
        return response;
    },

    // Admin functions
    createTask: async (taskData) => {
        const response = await api.post('/tasks', taskData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateTask: async (taskId, taskData) => {
        const response = await api.put(`/tasks/${taskId}`, taskData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteTask: async (taskId) => {
        const response = await api.delete(`/tasks/${taskId}`);
        return response.data;
    },

    getAllTasks: async () => {
        const response = await api.get('/tasks');
        return response.data;
    },

    getTaskSubmissions: async (taskId) => {
        console.log('=== TASK SERVICE: Getting submissions for task ID:', taskId);
        const response = await api.get(`/tasks/${taskId}/submissions`);
        console.log('=== TASK SERVICE: Response received:', response.data);
        return response.data;
    },

    gradeSubmission: async (taskId, submissionId, score, feedback) => {
        console.log('=== TASK SERVICE: Grading submission:', { taskId, submissionId, score, feedback });
        const response = await api.put(`/tasks/${taskId}/submissions/${submissionId}/grade`, {
            score,
            feedback,
        });
        console.log('=== TASK SERVICE: Grade response:', response.data);
        return response.data;
    },

    // Utility functions
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    },

    isOverdue: (dueDate) => {
        if (!dueDate) return false;
        return new Date() > new Date(dueDate);
    },

    getFileIcon: (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        const iconMap = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            txt: '📄',
            zip: '🗜️',
            rar: '🗜️',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️',
            js: '💻',
            py: '🐍',
            java: '☕',
            cpp: '⚡',
            c: '⚡',
            html: '🌐',
            css: '🎨',
            default: '📁',
        };
        return iconMap[extension] || iconMap.default;
    },

    getStatusColor: (status) => {
        const colorMap = {
            pending: 'bg-yellow-100 text-yellow-800',
            graded: 'bg-green-100 text-green-800',
            late: 'bg-red-100 text-red-800',
            submitted: 'bg-blue-100 text-blue-800',
        };
        return colorMap[status] || 'bg-gray-100 text-gray-800';
    },

    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
};

export default taskService;