import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contestService } from '../../services';
import { toast } from 'react-toastify';
import moment from 'moment';
import { FiArrowLeft, FiPlus, FiTrash2, FiCode, FiSettings, FiClock, FiUsers, FiSave, FiFileText } from 'react-icons/fi';
import Navbar from '../../components/Navbar';

const CreateContest = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        duration: 120, // minutes
        allowedLanguages: ['c', 'cpp', 'java', 'python'],
        maxAttempts: 1,
        isActive: true
    });

    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        title: '',
        description: '',
        difficulty: 'Medium',
        constraints: '',
        inputFormat: '',
        outputFormat: '',
        sampleInput: '',
        sampleOutput: '',
        timeLimit: 2000,
        memoryLimit: 256,
        testCases: []
    });

    const [currentTestCase, setCurrentTestCase] = useState({
        input: '',
        expectedOutput: '',
        marks: 10,
        isHidden: false
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleQuestionChange = (e) => {
        const { name, value } = e.target;
        setCurrentQuestion(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTestCaseChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentTestCase(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'marks' ? parseInt(value) || 0 : value)
        }));
    };

    const addTestCase = () => {
        if (!currentTestCase.input.trim() || !currentTestCase.expectedOutput.trim()) {
            toast.error('Please provide both input and expected output for the test case');
            return;
        }

        setCurrentQuestion(prev => ({
            ...prev,
            testCases: [...prev.testCases, { ...currentTestCase }]
        }));

        setCurrentTestCase({
            input: '',
            expectedOutput: '',
            marks: 10,
            isHidden: false
        });
    };

    const removeTestCase = (index) => {
        setCurrentQuestion(prev => ({
            ...prev,
            testCases: prev.testCases.filter((_, i) => i !== index)
        }));
    };

    const addQuestion = () => {
        if (!currentQuestion.title.trim() || !currentQuestion.description.trim()) {
            toast.error('Please provide title and description for the question');
            return;
        }

        if (currentQuestion.testCases.length === 0) {
            toast.error('Please add at least one test case');
            return;
        }

        setQuestions(prev => [...prev, { ...currentQuestion }]);
        setCurrentQuestion({
            title: '',
            description: '',
            difficulty: 'Medium',
            constraints: '',
            inputFormat: '',
            outputFormat: '',
            sampleInput: '',
            sampleOutput: '',
            timeLimit: 2000,
            memoryLimit: 256,
            testCases: []
        });
        toast.success('Question added successfully');
    };

    const removeQuestion = (index) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (questions.length === 0) {
            toast.error('Please add at least one question to the contest');
            return;
        }

        const startTime = moment(formData.startTime);
        const endTime = moment(formData.endTime);
        
        if (!startTime.isValid() || !endTime.isValid()) {
            toast.error('Please provide valid start and end times');
            return;
        }

        if (endTime.isBefore(startTime)) {
            toast.error('End time must be after start time');
            return;
        }

        setLoading(true);
        
        try {
            const contestData = {
                ...formData,
                questions: questions
            };

            await contestService.createContest(contestData);
            toast.success('Contest created successfully!');
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create contest');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-6 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-200 group"
                    >
                        <FiArrowLeft className="w-5 h-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform duration-200" />
                        <span className="font-medium">Back to Dashboard</span>
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-3">
                            <FiCode className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create New Contest</h1>
                            <p className="text-gray-600 mt-1">Set up a new coding challenge for participants</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Contest Basic Information */}
                    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-blue-100 rounded-lg p-2">
                                <FiSettings className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Contest Information</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contest Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter contest name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration (minutes) *
                                </label>
                                <input
                                    type="number"
                                    name="duration"
                                    required
                                    min="30"
                                    max="480"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    required
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    required
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Attempts per Question
                                </label>
                                <input
                                    type="number"
                                    name="maxAttempts"
                                    min="1"
                                    max="10"
                                    value={formData.maxAttempts}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Allowed Languages
                                </label>
                                <div className="space-y-2">
                                    {['c', 'cpp', 'java', 'python', 'javascript'].map(lang => (
                                        <label key={lang} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.allowedLanguages.includes(lang)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            allowedLanguages: [...prev.allowedLanguages, lang]
                                                        }));
                                                    } else {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            allowedLanguages: prev.allowedLanguages.filter(l => l !== lang)
                                                        }));
                                                    }
                                                }}
                                                className="mr-2"
                                            />
                                            <span className="capitalize">{lang}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                required
                                rows="4"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter contest description"
                            />
                        </div>
                    </div>

                    {/* Add Question Section */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Question</h2>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Question Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={currentQuestion.title}
                                        onChange={handleQuestionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter question title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Difficulty
                                    </label>
                                    <select
                                        name="difficulty"
                                        value={currentQuestion.difficulty}
                                        onChange={handleQuestionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Problem Description *
                                </label>
                                <textarea
                                    name="description"
                                    rows="4"
                                    value={currentQuestion.description}
                                    onChange={handleQuestionChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter problem description"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Input Format
                                    </label>
                                    <textarea
                                        name="inputFormat"
                                        rows="3"
                                        value={currentQuestion.inputFormat}
                                        onChange={handleQuestionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Describe input format"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Output Format
                                    </label>
                                    <textarea
                                        name="outputFormat"
                                        rows="3"
                                        value={currentQuestion.outputFormat}
                                        onChange={handleQuestionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Describe output format"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Constraints
                                </label>
                                <textarea
                                    name="constraints"
                                    rows="2"
                                    value={currentQuestion.constraints}
                                    onChange={handleQuestionChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter problem constraints"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sample Input
                                    </label>
                                    <textarea
                                        name="sampleInput"
                                        rows="3"
                                        value={currentQuestion.sampleInput}
                                        onChange={handleQuestionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter sample input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Sample Output
                                    </label>
                                    <textarea
                                        name="sampleOutput"
                                        rows="3"
                                        value={currentQuestion.sampleOutput}
                                        onChange={handleQuestionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter sample output"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time Limit (ms)
                                    </label>
                                    <input
                                        type="number"
                                        name="timeLimit"
                                        min="1000"
                                        max="10000"
                                        value={currentQuestion.timeLimit}
                                        onChange={handleQuestionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Memory Limit (MB)
                                    </label>
                                    <input
                                        type="number"
                                        name="memoryLimit"
                                        min="128"
                                        max="512"
                                        value={currentQuestion.memoryLimit}
                                        onChange={handleQuestionChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Test Cases */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Test Cases</h3>
                                
                                <div className="bg-gray-50 p-4 rounded-md mb-4">
                                    <h4 className="font-medium text-gray-900 mb-3">Add Test Case</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Input *
                                            </label>
                                            <textarea
                                                name="input"
                                                rows="3"
                                                value={currentTestCase.input}
                                                onChange={handleTestCaseChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter test case input"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Expected Output *
                                            </label>
                                            <textarea
                                                name="expectedOutput"
                                                rows="3"
                                                value={currentTestCase.expectedOutput}
                                                onChange={handleTestCaseChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter expected output"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 mb-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Marks *
                                            </label>
                                            <input
                                                type="number"
                                                name="marks"
                                                min="1"
                                                max="100"
                                                value={currentTestCase.marks}
                                                onChange={handleTestCaseChange}
                                                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    name="isHidden"
                                                    checked={currentTestCase.isHidden}
                                                    onChange={handleTestCaseChange}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm text-gray-700">Hidden Test Case</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addTestCase}
                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                                    >
                                        <FiPlus className="w-4 h-4 mr-2" />
                                        Add Test Case
                                    </button>
                                </div>

                                {/* Current Test Cases */}
                                {currentQuestion.testCases.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-3">
                                            Current Test Cases ({currentQuestion.testCases.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {currentQuestion.testCases.map((testCase, index) => (
                                                <div key={index} className="border border-gray-200 rounded-md p-4">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium">Test Case {index + 1}</span>
                                                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                {testCase.marks} marks
                                                            </span>
                                                            {testCase.isHidden && (
                                                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                                                    Hidden
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTestCase(index)}
                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                                                        >
                                                            <FiTrash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <div className="font-medium text-gray-700 mb-1">Input:</div>
                                                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                                                {testCase.input}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-700 mb-1">Expected Output:</div>
                                                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                                                {testCase.expectedOutput}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 text-sm text-gray-600">
                                            Total Marks: {currentQuestion.testCases.reduce((sum, tc) => sum + tc.marks, 0)}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                                >
                                    <FiPlus className="w-5 h-5 mr-2" />
                                    Add Question to Contest
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Added Questions */}
                    {questions.length > 0 && (
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="bg-green-100 rounded-lg p-2">
                                    <FiFileText className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Contest Questions ({questions.length})
                                </h2>
                            </div>
                            <div className="space-y-6">
                                {questions.map((question, index) => (
                                    <div key={index} className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-md transition-all duration-200">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <div className="bg-blue-100 rounded-lg p-2">
                                                        <FiCode className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">{question.title}</h3>
                                                </div>
                                                <p className="text-gray-600 mt-2 line-clamp-2">
                                                    {question.description}
                                                </p>
                                                <div className="flex items-center space-x-6 mt-4 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <FiClock className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-600">Difficulty: <span className="font-medium text-gray-900">{question.difficulty}</span></span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <FiUsers className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-600">Test Cases: <span className="font-medium text-gray-900">{question.testCases.length}</span></span>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {question.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(index)}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-3 rounded-lg transition-all duration-200"
                                            >
                                                <FiTrash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate('/admin')}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || questions.length === 0}
                            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-5 h-5" />
                                    <span>Create Contest</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default CreateContest;
