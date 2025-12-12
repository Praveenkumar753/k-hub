import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { courseService } from '../../services/courseService';

const ModuleManagement = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [showTopicForm, setShowTopicForm] = useState(false);
    const [showContentForm, setShowContentForm] = useState(false);
    const [moduleTitle, setModuleTitle] = useState('');
    const [moduleDescription, setModuleDescription] = useState('');
    const [topicTitle, setTopicTitle] = useState('');

    useEffect(() => {
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        try {
            const data = await courseService.getCourse(courseId);
            setCourse(data);
            setModules(data.modules || []);
        } catch (error) {
            console.error('Error loading course:', error);
        }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        try {
            const moduleData = {
                title: moduleTitle,
                description: moduleDescription
            };
            await courseService.addModule(courseId, moduleData);
            setModuleTitle('');
            setModuleDescription('');
            setShowModuleForm(false);
            loadCourse();
        } catch (error) {
            console.error('Error adding module:', error);
        }
    };

    const handleDeleteModule = async (moduleId) => {
        try {
            await courseService.deleteModule(courseId, moduleId);
            loadCourse();
        } catch (error) {
            console.error('Error deleting module:', error);
        }
    };

    const handleAddTopic = async (e) => {
        e.preventDefault();
        try {
            const topicData = {
                title: topicTitle
            };
            await courseService.addTopic(courseId, selectedModule._id, topicData);
            setTopicTitle('');
            setShowTopicForm(false);
            loadCourse();
        } catch (error) {
            console.error('Error adding topic:', error);
        }
    };

    const handleDeleteTopic = async (moduleId, topicId) => {
        try {
            await courseService.deleteTopic(courseId, moduleId, topicId);
            loadCourse();
        } catch (error) {
            console.error('Error deleting topic:', error);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Module Management</h1>
            
            {/* Add Module Button */}
            <button
                onClick={() => setShowModuleForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
            >
                Add Module
            </button>

            {/* Module Form */}
            {showModuleForm && (
                <div className="bg-white p-4 rounded shadow mb-4">
                    <h2 className="text-xl font-bold mb-2">Add New Module</h2>
                    <form onSubmit={handleAddModule}>
                        <input
                            type="text"
                            value={moduleTitle}
                            onChange={(e) => setModuleTitle(e.target.value)}
                            placeholder="Module Title"
                            className="border p-2 mb-2 w-full"
                            required
                        />
                        <textarea
                            value={moduleDescription}
                            onChange={(e) => setModuleDescription(e.target.value)}
                            placeholder="Module Description"
                            className="border p-2 mb-2 w-full"
                        />
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
                            Save Module
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowModuleForm(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {/* Modules List */}
            <div className="space-y-4">
                {modules.map((module) => (
                    <div key={module._id} className="bg-white p-4 rounded shadow">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">{module.title}</h3>
                            <div>
                                <button
                                    onClick={() => {
                                        setSelectedModule(module);
                                        setShowTopicForm(true);
                                    }}
                                    className="bg-green-500 text-white px-3 py-1 rounded mr-2"
                                >
                                    Add Topic
                                </button>
                                <button
                                    onClick={() => handleDeleteModule(module._id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded"
                                >
                                    Delete Module
                                </button>
                            </div>
                        </div>
                        
                        {/* Topics List */}
                        <div className="ml-4">
                            {module.topics?.map((topic) => (
                                <div key={topic._id} className="border-l-2 border-gray-200 pl-4 py-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium">{topic.title}</h4>
                                        <div>
                                            <button
                                                onClick={() => handleDeleteTopic(module._id, topic._id)}
                                                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                                            >
                                                Delete Topic
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Topic Form Modal */}
            {showTopicForm && selectedModule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded w-96">
                        <h2 className="text-xl font-bold mb-2">Add New Topic to {selectedModule.title}</h2>
                        <form onSubmit={handleAddTopic}>
                            <input
                                type="text"
                                value={topicTitle}
                                onChange={(e) => setTopicTitle(e.target.value)}
                                placeholder="Topic Title"
                                className="border p-2 mb-2 w-full"
                                required
                            />
                            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
                                Save Topic
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTopicForm(false);
                                    setSelectedModule(null);
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleManagement;