import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    FiBook, FiSave, FiX, FiPlus
} from 'react-icons/fi';
import { courseService } from '../../services/courseService';
import Navbar from '../../components/Navbar';

const CreateCourse = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [courseData, setCourseData] = useState({
        title: '',
        subtitle: '',
        description: '',
        thumbnail: '',
        level: 'beginner',
        prerequisites: [''],
        learningObjectives: [''],
        duration: '',
        pricing: {
            isFree: true,
            price: 0,
            currency: 'USD'
        },
        isPublished: false
    });

    const handleArrayFieldChange = (field, index, value) => {
        setCourseData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => 
                i === index ? value : item
            )
        }));
    };

    const addArrayField = (field) => {
        setCourseData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeArrayField = (field, index) => {
        setCourseData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('pricing.')) {
            const pricingField = name.split('.')[1];
            setCourseData(prev => ({
                ...prev,
                pricing: {
                    ...prev.pricing,
                    [pricingField]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setCourseData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const cleanedData = {
                ...courseData,
                prerequisites: courseData.prerequisites.filter(item => item.trim()),
                learningObjectives: courseData.learningObjectives.filter(item => item.trim())
            };
            await courseService.createCourse(cleanedData);
            toast.success('Course created successfully');
            navigate('/admin/courses');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    const renderArrayField = (field, label, placeholder) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            {courseData[field].map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => handleArrayFieldChange(field, index, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 p-2 border rounded-md"
                    />
                    <button
                        type="button"
                        onClick={() => removeArrayField(field, index)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => addArrayField(field)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
                <FiPlus className="w-4 h-4" />
                <span>Add {label}</span>
            </button>
        </div>
    );

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <FiBook className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
                            <p className="text-gray-600">Add a new course with detailed information</p>
                        </div>
                    </div>
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Course Title
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={courseData.title}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-md"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subtitle
                                    </label>
                                    <input
                                        type="text"
                                        name="subtitle"
                                        value={courseData.subtitle}
                                        onChange={handleInputChange}
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
                                        value={courseData.description}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-md"
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Thumbnail URL
                                    </label>
                                    <input
                                        type="url"
                                        name="thumbnail"
                                        value={courseData.thumbnail}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-md"
                                        placeholder="https://example.com/course-thumbnail.jpg"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Course Level
                                        </label>
                                        <select
                                            name="level"
                                            value={courseData.level}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border rounded-md"
                                            required
                                        >
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estimated Duration
                                    </label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={courseData.duration}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-md"
                                        placeholder="e.g., 10 hours"
                                    />
                                </div>

                                {renderArrayField('prerequisites', 'Prerequisites', 'Enter a prerequisite')}
                                {renderArrayField('learningObjectives', 'Learning Objectives', 'Enter a learning objective')}

                                <div className="space-y-6">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            name="pricing.isFree"
                                            id="isFree"
                                            checked={courseData.pricing.isFree}
                                            onChange={handleInputChange}
                                            className="rounded text-blue-600"
                                        />
                                        <label htmlFor="isFree" className="text-sm font-medium text-gray-700">
                                            This is a free course
                                        </label>
                                    </div>

                                    {!courseData.pricing.isFree && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Price
                                                </label>
                                                <input
                                                    type="number"
                                                    name="pricing.price"
                                                    value={courseData.pricing.price}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border rounded-md"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Currency
                                                </label>
                                                <select
                                                    name="pricing.currency"
                                                    value={courseData.pricing.currency}
                                                    onChange={handleInputChange}
                                                    className="w-full p-2 border rounded-md"
                                                >
                                                    <option value="USD">USD</option>
                                                    <option value="EUR">EUR</option>
                                                    <option value="GBP">GBP</option>
                                                    <option value="INR">INR</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2 mt-4">
                                        <input
                                            type="checkbox"
                                            name="isPublished"
                                            id="isPublished"
                                            checked={courseData.isPublished}
                                            onChange={handleInputChange}
                                            className="rounded text-blue-600"
                                        />
                                        <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                                            Publish course immediately
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <FiSave className="w-5 h-5" />
                                )}
                                <span>{loading ? 'Creating...' : 'Create Course'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default CreateCourse;