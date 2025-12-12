import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCheck, FiClock, FiTarget } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import Navbar from '../components/Navbar';
import CourseNotifications from '../components/CourseNotifications';

const CourseDetails = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [enrollmentStatus, setEnrollmentStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    const fetchCourseAndStatus = useCallback(async () => {
        try {
            const [courseRes, statusRes] = await Promise.all([
                courseService.getCourse(courseId),
                enrollmentService.checkEnrollmentStatus(courseId)
            ]);
            setCourse(courseRes.course);
            setEnrollmentStatus(statusRes);
        } catch (error) {
            console.error('Error fetching course details:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourseAndStatus();
    }, [fetchCourseAndStatus]);

    const handleEnroll = async () => {
        try {
            setEnrolling(true);
            await enrollmentService.enrollInCourse(courseId);
            toast.success('Successfully enrolled in course!');
            navigate(`/courses/${courseId}/learn`);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to enroll in course');
        } finally {
            setEnrolling(false);
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
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{course?.title}</h1>
                        <p className="text-lg text-gray-600 mt-2">{course?.subtitle}</p>
                    </div>
                    <div className="flex space-x-4">
                        <CourseNotifications courseId={course?._id} />
                        {enrollmentStatus?.isEnrolled ? (
                            <button
                                onClick={() => navigate(`/courses/${courseId}/learn`)}
                                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Continue Learning
                            </button>
                        ) : (
                            <button
                                onClick={handleEnroll}
                                disabled={enrolling}
                                className={`px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
                                    enrolling ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {enrolling ? 'Enrolling...' : 'Enroll Now'}
                            </button>
                        )}
                    </div>
                </div>
                {/* Course Header */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="relative h-64">
                        <img
                            src={course.thumbnail || 'https://via.placeholder.com/1200x400'}
                            alt={course.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center">
                            <div className="px-8 text-white">
                                <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
                                <p className="text-xl">{course.subtitle}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {/* Course Meta */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center text-gray-600">
                                <FiClock className="mr-2" />
                                <span>{course.duration}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <FiTarget className="mr-2" />
                                <span>Level: {course.level}</span>
                            </div>
                        </div>

                        {/* Course Description */}
                        <div className="prose max-w-none mb-8">
                            <h2 className="text-2xl font-semibold mb-4">About This Course</h2>
                            <p className="text-gray-700">{course.description}</p>
                        </div>

                        {/* Prerequisites */}
                        {course.prerequisites?.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold mb-4">Prerequisites</h2>
                                <ul className="list-disc pl-5 space-y-2">
                                    {course.prerequisites.map((prereq, index) => (
                                        <li key={index} className="text-gray-700">{prereq}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Learning Objectives */}
                        {course.learningObjectives?.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold mb-4">What You'll Learn</h2>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {course.learningObjectives.map((objective, index) => (
                                        <li key={index} className="flex items-start">
                                            <FiCheck className="mt-1 mr-2 text-green-500" />
                                            <span className="text-gray-700">{objective}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Enrollment Section */}
                        <div className="mt-8 border-t pt-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    {course.pricing.isFree ? (
                                        <span className="text-2xl font-bold text-gray-900">Free</span>
                                    ) : (
                                        <span className="text-2xl font-bold text-gray-900">
                                            {course.pricing.currency} {course.pricing.price}
                                        </span>
                                    )}
                                </div>
                                {enrollmentStatus?.isEnrolled ? (
                                    <button
                                        onClick={() => navigate(`/courses/${courseId}/learn`)}
                                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Continue Learning
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                        className={`px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 ${
                                            enrolling ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CourseDetails;