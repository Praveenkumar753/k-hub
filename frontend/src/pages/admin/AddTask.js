import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUpload, FiX, FiSave, FiArrowLeft, FiFileText, FiCalendar } from 'react-icons/fi';
import { courseService } from '../../services/courseService';
import { taskService } from '../../services/taskService';
import Navbar from '../../components/Navbar';

const AddTask = () => {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    
    const [course, setCourse] = useState(null);
    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        instructions: '',
        maxScore: 100,
        dueDate: '',
        taskFiles: []
    });

    useEffect(() => {
        fetchCourseAndModule();
    }, [courseId, moduleId]);

    const fetchCourseAndModule = async () => {
        try {
            const response = await courseService.getCourse(courseId);
            setCourse(response.course);
            
            const foundModule = response.course.modules.find(m => m._id === moduleId);
            setModule(foundModule);
        } catch (error) {
            console.error('Error fetching course:', error);
            setError('Failed to fetch course details');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTaskData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setTaskData(prev => ({
            ...prev,
            taskFiles: [...prev.taskFiles, ...files]
        }));
    };

    const removeFile = (index) => {
        setTaskData(prev => ({
            ...prev,
            taskFiles: prev.taskFiles.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!taskData.title.trim() || !taskData.description.trim()) {
            setError('Title and description are required');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            
            formData.append('courseId', courseId);
            formData.append('moduleId', moduleId);
            formData.append('title', taskData.title);
            formData.append('description', taskData.description);
            formData.append('instructions', taskData.instructions);
            formData.append('maxScore', taskData.maxScore);
            
            if (taskData.dueDate) {
                formData.append('dueDate', taskData.dueDate);
            }
            
            taskData.taskFiles.forEach(file => {
                formData.append('taskFiles', file);
            });

            await taskService.createTask(formData);
            
            setSuccess('Task created successfully!');
            setTimeout(() => {
                navigate(`/admin/courses/${courseId}/modules`);
            }, 2000);
        } catch (error) {
            console.error('Error creating task:', error);
            setError('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Add New Task</h1>
                            <p className="text-gray-600">
                                Course: {course?.title} | Module: {module?.name}
                            </p>
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            {success}
                        </div>
                    )}

                    {/* Task Form */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Task Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={taskData.title}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter task title"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={taskData.description}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="3"
                                        placeholder="Brief description of the task"
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Detailed Instructions
                                    </label>
                                    <textarea
                                        name="instructions"
                                        value={taskData.instructions}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="6"
                                        placeholder="Detailed instructions for completing the task..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Score
                                    </label>
                                    <input
                                        type="number"
                                        name="maxScore"
                                        value={taskData.maxScore}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min="1"
                                        max="1000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Due Date (Optional)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="dueDate"
                                        value={formatDateTime(taskData.dueDate)}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* File Upload Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Task Files (Optional)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                                    <div className="text-center">
                                        <FiUpload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                        <div className="text-sm text-gray-600 mb-3">
                                            Upload files for students to download (instructions, templates, etc.)
                                        </div>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="taskFiles"
                                            accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
                                        />
                                        <label
                                            htmlFor="taskFiles"
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                                        >
                                            <FiFileText className="w-4 h-4 mr-2" />
                                            Choose Files
                                        </label>
                                    </div>
                                </div>

                                {/* Selected Files */}
                                {taskData.taskFiles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                                        {taskData.taskFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center">
                                                    <span className="mr-2">
                                                        {taskService.getFileIcon(file.name)}
                                                    </span>
                                                    <span className="text-sm text-gray-700">{file.name}</span>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({taskService.formatFileSize(file.size)})
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-4 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
                                    className="px-6 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FiSave className="w-4 h-4 mr-2" />
                                            Create Task
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddTask;