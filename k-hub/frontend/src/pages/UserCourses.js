import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook } from 'react-icons/fi';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import Navbar from '../components/Navbar';

const UserCourses = () => {
    const [courses, setCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            // Fetch all published courses
            const coursesRes = await courseService.getAllCourses();
            setCourses(coursesRes.courses || []);

            // Fetch user's enrolled courses
            const enrolledRes = await enrollmentService.getEnrolledCourses();
            setEnrolledCourses(enrolledRes.enrollments || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const isEnrolled = (courseId) => {
        return enrolledCourses.some(enrollment => 
            enrollment.course._id === courseId
        );
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

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <FiBook className="mr-2" /> Available Courses
                    </h1>
                </div>

                {/* My Enrolled Courses */}
                {enrolledCourses.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-semibold mb-4">My Enrolled Courses</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledCourses.map(enrollment => (
                                <div 
                                    key={enrollment.course._id} 
                                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => navigate(`/courses/${enrollment.course._id}/learn`)}
                                >
                                    <img 
                                        src={enrollment.course.thumbnail || 'https://via.placeholder.com/300x150'} 
                                        alt={enrollment.course.title} 
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="text-lg font-semibold mb-2">{enrollment.course.title}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{enrollment.course.subtitle}</p>
                                        <p className="text-xs text-gray-500">Level: {enrollment.course.level}</p>
                                        
                                        {/* Progress bar */}
                                        {enrollment.progress && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                    <span>Progress</span>
                                                    <span>{Math.round(enrollment.progress.completionPercentage)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${enrollment.progress.completionPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <button className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                            Continue Learning
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Available Courses */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">All Courses</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.filter(course => course.isPublished).map(course => (
                            <div 
                                key={course._id} 
                                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => navigate(`/courses/${course._id}`)}
                            >
                                <img 
                                    src={course.thumbnail || 'https://via.placeholder.com/300x150'} 
                                    alt={course.title} 
                                    className="w-full h-40 object-cover"
                                />
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{course.subtitle}</p>
                                    <p className="text-xs text-gray-500">Level: {course.level}</p>
                                    {isEnrolled(course._id) ? (
                                        <button className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded cursor-not-allowed">
                                            Enrolled
                                        </button>
                                    ) : (
                                        <button className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                            View Details
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserCourses;