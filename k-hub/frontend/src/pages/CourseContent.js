import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheck, FiSquare } from 'react-icons/fi';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import Navbar from '../components/Navbar';
import ModuleSection from '../components/ModuleSection';
import NotificationPanel from '../components/CourseNotifications';
import SimpleVideoPlayer from '../components/SimpleVideoPlayer';

const CourseContent = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const handleVideoComplete = useCallback(async (topicId) => {
        console.log('Video completed automatically for topic:', topicId);
        await handleTopicComplete(topicId);
    }, [handleTopicComplete]);

    const handleTopicSelect = useCallback(async (module, topic) => {
        try {
            setSelectedModule(module);
            setSelectedTopic(topic);
            
            // Update current progress
            await enrollmentService.updateProgress(courseId, {
                moduleId: module._id,
                topicId: topic._id
            });
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }, [courseId]);

    // Check if a topic has video content
    const hasVideoContent = (topic) => {
        return topic.contents?.some(content => content.type === 'youtube');
    };

    const renderContent = (content, topicId) => {
        switch (content.type) {
            case 'youtube':
                return (
                    <SimpleVideoPlayer
                        key={`${topicId}-${content.content}`}
                        videoUrl={content.content}
                        duration={content.duration}
                        topicId={topicId}
                        onVideoComplete={handleVideoComplete}
                        isCompleted={progress?.completedTopics.includes(topicId)}
                    />
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
            case 'paragraph':
                return (
                    <div className="text-gray-700 mb-4 leading-relaxed">
                        {content.content.split('\n').map((line, index) => (
                            <p key={index} className="mb-2">{line}</p>
                        ))}
                    </div>
                );
            case 'syntax':
                return (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-amber-600 font-medium">Syntax:</span>
                            </div>
                            <div className="ml-3">
                                <pre className="text-amber-800 font-mono text-sm">{content.content}</pre>
                            </div>
                        </div>
                    </div>
                );
            case 'output':
                return (
                    <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                        <div className="flex items-start">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                                Output
                            </span>
                            <pre className="text-green-800 font-mono text-sm flex-1">{content.content}</pre>
                        </div>
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
                                        {/* Show checkbox only for topics without videos */}
                                        {!hasVideoContent(selectedTopic) && (
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
                                        )}
                                        {/* Show completion status for video topics */}
                                        {hasVideoContent(selectedTopic) && progress?.completedTopics.includes(selectedTopic._id) && (
                                            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                                                <FiCheck className="w-5 h-5" />
                                                <span>Completed</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-6">
                                        {selectedTopic.contents?.map((content, index) => (
                                            <div key={index} className="content-item">
                                                {renderContent(content, selectedTopic._id)}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <h2 className="text-xl font-semibold text-gray-600 mb-4">
                                        Select a topic to get started
                                    </h2>
                                    <p className="text-gray-500">
                                        Choose a topic from the sidebar to begin learning
                                    </p>
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