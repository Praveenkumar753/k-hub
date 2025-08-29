import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiBook, FiChevronRight, FiCheck, FiSquare, FiHelpCircle } from 'react-icons/fi';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import { quizService } from '../services/quizService';
import Navbar from '../components/Navbar';
import NotificationPanel from '../components/NotificationPanel';
import ModuleQuizzes from '../components/ModuleQuizzes';
import ModuleTasks from '../components/ModuleTasks';
import ModuleSection from '../components/ModuleSection';

const CourseContent = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(null);

    // Use useCallback to prevent function recreation on every render
    const checkEnrollmentAndFetchCourse = useCallback(async () => {
        try {
            setLoading(true);
            // Check if user is enrolled and get progress
            const [courseRes, enrollmentsRes] = await Promise.all([
                courseService.getCourse(courseId),
                enrollmentService.getEnrolledCourses()
            ]);

            if (!courseRes.course) {
                navigate('/courses');
                return;
            }

            const courseEnrollment = enrollmentsRes.enrollments.find(
                e => e.course._id === courseId
            );

            if (!courseEnrollment) {
                navigate(`/courses/${courseId}`);
                return;
            }

            setCourse(courseRes.course);
            setProgress(courseEnrollment.progress);
            
            // Select current module and topic from progress
            if (courseEnrollment.progress.currentModule) {
                const currentModule = courseRes.course.modules.find(
                    m => m._id === courseEnrollment.progress.currentModule
                );
                setSelectedModule(currentModule);

                if (currentModule && courseEnrollment.progress.currentTopic) {
                    const currentTopic = currentModule.mainTopics.find(
                        t => t._id === courseEnrollment.progress.currentTopic
                    );
                    setSelectedTopic(currentTopic);
                }
            }
        } catch (error) {
            console.error('Error fetching course content:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId, navigate]); // Only depend on courseId and navigate

    useEffect(() => {
        checkEnrollmentAndFetchCourse();
    }, [checkEnrollmentAndFetchCourse]); // This will now only run when courseId changes

    const handleTopicComplete = useCallback(async (topicId) => {
        try {
            const response = await enrollmentService.markTopicComplete(courseId, topicId);
            setProgress(response.progress);
        } catch (error) {
            console.error('Error marking topic complete:', error);
        }
    }, [courseId]);

    const handleTopicSelect = useCallback(async (module, topic) => {
        try {
            setSelectedModule(module);
            setSelectedTopic(topic);
            await enrollmentService.updateProgress(courseId, {
                moduleId: module._id,
                topicId: topic._id
            });
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }, [courseId]);

    const renderContent = (content) => {
        switch (content.type) {
            case 'youtube':
                const videoId = content.content.split('v=')[1];
                return (
                    <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-lg">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                );
            case 'code':
                return (
                    <div className="relative group">
                        <pre className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto font-mono text-sm leading-relaxed">
                            <code>{content.content}</code>
                        </pre>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => navigator.clipboard.writeText(content.content)}
                                className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-600"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                );
            case 'points':
                return (
                    <div className="bg-blue-50 p-6 rounded-lg">
                        <ul className="list-disc space-y-2 ml-6">
                            {content.content.split('\n').map((point, index) => (
                                <li key={index} className="text-gray-700">{point}</li>
                            ))}
                        </ul>
                    </div>
                );
            case 'heading':
                return (
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2">
                        {content.content}
                    </h2>
                );
            case 'subheading':
                return (
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">
                        {content.content}
                    </h3>
                );
            case 'output':
                return (
                    <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm border-l-4 border-green-500">
                        <div className="text-xs text-gray-500 mb-2">Output:</div>
                        <pre className="whitespace-pre-wrap">{content.content}</pre>
                    </div>
                );
            case 'syntax':
                return (
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                        <div className="text-xs text-gray-500 mb-2">Syntax:</div>
                        <code className="font-mono text-sm">{content.content}</code>
                    </div>
                );
            case 'paragraph':
                return (
                    <div className="prose max-w-none">
                        <p className="text-gray-700 leading-relaxed mb-4">
                            {content.content}
                        </p>
                    </div>
                );
            default:
                return <p className="text-gray-700 mb-4">{content.content}</p>;
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div>Loading...</div>
                </div>
            </>
        );
    }

    if (!course) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div>Course not found</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{course?.title}</h1>
                        <p className="text-gray-600">{course?.subtitle}</p>
                    </div>
                    <NotificationPanel 
                        type="course" 
                        courseId={courseId}
                        autoRefresh={true}
                        refreshInterval={120000} // 2 minutes for course-specific
                        showSettings={false}
                        showRefresh={true}
                    />
                </div>
                {/* Course Progress Bar */}
                {progress && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Course Progress
                            </span>
                            <span className="text-sm font-medium text-blue-600">
                                {Math.round(progress.completionPercentage)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress.completionPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar - Module List with Topics, Quizzes, and Tasks */}
                    <div className="lg:w-1/3">
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-xl font-bold mb-4">Course Content</h2>
                            <div className="space-y-4">
                                {course?.modules?.map((module) => (
                                    <ModuleSection 
                                        key={module._id}
                                        module={module}
                                        courseId={courseId}
                                        selectedModule={selectedModule}
                                        selectedTopic={selectedTopic}
                                        progress={progress}
                                        onModuleSelect={setSelectedModule}
                                        onTopicSelect={handleTopicSelect}
                                        onTopicComplete={handleTopicComplete}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:w-2/3">
                        <div className="bg-white rounded-lg shadow p-6">
                            {selectedTopic ? (
                                <>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h1 className="text-2xl font-bold mb-2">{selectedTopic.name}</h1>
                                            {selectedTopic.description && (
                                                <p className="text-gray-600">{selectedTopic.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleTopicComplete(selectedTopic._id)}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                                                progress?.completedTopics.includes(selectedTopic._id)
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}
                                        >
                                            {progress?.completedTopics.includes(selectedTopic._id) ? (
                                                <>
                                                    <FiCheck className="w-5 h-5" />
                                                    <span>Completed</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiSquare className="w-5 h-5" />
                                                    <span>Mark Complete</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        {selectedTopic.contents?.map((content, index) => (
                                            <div key={index} className="content-item">
                                                {renderContent(content)}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : selectedModule ? (
                                <div className="text-center">
                                    <div className="mb-6">
                                        <FiBook className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                        <h2 className="text-xl font-semibold text-gray-700 mb-2">{selectedModule.name}</h2>
                                        <p className="text-gray-500">Select a topic from the left sidebar to start learning</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">
                                    <FiBook className="w-16 h-16 mx-auto mb-4" />
                                    <p>Select a module and topic to start learning</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CourseContent;