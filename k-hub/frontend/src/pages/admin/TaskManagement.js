import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiUpload, FiCalendar, FiFileText, FiTrash2, FiEdit3 } from 'react-icons/fi';
import { taskService } from '../../services/taskService';
import { courseService } from '../../services/courseService';

const TaskManagement = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [selectedModule, setSelectedModule] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        instructions: '',
        dueDate: '',
        maxScore: 100,
        allowedFileTypes: 'pdf,doc,docx,txt,jpg,jpeg,png'
    });
    const [taskFiles, setTaskFiles] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    useEffect(() => {
        if (selectedModule) {
            fetchTasks();
        }
    }, [selectedModule]);

    const fetchCourse = async () => {
        try {
            const response = await courseService.getCourse(courseId);
            setCourse(response.course);
            if (response.course?.modules?.length > 0) {
                setSelectedModule(response.course.modules[0]._id);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
            setError('Failed to fetch course');
        }
    };

    const fetchTasks = async () => {
        if (!selectedModule) return;
        
        try {
            setLoading(true);
            const response = await taskService.getModuleTasks(courseId, selectedModule);
            setTasks(response.tasks || []);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setError('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewTask(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setTaskFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!newTask.title.trim() || !newTask.description.trim()) {
            setError('Title and description are required');
            return;
        }

        if (!selectedModule) {
            setError('Please select a module');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            
            // Add task data
            Object.keys(newTask).forEach(key => {
                if (newTask[key]) {
                    formData.append(key, newTask[key]);
                }
            });
            
            formData.append('courseId', courseId);
            formData.append('moduleId', selectedModule);
            
            // Add files
            taskFiles.forEach(file => {
                formData.append('taskFiles', file);
            });

            await taskService.createTask(formData);
            
            // Reset form
            setNewTask({
                title: '',
                description: '',
                instructions: '',
                dueDate: '',
                maxScore: 100,
                allowedFileTypes: 'pdf,doc,docx,txt,jpg,jpeg,png'
            });
            setTaskFiles([]);
            setShowCreateForm(false);
            
            // Refresh tasks
            fetchTasks();
        } catch (error) {
            console.error('Error creating task:', error);
            setError('Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            await taskService.deleteTask(taskId);
            fetchTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            setError('Failed to delete task');
        }
    };

    const getSelectedModuleName = () => {
        const module = course?.modules?.find(m => m._id === selectedModule);
        return module ? module.name : 'Select Module';
    };

    if (!course) {
        return (
            <div className="p-6">
                <div>Loading course...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">Task Management</h1>
                        <p className="text-gray-600">Course: {course.title}</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>Add Task</span>
                    </button>
                </div>

                {/* Module Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Module
                    </label>
                    <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="w-full max-w-md p-2 border rounded-md"
                    >
                        <option value="">Select a module</option>
                        {course.modules?.map(module => (
                            <option key={module._id} value={module._id}>
                                {module.name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
            </div>

            {/* Create Task Form */}
            {showCreateForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={newTask.title}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Score
                                </label>
                                <input
                                    type="number"
                                    name="maxScore"
                                    value={newTask.maxScore}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                    min="1"
                                    max="1000"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={newTask.description}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                                rows="3"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Instructions
                            </label>
                            <textarea
                                name="instructions"
                                value={newTask.instructions}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                                rows="4"
                                placeholder="Detailed instructions for students..."
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
                                    value={newTask.dueDate}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Allowed File Types
                                </label>
                                <input
                                    type="text"
                                    name="allowedFileTypes"
                                    value={newTask.allowedFileTypes}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="pdf,doc,docx,jpg,png"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Task Files (optional)
                            </label>
                            <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="w-full p-2 border rounded-md"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                            />
                            {taskFiles.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600">Selected files:</p>
                                    <ul className="text-sm text-gray-500">
                                        {taskFiles.map((file, index) => (
                                            <li key={index}>• {file.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                            >
                                {loading ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tasks List */}
            {selectedModule && (
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-semibold">
                            Tasks for {getSelectedModuleName()}
                        </h2>
                    </div>
                    
                    {loading ? (
                        <div className="p-6">Loading tasks...</div>
                    ) : tasks.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <FiFileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No tasks found for this module</p>
                            <p className="text-sm">Click "Add Task" to create the first task</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {tasks.map(task => (
                                <div key={task._id} className="p-6 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                {task.title}
                                            </h3>
                                            <p className="text-gray-600 mb-3">{task.description}</p>
                                            
                                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                                <span className="flex items-center">
                                                    <FiCalendar className="w-4 h-4 mr-1" />
                                                    {task.dueDate 
                                                        ? new Date(task.dueDate).toLocaleDateString()
                                                        : 'No due date'
                                                    }
                                                </span>
                                                <span>Max Score: {task.maxScore}</span>
                                                <span>Submissions: {task.submissions?.length || 0}</span>
                                            </div>

                                            {task.taskFiles?.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                                        Attached Files:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {task.taskFiles.map((file, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                                            >
                                                                <FiFileText className="w-3 h-3 mr-1" />
                                                                {file.originalName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() => navigate(`/admin/tasks/${task._id}/submissions`)}
                                                className="text-blue-600 hover:text-blue-800 p-2"
                                                title="View Submissions"
                                            >
                                                <FiFileText className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task._id)}
                                                className="text-red-600 hover:text-red-800 p-2"
                                                title="Delete Task"
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TaskManagement;