import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiX, FiEdit, FiBook, FiVideo, FiCode, FiList, FiFileText, FiType, FiHelpCircle, FiUsers, FiAward, FiClipboard } from 'react-icons/fi';
import { courseService } from '../../services/courseService';
import { quizService } from '../../services/quizService';
import { taskService } from '../../services/taskService';
import { enrollmentService } from '../../services/enrollmentService';
import Navbar from '../../components/Navbar';

const ModuleList = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);
    const [showQuizMarksModal, setShowQuizMarksModal] = useState(false);
    const [showTaskSubmissionsModal, setShowTaskSubmissionsModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [moduleName, setModuleName] = useState('');
    const [loading, setLoading] = useState(true);
    const [moduleQuizzes, setModuleQuizzes] = useState({});
    const [participants, setParticipants] = useState([]);
    const [quizMarks, setQuizMarks] = useState([]);
    const [taskSubmissions, setTaskSubmissions] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [mainTopic, setMainTopic] = useState({
        name: '',
        description: '',
        contentType: 'youtube',
        content: ''
    });
    const [contentItems, setContentItems] = useState([]);

    const contentTypes = [
        { value: 'heading', label: 'Heading' },
        { value: 'subheading', label: 'Sub Heading' },
        { value: 'youtube', label: 'YouTube Link' },
        { value: 'paragraph', label: 'Matter/Paragraph' },
        { value: 'code', label: 'Code' },
        { value: 'output', label: 'Output' },
        { value: 'syntax', label: 'Syntax' },
        { value: 'points', label: 'Points' }
    ];

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const response = await courseService.getCourse(courseId);
            setCourse(response.course);
            
            // Fetch quizzes for each module
            if (response.course.modules) {
                const quizzesData = {};
                for (const module of response.course.modules) {
                    try {
                        const quizResponse = await quizService.getModuleQuizzes(courseId, module._id);
                        quizzesData[module._id] = quizResponse.quizzes || [];
                    } catch (error) {
                        console.error(`Error fetching quizzes for module ${module._id}:`, error);
                        quizzesData[module._id] = [];
                    }
                }
                setModuleQuizzes(quizzesData);
            }
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        try {
            await courseService.addModule(courseId, { name: moduleName });
            setModuleName('');
            setShowModuleModal(false);
            fetchCourse();
        } catch (error) {
            console.error('Error adding module:', error);
        }
    };

    const handleMainTopicChange = (e) => {
        const { name, value } = e.target;
        setMainTopic(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddContentItem = () => {
        if (!mainTopic.content.trim()) {
            return;
        }
        
        setContentItems(prev => [...prev, {
            type: mainTopic.contentType,
            content: mainTopic.content
        }]);

        // Clear only the content and keep the type
        setMainTopic(prev => ({
            ...prev,
            content: ''
        }));
    };

    const removeContentItem = (index) => {
        setContentItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddContent = async (e) => {
        e.preventDefault();
        if (contentItems.length === 0) {
            return;
        }

        try {
            await courseService.addMainTopic(courseId, selectedModule._id, {
                name: mainTopic.name,
                description: mainTopic.description,
                contents: contentItems
            });

            // Reset everything
            setMainTopic({
                name: '',
                description: '',
                contentType: 'youtube',
                content: ''
            });
            setContentItems([]);
            setShowContentModal(false);
            fetchCourse();
        } catch (error) {
            console.error('Error adding content:', error);
        }
    };

    // Fetch course participants
    const fetchParticipants = async () => {
        setLoadingData(true);
        try {
            const response = await enrollmentService.getCourseEnrollments(courseId);
            setParticipants(response.enrollments || []);
        } catch (error) {
            console.error('Error fetching participants:', error);
            setParticipants([]);
        } finally {
            setLoadingData(false);
        }
    };

    // Fetch quiz marks for all quizzes in the course
    const fetchQuizMarks = async () => {
        setLoadingData(true);
        try {
            const allQuizzes = [];
            // Get all quizzes from all modules
            Object.values(moduleQuizzes).forEach(quizzes => {
                allQuizzes.push(...quizzes);
            });

            const quizMarksData = [];
            for (const quiz of allQuizzes) {
                try {
                    const response = await quizService.getAllQuizAttempts(quiz._id);
                    quizMarksData.push({
                        quiz: quiz,
                        attempts: response.attempts || []
                    });
                } catch (error) {
                    console.error(`Error fetching attempts for quiz ${quiz._id}:`, error);
                }
            }
            setQuizMarks(quizMarksData);
        } catch (error) {
            console.error('Error fetching quiz marks:', error);
            setQuizMarks([]);
        } finally {
            setLoadingData(false);
        }
    };

    // Fetch task submissions for all tasks in the course
    const fetchTaskSubmissions = async () => {
        setLoadingData(true);
        try {
            console.log('=== FRONTEND: FETCHING TASK SUBMISSIONS ===');
            const allTasks = [];
            // Get all tasks from all modules
            for (const module of course.modules) {
                try {
                    const response = await taskService.getModuleTasks(courseId, module._id);
                    allTasks.push(...(response.tasks || []));
                } catch (error) {
                    console.error(`Error fetching tasks for module ${module._id}:`, error);
                }
            }
            console.log('Total tasks found:', allTasks.length);

            const taskSubmissionsData = [];
            for (const task of allTasks) {
                try {
                    console.log(`Fetching submissions for task: ${task.title} (ID: ${task._id})`);
                    const response = await taskService.getTaskSubmissions(task._id);
                    console.log(`Task ${task.title} - Response:`, response);
                    console.log(`Task ${task.title} - Submissions:`, response.submissions);
                    
                    // Log each submission's user data
                    if (response.submissions) {
                        response.submissions.forEach((submission, index) => {
                            console.log(`Submission ${index + 1} for task ${task.title}:`, {
                                submissionId: submission._id,
                                user: submission.user,
                                userName: submission.user?.fullName || submission.user?.username || 'Unknown',
                                submittedAt: submission.submittedAt,
                                linksCount: submission.submissionLinks?.length || 0
                            });
                        });
                    }
                    
                    taskSubmissionsData.push({
                        task: task,
                        submissions: response.submissions || []
                    });
                } catch (error) {
                    console.error(`Error fetching submissions for task ${task._id}:`, error);
                }
            }
            console.log('Final taskSubmissionsData:', taskSubmissionsData);
            setTaskSubmissions(taskSubmissionsData);
        } catch (error) {
            console.error('Error fetching task submissions:', error);
            setTaskSubmissions([]);
        } finally {
            setLoadingData(false);
        }
    };

    // Handle assigning marks to task submissions
    const handleAssignMarks = async (taskId, submissionId, score, feedback) => {
        try {
            console.log('=== FRONTEND: Assigning marks:', { taskId, submissionId, score, feedback });
            await taskService.gradeSubmission(taskId, submissionId, score, feedback);
            // Refresh task submissions data
            fetchTaskSubmissions();
        } catch (error) {
            console.error('Error assigning marks:', error);
        }
    };

    const renderContentPreview = (content) => {
        switch (content.type) {
            case 'youtube':
                return (
                    <div className="flex items-center">
                        <FiVideo className="text-red-500 mr-2" />
                        <span className="text-gray-600 truncate">{content.content}</span>
                    </div>
                );
            case 'code':
                return (
                    <div className="flex items-center">
                        <FiCode className="text-blue-500 mr-2" />
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm truncate">
                            {content.content}
                        </code>
                    </div>
                );
            case 'points':
                return (
                    <div className="flex items-center">
                        <FiList className="text-green-500 mr-2" />
                        <span className="text-gray-600 truncate">
                            {content.content.split('\n')[0]}...
                        </span>
                    </div>
                );
            case 'heading':
                return (
                    <div className="flex items-center">
                        <FiType className="text-purple-500 mr-2" />
                        <span className="font-bold truncate">{content.content}</span>
                    </div>
                );
            case 'subheading':
                return (
                    <div className="flex items-center">
                        <FiType className="text-indigo-500 mr-2" />
                        <span className="font-semibold truncate">{content.content}</span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center">
                        <FiFileText className="text-gray-500 mr-2" />
                        <span className="text-gray-600 truncate">{content.content}</span>
                    </div>
                );
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
                    <p className="text-gray-600">{course.subtitle}</p>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Modules</h2>
                    <div className="flex space-x-3">
                        {/* Management Options */}
                        <button
                            onClick={() => setShowParticipantsModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <FiUsers className="w-5 h-5" />
                            <span>Course Participants</span>
                        </button>
                        <button
                            onClick={() => setShowQuizMarksModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <FiAward className="w-5 h-5" />
                            <span>Quiz Marks</span>
                        </button>
                        <button
                            onClick={() => setShowTaskSubmissionsModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        >
                            <FiClipboard className="w-5 h-5" />
                            <span>Task Submissions</span>
                        </button>
                        <button
                            onClick={() => setShowModuleModal(true)}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <FiPlus className="w-5 h-5" />
                            <span>Add Module</span>
                        </button>
                    </div>
                </div>

                <div className="grid gap-4">
                    {course.modules && course.modules.map((module) => (
                        <div 
                            key={module._id}
                            className="bg-white p-4 rounded-lg shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-medium">{module.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Added {new Date(module.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            setSelectedModule(module);
                                            setShowContentModal(true);
                                        }}
                                        className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                    >
                                        <FiPlus className="w-4 h-4" />
                                        <span>Add Content</span>
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/quizzes/new/${courseId}/${module._id}`)}
                                        className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
                                    >
                                        <FiHelpCircle className="w-4 h-4" />
                                        <span>Add Quiz</span>
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/tasks/new/${courseId}/${module._id}`)}
                                        className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                    >
                                        <FiFileText className="w-4 h-4" />
                                        <span>Add Task</span>
                                    </button>
                                </div>
                            </div>

                            {/* Two Column Layout: Main Topics on Left, Quiz/Task Marks on Right */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                {/* Left Column: Main Topics */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900 flex items-center">
                                        <FiBook className="w-4 h-4 mr-2" />
                                        Main Topics
                                    </h4>
                                    {module.mainTopics && module.mainTopics.length > 0 ? (
                                        module.mainTopics.map((topic, index) => (
                                            <div key={topic._id || index} className="border-l-4 border-blue-500 pl-4 bg-gray-50 p-3 rounded-r">
                                                <h5 className="font-medium text-gray-900">{topic.name}</h5>
                                                <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                                                <div className="space-y-1">
                                                    {topic.contents && topic.contents.map((content, idx) => (
                                                        <div key={idx} className="text-xs text-gray-500">
                                                            <span className="inline-flex items-center">
                                                                {content.type === 'youtube' && <FiVideo className="w-3 h-3 mr-1 text-red-500" />}
                                                                {content.type === 'code' && <FiCode className="w-3 h-3 mr-1 text-blue-500" />}
                                                                {content.type === 'points' && <FiList className="w-3 h-3 mr-1 text-green-500" />}
                                                                {content.type === 'heading' && <FiType className="w-3 h-3 mr-1 text-purple-500" />}
                                                                {content.type === 'subheading' && <FiType className="w-3 h-3 mr-1 text-indigo-500" />}
                                                                {!['youtube', 'code', 'points', 'heading', 'subheading'].includes(content.type) && <FiFileText className="w-3 h-3 mr-1 text-gray-500" />}
                                                                <span className="capitalize">{content.type}</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-500 text-sm italic">No topics added yet</div>
                                    )}
                                </div>

                                {/* Right Column: Quiz and Task Marks */}
                                <div className="space-y-4">
                                    {/* Quiz Marks Section */}
                                    <div>
                                        <h4 className="font-medium text-purple-900 flex items-center mb-3">
                                            <FiHelpCircle className="w-4 h-4 mr-2" />
                                            Quiz Marks ({moduleQuizzes[module._id]?.length || 0})
                                        </h4>
                                        {moduleQuizzes[module._id] && moduleQuizzes[module._id].length > 0 ? (
                                            <div className="space-y-2">
                                                {moduleQuizzes[module._id].map((quiz) => (
                                                    <div key={quiz._id} className="bg-purple-50 p-3 rounded border">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="font-medium text-gray-900 text-sm">{quiz.title}</span>
                                                                <div className="text-xs text-gray-500">
                                                                    {quiz.questions?.length || 0} questions • {quiz.totalPoints} points
                                                                </div>
                                                            </div>
                                                            <div className="flex space-x-1">
                                                                <button
                                                                    onClick={() => navigate(`/quiz/${quiz._id}`)}
                                                                    className="text-blue-600 hover:text-blue-700 text-xs"
                                                                >
                                                                    Preview
                                                                </button>
                                                                <button
                                                                    onClick={() => navigate(`/admin/quizzes/edit/${quiz._id}`)}
                                                                    className="text-green-600 hover:text-green-700 text-xs"
                                                                >
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {/* Quiz attempts summary can be added here */}
                                                        <div className="text-xs text-purple-600">
                                                            Click "Quiz Marks" above to view all attempts
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 text-sm italic">No quizzes added yet</div>
                                        )}
                                    </div>

                                    {/* Task Marks Section */}
                                    <div>
                                        <h4 className="font-medium text-green-900 flex items-center mb-3">
                                            <FiFileText className="w-4 h-4 mr-2" />
                                            Task Marks
                                        </h4>
                                        <ModuleTaskMarks moduleId={module._id} courseId={courseId} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Module Modal */}
            {showModuleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Add New Module</h2>
                            <button
                                onClick={() => setShowModuleModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddModule}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Module Name
                                </label>
                                <input
                                    type="text"
                                    value={moduleName}
                                    onChange={(e) => setModuleName(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModuleModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Add Module
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Content Modal */}
            {showContentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Add Content to {selectedModule?.name}</h2>
                            <button
                                onClick={() => setShowContentModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddContent}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Main Topic Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={mainTopic.name}
                                        onChange={handleMainTopicChange}
                                        className="w-full p-2 border rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={mainTopic.description}
                                        onChange={handleMainTopicChange}
                                        className="w-full p-2 border rounded-md"
                                        rows="3"
                                    />
                                </div>

                                {/* Content Items List */}
                                {contentItems.length > 0 && (
                                    <div className="border rounded-md p-4 space-y-2">
                                        <h3 className="font-medium text-gray-700 mb-3">Added Content Items:</h3>
                                        {contentItems.map((item, index) => (
                                            <div 
                                                key={index} 
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex-1 min-w-0 mr-4">
                                                    {renderContentPreview(item)}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeContentItem(index)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                                                >
                                                    <FiX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add New Content Item */}
                                <div className="border-t pt-4">
                                    <h3 className="font-medium text-gray-700 mb-2">Add New Content Item</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Content Type
                                            </label>
                                            <select
                                                name="contentType"
                                                value={mainTopic.contentType}
                                                onChange={handleMainTopicChange}
                                                className="w-full p-2 border rounded-md"
                                            >
                                                {contentTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Content
                                            </label>
                                            {mainTopic.contentType === 'points' ? (
                                                <textarea
                                                    name="content"
                                                    value={mainTopic.content}
                                                    onChange={handleMainTopicChange}
                                                    className="w-full p-2 border rounded-md"
                                                    rows="4"
                                                    placeholder="Enter points separated by new lines"
                                                />
                                            ) : (
                                                <input
                                                    type={mainTopic.contentType === 'youtube' ? 'url' : 'text'}
                                                    name="content"
                                                    value={mainTopic.content}
                                                    onChange={handleMainTopicChange}
                                                    className="w-full p-2 border rounded-md"
                                                    placeholder={
                                                        mainTopic.contentType === 'youtube' 
                                                            ? 'Enter YouTube URL' 
                                                            : `Enter ${mainTopic.contentType}`
                                                    }
                                                />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddContentItem}
                                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                        >
                                            Add This Content Item
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowContentModal(false);
                                        setContentItems([]);
                                        setMainTopic({
                                            name: '',
                                            description: '',
                                            contentType: 'youtube',
                                            content: ''
                                        });
                                    }}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={contentItems.length === 0}
                                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                                        contentItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    Save All Content
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Course Participants Modal */}
            {showParticipantsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center">
                                <FiUsers className="w-6 h-6 mr-2" />
                                Course Participants
                            </h2>
                            <button
                                onClick={() => setShowParticipantsModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {!participants.length ? (
                            <div className="text-center py-8">
                                <button
                                    onClick={fetchParticipants}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    disabled={loadingData}
                                >
                                    {loadingData ? 'Loading...' : 'Load Participants'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-gray-600">Total Participants: {participants.length}</p>
                                    <button
                                        onClick={fetchParticipants}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        disabled={loadingData}
                                    >
                                        {loadingData ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Student Name</th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Email</th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Team Number</th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Batch Year</th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Enrolled Date</th>
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Progress</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {participants.map((enrollment) => (
                                                <tr key={enrollment._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                        {enrollment.user?.fullName || enrollment.user?.username}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-600">
                                                        {enrollment.user?.email}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-600">
                                                        {enrollment.user?.teamNumber || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-600">
                                                        {enrollment.user?.batchYear || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-600">
                                                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        <div className="flex items-center">
                                                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                                                <div 
                                                                    className="bg-blue-600 h-2 rounded-full" 
                                                                    style={{ width: `${enrollment.progress || 0}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-gray-600">{enrollment.progress || 0}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quiz Marks Modal */}
            {showQuizMarksModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center">
                                <FiAward className="w-6 h-6 mr-2" />
                                Quiz Marks
                            </h2>
                            <button
                                onClick={() => setShowQuizMarksModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {!quizMarks.length ? (
                            <div className="text-center py-8">
                                <button
                                    onClick={fetchQuizMarks}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    disabled={loadingData}
                                >
                                    {loadingData ? 'Loading...' : 'Load Quiz Marks'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <p className="text-gray-600">Total Quizzes: {quizMarks.length}</p>
                                    <button
                                        onClick={fetchQuizMarks}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        disabled={loadingData}
                                    >
                                        {loadingData ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                                
                                {quizMarks.map((quizData) => (
                                    <div key={quizData.quiz._id} className="border rounded-lg p-4">
                                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                                            {quizData.quiz.title}
                                            <span className="text-sm text-gray-500 ml-2">
                                                ({quizData.attempts.length} attempts)
                                            </span>
                                        </h3>
                                        
                                        {quizData.attempts.length === 0 ? (
                                            <p className="text-gray-500 italic">No attempts yet</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full bg-white border border-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Student</th>
                                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Score</th>
                                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Percentage</th>
                                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Attempt</th>
                                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {quizData.attempts.map((attempt) => (
                                                            <tr key={attempt._id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                                    {attempt.userId?.fullName || attempt.userId?.username}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                                    {attempt.score}/{quizData.quiz.totalPoints}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm">
                                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                                        attempt.percentage >= 80 ? 'bg-green-100 text-green-800' :
                                                                        attempt.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                        {attempt.percentage.toFixed(1)}%
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                                    #{attempt.attemptNumber}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-600">
                                                                    {new Date(attempt.completedAt).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Task Submissions Modal */}
            {showTaskSubmissionsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold flex items-center">
                                <FiClipboard className="w-6 h-6 mr-2" />
                                Task Submissions
                            </h2>
                            <button
                                onClick={() => setShowTaskSubmissionsModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {!taskSubmissions.length ? (
                            <div className="text-center py-8">
                                <button
                                    onClick={fetchTaskSubmissions}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                    disabled={loadingData}
                                >
                                    {loadingData ? 'Loading...' : 'Load Task Submissions'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <p className="text-gray-600">Total Tasks: {taskSubmissions.length}</p>
                                    <button
                                        onClick={fetchTaskSubmissions}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                        disabled={loadingData}
                                    >
                                        {loadingData ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                                
                                {taskSubmissions.map((taskData) => (
                                    <TaskSubmissionSection 
                                        key={taskData.task._id} 
                                        taskData={taskData} 
                                        onAssignMarks={handleAssignMarks}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

// Task Submission Section Component
const TaskSubmissionSection = ({ taskData, onAssignMarks }) => {
    const [editingSubmission, setEditingSubmission] = useState(null);
    const [marks, setMarks] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSaveMarks = async (submissionId) => {
        if (!marks || marks < 0 || marks > taskData.task.maxScore) {
            alert(`Please enter a valid score between 0 and ${taskData.task.maxScore}`);
            return;
        }

        await onAssignMarks(taskData.task._id, submissionId, parseInt(marks), feedback);
        setEditingSubmission(null);
        setMarks('');
        setFeedback('');
    };

    const startEditing = (submission) => {
        setEditingSubmission(submission._id);
        setMarks(submission.grade?.score || '');
        setFeedback(submission.grade?.feedback || '');
    };

    return (
        <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
                {taskData.task.title}
                <span className="text-sm text-gray-500 ml-2">
                    (Max Score: {taskData.task.maxScore}, {taskData.submissions.length} submissions)
                </span>
            </h3>
            
            {taskData.submissions.length === 0 ? (
                <p className="text-gray-500 italic">No submissions yet</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Student</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Submission Date</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Files</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Assign Marks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {taskData.submissions.map((submission) => (
                                <tr key={submission._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 text-sm text-gray-900">
                                        {submission.user?.fullName || submission.user?.username || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                        {new Date(submission.submittedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-600">
                                        <div className="space-y-1">
                                            {submission.submissionLinks?.map((link, index) => (
                                                <div key={index} className="text-xs">
                                                    <a 
                                                        href={link.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 flex items-center"
                                                    >
                                                        {link.type === 'github' && '🐙'}
                                                        {link.type === 'drive' && '📁'}
                                                        {link.type === 'dropbox' && '📦'}
                                                        {link.type === 'onedrive' && '☁️'}
                                                        {link.type === 'other' && '🔗'}
                                                        <span className="ml-1">{link.title}</span>
                                                    </a>
                                                </div>
                                            ))}
                                            {(!submission.submissionLinks?.length) && (
                                                <span className="text-gray-400 text-xs">No links</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                                            submission.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {submission.status}
                                        </span>
                                        {submission.grade?.score !== undefined && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                Score: {submission.grade.score}/{taskData.task.maxScore}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-sm">
                                        {editingSubmission === submission._id ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="number"
                                                    value={marks}
                                                    onChange={(e) => setMarks(e.target.value)}
                                                    placeholder={`Score (0-${taskData.task.maxScore})`}
                                                    className="w-full px-2 py-1 border rounded text-xs"
                                                    min="0"
                                                    max={taskData.task.maxScore}
                                                />
                                                <textarea
                                                    value={feedback}
                                                    onChange={(e) => setFeedback(e.target.value)}
                                                    placeholder="Feedback (optional)"
                                                    className="w-full px-2 py-1 border rounded text-xs"
                                                    rows="2"
                                                />
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => handleSaveMarks(submission._id)}
                                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingSubmission(null)}
                                                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEditing(submission)}
                                                className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                                            >
                                                {submission.grade?.score !== undefined ? 'Edit Marks' : 'Assign Marks'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Module Task Marks Component
const ModuleTaskMarks = ({ moduleId, courseId }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchModuleTasks();
    }, [moduleId, courseId]);

    const fetchModuleTasks = async () => {
        setLoading(true);
        try {
            const response = await taskService.getModuleTasks(courseId, moduleId);
            const tasksWithSubmissions = [];
            
            for (const task of response.tasks || []) {
                try {
                    const submissionResponse = await taskService.getTaskSubmissions(task._id);
                    tasksWithSubmissions.push({
                        ...task,
                        submissions: submissionResponse.submissions || []
                    });
                } catch (error) {
                    console.error(`Error fetching submissions for task ${task._id}:`, error);
                    tasksWithSubmissions.push({
                        ...task,
                        submissions: []
                    });
                }
            }
            setTasks(tasksWithSubmissions);
        } catch (error) {
            console.error('Error fetching module tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-gray-500 text-sm">Loading tasks...</div>;
    }

    if (tasks.length === 0) {
        return <div className="text-gray-500 text-sm italic">No tasks added yet</div>;
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => {
                const submissionCount = task.submissions.length;
                const gradedCount = task.submissions.filter(s => s.status === 'graded').length;
                const averageScore = gradedCount > 0 
                    ? task.submissions
                        .filter(s => s.grade?.score !== undefined)
                        .reduce((sum, s) => sum + s.grade.score, 0) / gradedCount
                    : 0;

                return (
                    <div key={task._id} className="bg-green-50 p-3 rounded border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="font-medium text-gray-900 text-sm">{task.title}</span>
                                <div className="text-xs text-gray-500">
                                    Max Score: {task.maxScore}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs text-gray-600">
                                📋 {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-gray-600">
                                ✅ {gradedCount} graded
                            </div>
                            {gradedCount > 0 && (
                                <div className="text-xs text-gray-600">
                                    📊 Avg: {averageScore.toFixed(1)}/{task.maxScore}
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-green-600 mt-2">
                            Click "Task Submissions" above to grade
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ModuleList;