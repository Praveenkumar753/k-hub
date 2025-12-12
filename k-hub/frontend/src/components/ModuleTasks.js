import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiUpload, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { taskService } from '../services/taskService';

const ModuleTasks = ({ courseId, moduleId, moduleName }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [submissions, setSubmissions] = useState({});

    useEffect(() => {
        fetchTasks();
    }, [courseId, moduleId]);

    const fetchTasks = async () => {
        try {
            const response = await taskService.getModuleTasks(courseId, moduleId);
            setTasks(response.tasks || []);
            
            // Fetch submissions for each task
            const submissionPromises = response.tasks?.map(async (task) => {
                try {
                    const submissionResponse = await taskService.getUserTaskSubmissions(task._id);
                    return { taskId: task._id, submissions: submissionResponse.submissions || [] };
                } catch (error) {
                    return { taskId: task._id, submissions: [] };
                }
            }) || [];
            
            const submissionResults = await Promise.all(submissionPromises);
            const submissionMap = {};
            submissionResults.forEach(result => {
                submissionMap[result.taskId] = result.submissions;
            });
            setSubmissions(submissionMap);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setError('Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadFile = async (taskId, filename) => {
        try {
            const response = await taskService.downloadTaskFile(taskId, filename);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const TaskCard = ({ task }) => {
        const taskSubmissions = submissions[task._id] || [];
        const latestSubmission = taskSubmissions.length > 0 ? taskSubmissions[0] : null;
        const isOverdue = taskService.isOverdue(task.dueDate);
        const hasSubmission = latestSubmission !== null;

        return (
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                                <FiFileText className="w-4 h-4 mr-1" />
                                Max Score: {task.maxScore}
                            </span>
                            {task.dueDate && (
                                <span className={`flex items-center ${isOverdue ? 'text-red-500' : ''}`}>
                                    <FiClock className="w-4 h-4 mr-1" />
                                    Due: {taskService.formatDate(task.dueDate)}
                                    {isOverdue && <FiAlertCircle className="w-4 h-4 ml-1" />}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                        {hasSubmission && (
                            <div className="flex items-center text-green-600 text-sm">
                                <FiCheckCircle className="w-4 h-4 mr-1" />
                                Submitted
                            </div>
                        )}
                        {latestSubmission?.score !== undefined && (
                            <div className="text-sm font-medium">
                                Score: {latestSubmission.score}/{task.maxScore}
                            </div>
                        )}
                    </div>
                </div>

                {/* Task Files */}
                {task.files && task.files.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Task Files:</h4>
                        <div className="flex flex-wrap gap-2">
                            {task.files.map((file, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleDownloadFile(task._id, file)}
                                    className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100"
                                >
                                    <span className="mr-1">{taskService.getFileIcon(file)}</span>
                                    {file}
                                    <FiDownload className="w-3 h-3 ml-1" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submission History */}
                {taskSubmissions.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Submissions:</h4>
                        <div className="space-y-2">
                            {taskSubmissions.slice(0, 3).map((submission, index) => (
                                <div key={submission._id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                    <span>
                                        Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                        {submission.score !== undefined && (
                                            <span className="font-medium">
                                                {submission.score}/{task.maxScore}
                                            </span>
                                        )}
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                                            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {submission.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                    <button
                        onClick={() => setSelectedTask(task)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        View Details
                    </button>
                    <button
                        onClick={() => setSelectedTask(task)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        disabled={isOverdue && !hasSubmission}
                    >
                        <FiUpload className="w-4 h-4 mr-2" />
                        {hasSubmission ? 'Resubmit' : 'Submit Solution'}
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                    Tasks - {moduleName}
                </h2>
                <span className="text-sm text-gray-500">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {tasks.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <FiFileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Available</h3>
                    <p className="text-gray-600">
                        No tasks have been assigned for this module yet.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {tasks.map(task => (
                        <TaskCard key={task._id} task={task} />
                    ))}
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal 
                    task={selectedTask} 
                    onClose={() => setSelectedTask(null)}
                    onSubmissionSuccess={fetchTasks}
                />
            )}
        </div>
    );
};

// Task Detail Modal Component
const TaskDetailModal = ({ task, onClose, onSubmissionSuccess }) => {
    const [submissionData, setSubmissionData] = useState({
        links: [],
        notes: ''
    });
    const [newLink, setNewLink] = useState({
        title: '',
        url: '',
        type: 'other'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const linkTypes = [
        { value: 'github', label: 'GitHub Repository', icon: '🐙' },
        { value: 'drive', label: 'Google Drive', icon: '📁' },
        { value: 'dropbox', label: 'Dropbox', icon: '📦' },
        { value: 'onedrive', label: 'OneDrive', icon: '☁️' },
        { value: 'other', label: 'Other Link', icon: '🔗' }
    ];

    const addLink = () => {
        if (!newLink.title.trim() || !newLink.url.trim()) {
            setError('Please provide both title and URL for the link');
            return;
        }

        // Basic URL validation
        try {
            new URL(newLink.url);
        } catch (e) {
            setError('Please enter a valid URL');
            return;
        }

        setSubmissionData(prev => ({
            ...prev,
            links: [...prev.links, { ...newLink }]
        }));

        setNewLink({
            title: '',
            url: '',
            type: 'other'
        });
        setError('');
    };

    const removeLink = (index) => {
        setSubmissionData(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (submissionData.links.length === 0) {
            setError('Please add at least one link to submit');
            return;
        }

        try {
            setLoading(true);
            
            const submissionPayload = {
                submissionLinks: submissionData.links,
                submissionText: submissionData.notes.trim()
            };

            await taskService.submitTask(task._id, submissionPayload);
            
            setSuccess('Task submitted successfully!');
            setTimeout(() => {
                onSubmissionSuccess();
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error submitting task:', error);
            setError('Failed to submit task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mb-6">
                        <p className="text-gray-600 mb-4">{task.description}</p>
                        {task.instructions && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-2">Instructions:</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Add Your Solution Links *
                            </label>
                            <div className="space-y-2">
                                {submissionData.links.map((link, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">{link.title}</span>
                                            <span className="text-sm text-gray-500 ml-2">{link.url}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeLink(index)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 space-y-2">
                                <input
                                    type="text"
                                    placeholder="Link Title"
                                    value={newLink.title}
                                    onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <input
                                    type="url"
                                    placeholder="Link URL"
                                    value={newLink.url}
                                    onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <select
                                    value={newLink.type}
                                    onChange={(e) => setNewLink(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {linkTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.icon} {type.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={addLink}
                                    className="w-full p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Add Link
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                value={submissionData.notes}
                                onChange={(e) => setSubmissionData(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="3"
                                placeholder="Any additional notes or comments about your submission..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || submissionData.links.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <FiUpload className="w-4 h-4 mr-2" />
                                        Submit Task
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModuleTasks;