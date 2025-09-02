import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBook, FiPlus, FiList, FiEdit } from 'react-icons/fi';
import { courseService } from '../../services/courseService';
import Navbar from '../../components/Navbar';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await courseService.getAllCourses();
                setCourses(res.courses || []);
                console.log(res.courses,"nocourses found");
            } catch {
                setCourses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <FiBook className="mr-2" /> Courses
                    </h1>
                    <button
                        onClick={() => navigate('/admin/courses/new')}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>Create Course</span>
                    </button>
                </div>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <div key={course._id} className="bg-white rounded-lg shadow p-4 flex flex-col">
                                <img src={course.thumbnail} alt={course.title} className="h-32 w-full object-cover rounded mb-3" />
                                <h2 className="text-lg font-semibold mb-1">{course.title}</h2>
                                <p className="text-sm text-gray-600 mb-2">{course.subtitle}</p>
                                <p className="text-xs text-gray-500 mb-2">Level: {course.level}</p>
                                <p className="text-xs text-gray-500 mb-2">Duration: {course.duration}</p>
                                <p className="text-xs text-gray-500 mb-2">{course.isPublished ? 'Published' : 'Draft'}</p>
                                <div className="mt-auto space-y-2">
                                    <button
                                        onClick={() => navigate(`/admin/courses/${course._id}/modules`)}
                                        className="w-full px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center justify-center"
                                    >
                                        <FiList className="mr-1" />
                                        Add Modules
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/courses/${course._id}/edit`)}
                                        className="w-full px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 flex items-center justify-center"
                                    >
                                        <FiEdit className="mr-1" />
                                        Edit Course
                                    </button>
                                    <button
                                        onClick={() => navigate(`/admin/courses/${course._id}`)}
                                        className="w-full px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                        {courses.length === 0 && (
                            <div className="col-span-full text-center text-gray-500">No courses found.</div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default Courses;
