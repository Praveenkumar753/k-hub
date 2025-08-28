import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiX, FiEdit, FiBook, FiVideo, FiCode, FiList, FiFileText, FiType } from 'react-icons/fi';
import { courseService } from '../../services/courseService';
import Navbar from '../../components/Navbar';

const ModuleList = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [moduleName, setModuleName] = useState('');
    const [loading, setLoading] = useState(true);
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
                    <button
                        onClick={() => setShowModuleModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span>Add Module</span>
                    </button>
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
                            </div>

                            {/* Display Main Topics */}
                            <div className="space-y-4 mt-4">
                                {module.mainTopics && module.mainTopics.map((topic, index) => (
                                    <div key={topic._id || index} className="border-l-4 border-blue-500 pl-4">
                                        <h4 className="font-medium">{topic.name}</h4>
                                        <p className="text-sm text-gray-600">{topic.description}</p>
                                        <div className="mt-2 space-y-2">
                                            {topic.contents && topic.contents.map((content, idx) => (
                                                <div key={idx} className={`text-sm ${
                                                    content.type === 'heading' 
                                                        ? 'text-lg font-bold mt-4 mb-2' 
                                                        : content.type === 'subheading'
                                                        ? 'text-md font-semibold mt-3 mb-2 text-gray-700'
                                                        : 'mb-2'
                                                }`}>
                                                    {content.type !== 'heading' && content.type !== 'subheading' && (
                                                        <span className="font-medium text-gray-500">{content.type}: </span>
                                                    )}
                                                    <span className={`${
                                                        content.type === 'code' ? 'font-mono bg-gray-100 px-2 py-1 rounded' : ''
                                                    }`}>
                                                        {content.content}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
        </>
    );
};

export default ModuleList;