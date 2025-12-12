import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSave, FiArrowLeft, FiUpload, FiX, FiFileText } from 'react-icons/fi';
import { taskService } from '../../services/taskService';
import { courseService } from '../../services/courseService';
import Navbar from '../../components/Navbar';

const EditTask = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);

    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        instructions: '',
        dueDate: '',
        maxScore: 100,
        courseId: '',
        moduleId: '',
        taskFiles: [],
        existingFiles: []
    });

    const [newFiles, setNewFiles] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchTaskData();
    }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchTaskData = async () => {
        try {
            setInitialLoading(true);
            // Get task details
            const taskResponse = await taskService.getTask(taskId);
            const task = taskResponse.task;

            // Extract courseId and moduleId properly (handle both ObjectId and populated objects)
            const courseIdString = typeof task.courseId === 'object' ? task.courseId._id : task.courseId;
            const moduleIdString = typeof task.moduleId === 'object' ? task.moduleId._id : task.moduleId;

            // Fetch course details
            const courseResponse = await courseService.getCourse(courseIdString);
            setCourse(courseResponse.course);
            
            const module = courseResponse.course.modules.find(m => m._id === moduleIdString);
            setSelectedModule(module);

            // Set task data
            setTaskData({
                title: task.title,
                description: task.description || '',
                instructions: task.instructions || '',
                dueDate: task.dueDate ? formatDateTime(task.dueDate) : '',
                maxScore: task.maxScore || 100,
                courseId: courseIdString,
                moduleId: moduleIdString,
                taskFiles: [],
                existingFiles: task.taskFiles || []
            });
        } catch (error) {
            console.error('Error fetching task:', error);
            toast.error('Failed to load task data');
            navigate('/admin/courses');
        } finally {
            setInitialLoading(false);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTaskData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setNewFiles(Array.from(e.target.files));
    };

    const removeNewFile = (index) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingFile = (index) => {
        setTaskData(prev => ({
            ...prev,
            existingFiles: prev.existingFiles.filter((_, i) => i !== index)
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
            
            formData.append('title', taskData.title);
            formData.append('description', taskData.description);
            formData.append('instructions', taskData.instructions);
            formData.append('maxScore', taskData.maxScore);
            
            if (taskData.dueDate) {
                formData.append('dueDate', taskData.dueDate);
            }

            // Add existing files that weren't removed
            formData.append('existingFiles', JSON.stringify(taskData.existingFiles));
            
            // Add new files
            newFiles.forEach(file => {
                formData.append('taskFiles', file);
            });

            await taskService.updateTask(taskId, formData);
            
            setSuccess('Task updated successfully!');
            toast.success('Task updated successfully!');
            setTimeout(() => {
                navigate(`/admin/courses/${taskData.courseId}/modules`);
            }, 2000);
        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task');
            toast.error('Failed to update task');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center min-h-96">
                        <div className="text-lg">Loading task data...</div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => navigate(`/admin/courses/${taskData.courseId}/modules`)}
                            className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                        >
                            <FiArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Task</h1>
                            {selectedModule && (
                                <p className="text-gray-600">
                                    Course: {course?.title} → Module: {selectedModule.name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-600">{success}</p>
                        </div>
                    )}

                    {/* Task Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Task Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Task Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={taskData.title}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={taskData.description}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Instructions
                                    </label>
                                    <textarea
                                        name="instructions"
                                        value={taskData.instructions}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Detailed instructions for completing the task..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Due Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="dueDate"
                                            value={taskData.dueDate}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Maximum Score
                                        </label>
                                        <input
                                            type="number"
                                            name="maxScore"
                                            value={taskData.maxScore}
                                            onChange={handleInputChange}
                                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Files Section */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Task Files</h2>
                            
                            {/* Existing Files */}
                            {taskData.existingFiles.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-lg font-medium text-gray-700 mb-2">Current Files</h3>
                                    <div className="space-y-2">
                                        {taskData.existingFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center">
                                                    <FiFileText className="w-4 h-4 text-blue-500 mr-2" />
                                                    <span className="text-sm text-gray-700">{file.originalName}</span>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({(file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingFile(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Files */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Add New Files (Optional)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="w-full p-3 border border-dashed border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Supported formats: PDF, DOC, DOCX, TXT, ZIP, JPG, PNG (Max 5 files)
                                </p>

                                {/* New Files Preview */}
                                {newFiles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <h4 className="text-sm font-medium text-gray-700">New Files to Upload:</h4>
                                        {newFiles.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                                <div className="flex items-center">
                                                    <FiUpload className="w-4 h-4 text-blue-500 mr-2" />
                                                    <span className="text-sm text-gray-700">{file.name}</span>
                                                    <span className="text-xs text-gray-500 ml-2">
                                                        ({(file.size / 1024).toFixed(1)} KB)
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewFile(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={() => navigate(`/admin/courses/${taskData.courseId}/modules`)}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                <FiSave className="w-5 h-5 mr-2" />
                                {loading ? 'Updating...' : 'Update Task'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default EditTask;