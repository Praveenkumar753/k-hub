import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight, FiCheck, FiSquare, FiHelpCircle, FiFileText, FiBook, FiVideo, FiCode, FiList, FiType } from 'react-icons/fi';
import { quizService } from '../services/quizService';
import { taskService } from '../services/taskService';

const ModuleSection = ({ 
    module, 
    courseId, 
    selectedModule, 
    selectedTopic, 
    progress, 
    onModuleSelect, 
    onTopicSelect, 
    onTopicComplete 
}) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [quizzes, setQuizzes] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [userQuizAttempts, setUserQuizAttempts] = useState({});
    const [userTaskSubmissions, setUserTaskSubmissions] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedTaskForView, setSelectedTaskForView] = useState(null);
    const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState(null);

    const isSelected = selectedModule?._id === module._id;

    useEffect(() => {
        if (isSelected && !isExpanded) {
            setIsExpanded(true);
            fetchModuleData();
        }
    }, [isSelected]);

    const fetchModuleData = async () => {
        setLoading(true);
        try {
            // Fetch quizzes for this module
            const quizResponse = await quizService.getModuleQuizzes(courseId, module._id);
            setQuizzes(quizResponse.quizzes || []);

            // Fetch user's quiz attempts
            const quizAttemptsData = {};
            for (const quiz of quizResponse.quizzes || []) {
                try {
                    const attempts = await quizService.getQuizAttempts(quiz._id);
                    quizAttemptsData[quiz._id] = attempts.attempts || [];
                } catch (error) {
                    console.error(`Error fetching attempts for quiz ${quiz._id}:`, error);
                    quizAttemptsData[quiz._id] = [];
                }
            }
            setUserQuizAttempts(quizAttemptsData);

            // Fetch tasks for this module
            const taskResponse = await taskService.getModuleTasks(courseId, module._id);
            setTasks(taskResponse.tasks || []);

            // Fetch user's task submissions
            const taskSubmissionsData = {};
            for (const task of taskResponse.tasks || []) {
                try {
                    const submissions = await taskService.getUserTaskSubmissions(task._id);
                    taskSubmissionsData[task._id] = submissions.submissions || [];
                } catch (error) {
                    console.error(`Error fetching submissions for task ${task._id}:`, error);
                    taskSubmissionsData[task._id] = [];
                }
            }
            setUserTaskSubmissions(taskSubmissionsData);

        } catch (error) {
            console.error('Error fetching module data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleToggle = () => {
        if (!isExpanded) {
            onModuleSelect(module);
            if (module.mainTopics?.length > 0) {
                onTopicSelect(module, module.mainTopics[0]);
            }
            fetchModuleData();
        }
        setIsExpanded(!isExpanded);
    };

    const getContentTypeIcon = (type) => {
        switch (type) {
            case 'youtube': return <FiVideo className="w-3 h-3 text-red-500" />;
            case 'code': return <FiCode className="w-3 h-3 text-blue-500" />;
            case 'points': return <FiList className="w-3 h-3 text-green-500" />;
            case 'heading': return <FiType className="w-3 h-3 text-purple-500" />;
            case 'subheading': return <FiType className="w-3 h-3 text-indigo-500" />;
            default: return <FiFileText className="w-3 h-3 text-gray-500" />;
        }
    };

    const getBestQuizScore = (quizId) => {
        const attempts = userQuizAttempts[quizId] || [];
        if (attempts.length === 0) return null;
        return Math.max(...attempts.map(attempt => attempt.percentage || 0));
    };

    const getTaskStatus = (taskId) => {
        const submissions = userTaskSubmissions[taskId] || [];
        if (submissions.length === 0) return { status: 'not_submitted', score: null };
        
        const latestSubmission = submissions[0]; // Assuming submissions are sorted by date
        return {
            status: latestSubmission.status,
            score: latestSubmission.grade?.score,
            maxScore: tasks.find(t => t._id === taskId)?.maxScore
        };
    };

    return (
        <div className="border rounded-lg">
            <button
                onClick={handleModuleToggle}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
            >
                <div className="flex items-center">
                    <FiBook className="w-4 h-4 mr-2" />
                    <span className="font-medium">{module.name}</span>
                </div>
                <FiChevronRight className={`transform transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                }`} />
            </button>
            
            {isExpanded && (
                <div className="border-t bg-gray-50 p-3">
                    {loading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : (
                        <div className="space-y-3">
                            {/* Topics Section */}
                            {module.mainTopics && module.mainTopics.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Topics</h4>
                                    <div className="space-y-1">
                                        {module.mainTopics.map((topic) => (
                                            <button
                                                key={topic._id}
                                                onClick={() => onTopicSelect(module, topic)}
                                                className={`w-full text-left p-2 rounded flex items-center justify-between text-sm ${
                                                    selectedTopic?._id === topic._id
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'hover:bg-gray-100'
                                                }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium">{topic.name}</div>
                                                    <div className="flex items-center space-x-1 mt-1">
                                                        {topic.contents?.slice(0, 3).map((content, idx) => (
                                                            <span key={idx} className="inline-flex">
                                                                {getContentTypeIcon(content.type)}
                                                            </span>
                                                        ))}
                                                        {topic.contents?.length > 3 && (
                                                            <span className="text-xs text-gray-400">+{topic.contents.length - 3}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Show checkbox only for topics without videos */}
                                                {!topic.contents?.some(content => content.type === 'youtube') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTopicComplete(topic._id);
                                                        }}
                                                        className="p-1 hover:bg-blue-200 rounded"
                                                    >
                                                        {progress?.completedTopics.includes(topic._id) ? (
                                                            <FiCheck className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <FiSquare className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                                {/* Show completion status for video topics */}
                                                {topic.contents?.some(content => content.type === 'youtube') && progress?.completedTopics.includes(topic._id) && (
                                                    <div className="p-1">
                                                        <FiCheck className="w-4 h-4 text-green-500" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quizzes Section */}
                            {quizzes.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide">Quizzes</h4>
                                    <div className="space-y-1">
                                        {quizzes.map((quiz) => {
                                            const bestScore = getBestQuizScore(quiz._id);
                                            const attempts = userQuizAttempts[quiz._id] || [];
                                            
                                            return (
                                                <div
                                                    key={quiz._id}
                                                    onClick={() => navigate(`/quiz/${quiz._id}`)}
                                                    className="p-2 rounded bg-purple-50 hover:bg-purple-100 cursor-pointer text-sm"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">{quiz.title}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {quiz.questions?.length || 0} questions • {quiz.totalPoints} points
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {bestScore !== null ? (
                                                                <div className={`text-xs px-2 py-1 rounded-full ${
                                                                    bestScore >= 80 ? 'bg-green-100 text-green-800' :
                                                                    bestScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {bestScore.toFixed(0)}%
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-gray-400">Not attempted</div>
                                                            )}
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Tasks Section */}
                            {tasks.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">Tasks</h4>
                                    <div className="space-y-1">
                                        {tasks.map((task) => {
                                            const taskStatus = getTaskStatus(task._id);
                                            const submissions = userTaskSubmissions[task._id] || [];
                                            
                                            return (
                                                <div
                                                    key={task._id}
                                                    className="p-2 rounded bg-green-50 border text-sm"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900">{task.title}</div>
                                                            <div className="text-xs text-gray-500">
                                                                Max Score: {task.maxScore}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {taskStatus.status === 'not_submitted' ? (
                                                                <div className="text-xs text-gray-400">Not submitted</div>
                                                            ) : taskStatus.status === 'graded' ? (
                                                                <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                                    {taskStatus.score}/{taskStatus.maxScore}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                                                    Submitted
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-gray-400 mt-1">
                                                                {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Task Action Buttons */}
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => setSelectedTaskForView(task)}
                                                            className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                                                        >
                                                            View Task
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedTaskForSubmit(task)}
                                                            className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                                                        >
                                                            Submit Task
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Task View Modal */}
            {selectedTaskForView && (
                <TaskViewModal 
                    task={selectedTaskForView}
                    onClose={() => setSelectedTaskForView(null)}
                />
            )}

            {/* Task Submit Modal */}
            {selectedTaskForSubmit && (
                <TaskSubmitModal 
                    task={selectedTaskForSubmit}
                    onClose={() => setSelectedTaskForSubmit(null)}
                    onSubmissionSuccess={() => {
                        setSelectedTaskForSubmit(null);
                        fetchModuleData(); // Refresh to update submission status
                    }}
                />
            )}
        </div>
    );
};

// Task View Modal Component
const TaskViewModal = ({ task, onClose }) => {
    const handleDownloadFile = async (filename) => {
        try {
            const response = await taskService.downloadTaskFile(task._id, filename);
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

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-600">{task.description}</p>
                        </div>

                        {task.instructions && (
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-700 whitespace-pre-wrap">{task.instructions}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">Max Score:</span>
                                <span className="ml-2 text-gray-600">{task.maxScore}</span>
                            </div>
                            {task.dueDate && (
                                <div>
                                    <span className="font-medium text-gray-700">Due Date:</span>
                                    <span className="ml-2 text-gray-600">
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Task Files */}
                        {task.taskFiles && task.taskFiles.length > 0 && (
                            <div>
                                <h3 className="font-medium text-gray-900 mb-2">Task Documents</h3>
                                <div className="space-y-2">
                                    {task.taskFiles.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <FiFileText className="w-4 h-4 text-gray-500 mr-2" />
                                                <span className="text-sm text-gray-700">{file.originalName}</span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDownloadFile(file.filename)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Task Submit Modal Component
const TaskSubmitModal = ({ task, onClose, onSubmissionSuccess }) => {
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
                        <h2 className="text-xl font-semibold text-gray-900">Submit: {task.title}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
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
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 flex items-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Task'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModuleSection;