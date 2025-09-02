import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contestService } from '../../services';
import { toast } from 'react-toastify';
import moment from 'moment';
import { FiArrowLeft, FiPlus, FiTrash2, FiCode, FiSettings, FiClock, FiUsers, FiSave, FiFileText, FiEdit3, FiDatabase, FiEdit } from 'react-icons/fi';
import Navbar from '../../components/Navbar';

const EditContest = () => {
    const navigate = useNavigate();
    const { contestId } = useParams();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startTime: '',
        endTime: '',
        duration: 120,
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

    // Add new state for editing individual test cases
    const [editingTestCaseIndex, setEditingTestCaseIndex] = useState(-1);

    // Add new state for editing mode
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);

    useEffect(() => {
        fetchContest();
    }, [contestId, navigate]); // Add navigate to dependencies

    const fetchContest = async () => {
        try {
            setLoading(true);
            const response = await contestService.getAdminContest(contestId); // Fixed: Use admin endpoint
            const contest = response.contest;
            
            console.log('Fetched contest:', contest); // Debug log
            
            setFormData({
                name: contest.name || '',
                description: contest.description || '',
                startTime: contest.startTime ? moment(contest.startTime).format('YYYY-MM-DDTHH:mm') : '',
                endTime: contest.endTime ? moment(contest.endTime).format('YYYY-MM-DDTHH:mm') : '',
                duration: contest.duration || 120,
                allowedLanguages: contest.allowedLanguages || ['c', 'cpp', 'java', 'python'],
                maxAttempts: contest.maxAttempts || 1,
                isActive: contest.isActive !== undefined ? contest.isActive : true
            });
            
            // Ensure questions array is initialized properly with test cases
            setQuestions(contest.questions?.map(q => ({
                ...q,
                testCases: q.testCases || [] // Ensure each question has testCases array
            })) || []);
        } catch (error) {
            toast.error('Failed to fetch contest details');
            console.error('Error:', error);
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLanguageChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            allowedLanguages: checked 
                ? [...(prev.allowedLanguages || []), value]
                : (prev.allowedLanguages || []).filter(lang => lang !== value)
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
            toast.error('Please fill in both input and expected output');
            return;
        }

        setCurrentQuestion(prev => ({
            ...prev,
            testCases: [...(prev.testCases || []), { ...currentTestCase }]
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
            testCases: (prev.testCases || []).filter((_, i) => i !== index)
        }));
    };

    const addQuestion = () => {
        if (!currentQuestion.title.trim() || !currentQuestion.description.trim()) {
            toast.error('Please fill in question title and description');
            return;
        }

        if ((currentQuestion.testCases || []).length === 0) {
            toast.error('Please add at least one test case');
            return;
        }

        setQuestions(prev => [...prev, { ...currentQuestion }]);
        
        // Reset current question
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

        toast.success('Question added successfully!');
    };

    const removeQuestion = (index) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
        toast.success('Question removed successfully!');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.description.trim()) {
            toast.error('Please fill in contest name and description');
            return;
        }

        if (!questions || questions.length === 0) {
            toast.error('Please add at least one question');
            return;
        }

        const startTime = moment(formData.startTime);
        const endTime = moment(formData.endTime);

        if (!startTime.isValid() || !endTime.isValid()) {
            toast.error('Please provide valid start and end times');
            return;
        }

        if (endTime.isSameOrBefore(startTime)) {
            toast.error('End time must be after start time');
            return;
        }

        try {
            setUpdating(true);
            
            const contestData = {
                ...formData,
                questions
            };

            await contestService.updateContest(contestId, contestData);
            toast.success('Contest updated successfully!');
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update contest');
            console.error('Error:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleEditQuestion = (index) => {
        setEditingQuestionIndex(index);
        const questionToEdit = questions[index];
        setCurrentQuestion({
            ...questionToEdit,
            testCases: questionToEdit.testCases || [] // Ensure testCases is initialized
        });
        window.scrollTo({ top: document.getElementById('questionForm')?.offsetTop || 0, behavior: 'smooth' });
    };

    const updateQuestion = () => {
        if (editingQuestionIndex === -1) {
            // Add new question
            setQuestions(prev => [...prev, { ...currentQuestion }]);
        } else {
            // Update existing question
            setQuestions(prev => 
                prev.map((q, idx) => 
                    idx === editingQuestionIndex ? { ...currentQuestion } : q
                )
            );
        }

        // Reset form
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
        setEditingQuestionIndex(-1);
        toast.success(editingQuestionIndex === -1 ? 'Question added successfully!' : 'Question updated successfully!');
    };

    // Add new functions for editing individual test cases
    const editTestCase = (index) => {
        setEditingTestCaseIndex(index);
        const testCaseToEdit = currentQuestion.testCases[index];
        setCurrentTestCase({ ...testCaseToEdit });
    };

    const updateTestCase = () => {
        if (!currentTestCase.input.trim() || !currentTestCase.expectedOutput.trim()) {
            toast.error('Please fill in both input and expected output');
            return;
        }

        setCurrentQuestion(prev => ({
            ...prev,
            testCases: prev.testCases.map((tc, idx) => 
                idx === editingTestCaseIndex ? { ...currentTestCase } : tc
            )
        }));

        setCurrentTestCase({
            input: '',
            expectedOutput: '',
            marks: 10,
            isHidden: false
        });
        setEditingTestCaseIndex(-1);
        toast.success('Test case updated successfully!');
    };

    const cancelTestCaseEdit = () => {
        setCurrentTestCase({
            input: '',
            expectedOutput: '',
            marks: 10,
            isHidden: false
        });
        setEditingTestCaseIndex(-1);
    };

    // Function to calculate total marks for a question
    const calculateTotalMarks = (testCases) => {
        return testCases?.reduce((sum, tc) => sum + (tc.marks || 0), 0) || 0;
    };

    // Function to toggle test case visibility
    const toggleTestCaseVisibility = (questionIndex, testCaseIndex) => {
        setQuestions(prev => 
            prev.map((q, qIdx) => 
                qIdx === questionIndex 
                    ? {
                        ...q,
                        testCases: q.testCases.map((tc, tcIdx) => 
                            tcIdx === testCaseIndex 
                                ? { ...tc, isHidden: !tc.isHidden }
                                : tc
                        )
                    }
                    : q
            )
        );
    };

    // Function to edit test case marks inline
    const updateTestCaseMarks = (questionIndex, testCaseIndex, newMarks) => {
        setQuestions(prev => 
            prev.map((q, qIdx) => 
                qIdx === questionIndex 
                    ? {
                        ...q,
                        testCases: q.testCases.map((tc, tcIdx) => 
                            tcIdx === testCaseIndex 
                                ? { ...tc, marks: parseInt(newMarks) || 0 }
                                : tc
                        )
                    }
                    : q
            )
        );
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </>
        );
    }

    // Additional safety check for formData
    if (!formData || !formData.allowedLanguages) {
        return (
            <>
                <Navbar />
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading contest data...</p>
                    </div>
                </div>
            </>
        );
    }

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
                            <FiEdit3 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Edit Contest</h1>
                            <p className="text-gray-600 mt-1">Modify your coding challenge settings and questions</p>
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
                                    value={formData.name || ''}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter contest name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration (minutes) *
                                </label>
                                <input
                                    type="number"
                                    name="duration"
                                    value={formData.duration || 120}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description || ''}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Enter contest description"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={formData.startTime || ''}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={formData.endTime || ''}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Attempts
                                </label>
                                <input
                                    type="number"
                                    name="maxAttempts"
                                    value={formData.maxAttempts || 1}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Allowed Languages
                                </label>
                                <div className="space-y-2">
                                    {['c', 'cpp', 'java', 'python', 'javascript', 'go'].map((lang) => (
                                        <label key={lang} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                value={lang}
                                                checked={formData.allowedLanguages && formData.allowedLanguages.includes(lang)}
                                                onChange={handleLanguageChange}
                                                className="mr-2"
                                            />
                                            <span className="capitalize">{lang}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive || false}
                                    onChange={handleInputChange}
                                    className="mr-2"
                                />
                                <span className="text-sm font-medium text-gray-700">Contest is active</span>
                            </label>
                        </div>
                    </div>

                    {/* Add New Question Form - Similar to CreateContest */}
                    <div id="questionForm" className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="bg-green-100 rounded-lg p-2">
                                <FiPlus className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">{editingQuestionIndex === -1 ? 'Add New Question' : 'Edit Question'}</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={currentQuestion.title}
                                        onChange={handleQuestionChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter question title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                                    <select
                                        name="difficulty"
                                        value={currentQuestion.difficulty}
                                        onChange={handleQuestionChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Problem Description</label>
                                <textarea
                                    name="description"
                                    value={currentQuestion.description}
                                    onChange={handleQuestionChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="4"
                                    placeholder="Describe the problem statement"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (ms)</label>
                                    <input
                                        type="number"
                                        name="timeLimit"
                                        value={currentQuestion.timeLimit}
                                        onChange={handleQuestionChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Memory Limit (MB)</label>
                                    <input
                                        type="number"
                                        name="memoryLimit"
                                        value={currentQuestion.memoryLimit}
                                        onChange={handleQuestionChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* Test Cases Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="font-medium text-gray-900 mb-3">Add Test Case</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Input</label>
                                        <textarea
                                            name="input"
                                            value={currentTestCase.input}
                                            onChange={handleTestCaseChange}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            placeholder="Test case input"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Expected Output</label>
                                        <textarea
                                            name="expectedOutput"
                                            value={currentTestCase.expectedOutput}
                                            onChange={handleTestCaseChange}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            placeholder="Expected output"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                                            <input
                                                type="number"
                                                name="marks"
                                                value={currentTestCase.marks}
                                                onChange={handleTestCaseChange}
                                                className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="1"
                                            />
                                        </div>
                                        
                                        <label className="flex items-center mt-5">
                                            <input
                                                type="checkbox"
                                                name="isHidden"
                                                checked={currentTestCase.isHidden}
                                                onChange={handleTestCaseChange}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Hidden test case</span>
                                        </label>
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
                                {(currentQuestion.testCases || []).length > 0 && (
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-medium text-gray-900">
                                                Current Test Cases ({(currentQuestion.testCases || []).length})
                                            </h4>
                                            <div className="text-sm text-gray-600">
                                                Total Marks: {calculateTotalMarks(currentQuestion.testCases)}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {(currentQuestion.testCases || []).map((testCase, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    {editingTestCaseIndex === index ? (
                                                        // Edit mode
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium text-gray-900">Editing Test Case {index + 1}</span>
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={updateTestCase}
                                                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={cancelTestCaseEdit}
                                                                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Input</label>
                                                                    <textarea
                                                                        name="input"
                                                                        value={currentTestCase.input}
                                                                        onChange={handleTestCaseChange}
                                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        rows="3"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                                                                    <textarea
                                                                        name="expectedOutput"
                                                                        value={currentTestCase.expectedOutput}
                                                                        onChange={handleTestCaseChange}
                                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        rows="3"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                                                                    <input
                                                                        type="number"
                                                                        name="marks"
                                                                        value={currentTestCase.marks}
                                                                        onChange={handleTestCaseChange}
                                                                        className="w-20 border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        min="1"
                                                                    />
                                                                </div>
                                                                <label className="flex items-center mt-5">
                                                                    <input
                                                                        type="checkbox"
                                                                        name="isHidden"
                                                                        checked={currentTestCase.isHidden}
                                                                        onChange={handleTestCaseChange}
                                                                        className="mr-2"
                                                                    />
                                                                    <span className="text-sm text-gray-700">Hidden test case</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // View mode
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="font-medium text-gray-900">Test Case {index + 1}</span>
                                                                    <span className="text-sm text-gray-600">Marks: {testCase.marks}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updatedTestCases = currentQuestion.testCases.map((tc, idx) => 
                                                                                idx === index ? { ...tc, isHidden: !tc.isHidden } : tc
                                                                            );
                                                                            setCurrentQuestion(prev => ({ ...prev, testCases: updatedTestCases }));
                                                                        }}
                                                                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                                                            testCase.isHidden 
                                                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                        }`}
                                                                    >
                                                                        {testCase.isHidden ? 'Hidden' : 'Public'}
                                                                    </button>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => editTestCase(index)}
                                                                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
                                                                    >
                                                                        <FiEdit className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeTestCase(index)}
                                                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                                                                    >
                                                                        <FiTrash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                                <div>
                                                                    <div className="font-medium text-gray-700 mb-1">Input:</div>
                                                                    <pre className="bg-white p-2 rounded text-xs border overflow-x-auto max-h-20">
                                                                        {testCase.input}
                                                                    </pre>
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-gray-700 mb-1">Expected Output:</div>
                                                                    <pre className="bg-white p-2 rounded text-xs border overflow-x-auto max-h-20">
                                                                        {testCase.expectedOutput}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={updateQuestion}
                                    className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                                >
                                    <FiPlus className="w-5 h-5 mr-2" />
                                    {editingQuestionIndex === -1 ? 'Add Question to Contest' : 'Update Question'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Existing Questions */}
                    {questions && questions.length > 0 && (
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="bg-green-100 rounded-lg p-2">
                                    <FiFileText className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Existing Contest Questions ({questions.length})
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
                                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                                        question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                                        question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {question.difficulty || 'Medium'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mt-2 mb-4">
                                                    {question.description}
                                                </p>
                                                
                                                {/* Test Cases Display */}
                                                {question.testCases && question.testCases.length > 0 && (
                                                    <div className="mt-4">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                                                                <FiUsers className="w-4 h-4 text-gray-500" />
                                                                <span>Test Cases ({question.testCases.length})</span>
                                                            </h4>
                                                            <div className="text-sm text-gray-600">
                                                                Total Marks: {calculateTotalMarks(question.testCases)}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                                            {question.testCases.map((testCase, tcIndex) => (
                                                                <div key={tcIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <div className="flex items-center space-x-3">
                                                                            <span className="text-sm font-medium text-gray-700">Test Case {tcIndex + 1}</span>
                                                                            <div className="flex items-center space-x-2">
                                                                                <span className="text-xs text-gray-600">Marks:</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={testCase.marks}
                                                                                    onChange={(e) => updateTestCaseMarks(index, tcIndex, e.target.value)}
                                                                                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                                    min="1"
                                                                                />
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleTestCaseVisibility(index, tcIndex)}
                                                                                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                                                                    testCase.isHidden 
                                                                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                                                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                                }`}
                                                                            >
                                                                                {testCase.isHidden ? 'Hidden' : 'Public'}
                                                                            </button>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setQuestions(prev => 
                                                                                    prev.map((q, qIdx) => 
                                                                                        qIdx === index 
                                                                                            ? {
                                                                                                ...q,
                                                                                                testCases: q.testCases.filter((_, tcIdx) => tcIdx !== tcIndex)
                                                                                            }
                                                                                            : q
                                                                                    )
                                                                                );
                                                                                toast.success('Test case removed successfully!');
                                                                            }}
                                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-all duration-200"
                                                                        >
                                                                            <FiTrash2 className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                                        <div>
                                                                            <div className="font-medium text-gray-700 mb-1">Input:</div>
                                                                            <pre className="bg-white p-2 rounded text-xs border overflow-x-auto max-h-20">
                                                                                {testCase.input}
                                                                            </pre>
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-gray-700 mb-1">Expected Output:</div>
                                                                            <pre className="bg-white p-2 rounded text-xs border overflow-x-auto max-h-20">
                                                                                {testCase.expectedOutput}
                                                                            </pre>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center space-x-6 mt-4 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <FiClock className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-600">Time Limit: <span className="font-medium text-gray-900">{question.timeLimit || 2000}ms</span></span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <FiDatabase className="w-4 h-4 text-gray-500" />
                                                        <span className="text-gray-600">Memory: <span className="font-medium text-gray-900">{question.memoryLimit || 256}MB</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditQuestion(index)}
                                                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-3 rounded-lg transition-all duration-200"
                                                >
                                                    <FiEdit className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(index)}
                                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-3 rounded-lg transition-all duration-200"
                                                >
                                                    <FiTrash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Add test cases summary */}
                                        <div className="mt-4 text-sm text-gray-600">
                                            <div className="flex items-center space-x-4">
                                                <span>Total Test Cases: {question.testCases?.length || 0}</span>
                                                <span>Total Marks: {question.testCases?.reduce((sum, tc) => sum + (tc.marks || 0), 0) || 0}</span>
                                            </div>
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
                            disabled={updating || !questions || questions.length === 0}
                            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            {updating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-5 h-5" />
                                    <span>Update Contest</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default EditContest;
