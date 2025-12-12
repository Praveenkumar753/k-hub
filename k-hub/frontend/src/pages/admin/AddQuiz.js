import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiHelpCircle } from 'react-icons/fi';
import { quizService } from '../../services/quizService';
import { courseService } from '../../services/courseService';
import Navbar from '../../components/Navbar';

const AddQuiz = () => {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [course, setCourse] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);

    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        courseId: courseId,
        moduleId: moduleId,
        questions: [],
        settings: {
            timeLimit: 0,
            allowMultipleAttempts: true,
            maxAttempts: 3,
            showResults: true,
            showCorrectAnswers: true,
            shuffleQuestions: false,
            shuffleOptions: false,
            passingScore: 60
        }
    });

    const [currentQuestion, setCurrentQuestion] = useState({
        questionText: '',
        questionType: 'mcq',
        codeSnippet: '',
        language: 'javascript',
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ],
        explanation: '',
        points: 1
    });

    const fetchCourse = async () => {
        try {
            const response = await courseService.getCourse(courseId);
            setCourse(response.course);
            const module = response.course.modules.find(m => m._id === moduleId);
            setSelectedModule(module);
        } catch (error) {
            console.error('Error fetching course:', error);
            toast.error('Failed to fetch course details');
        }
    };

    useEffect(() => {
        fetchCourse();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId]);

    const handleQuizChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('settings.')) {
            const settingName = name.split('.')[1];
            setQuizData(prev => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    [settingName]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setQuizData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleQuestionChange = (e) => {
        const { name, value } = e.target;
        setCurrentQuestion(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleOptionChange = (index, field, value) => {
        setCurrentQuestion(prev => ({
            ...prev,
            options: prev.options.map((option, i) => 
                i === index ? { ...option, [field]: value } : option
            )
        }));
    };

    const handleCorrectOptionChange = (index) => {
        if (currentQuestion.questionType === 'mcq' || currentQuestion.questionType === 'coding') {
            // For MCQ and Coding questions, only one option can be correct
            setCurrentQuestion(prev => ({
                ...prev,
                options: prev.options.map((option, i) => ({
                    ...option,
                    isCorrect: i === index
                }))
            }));
        } else {
            // For MSQ, multiple options can be correct
            setCurrentQuestion(prev => ({
                ...prev,
                options: prev.options.map((option, i) => 
                    i === index ? { ...option, isCorrect: !option.isCorrect } : option
                )
            }));
        }
    };

    const addOption = () => {
        setCurrentQuestion(prev => ({
            ...prev,
            options: [...prev.options, { text: '', isCorrect: false }]
        }));
    };

    const removeOption = (index) => {
        if (currentQuestion.options.length > 2) {
            setCurrentQuestion(prev => ({
                ...prev,
                options: prev.options.filter((_, i) => i !== index)
            }));
        }
    };

    const addQuestion = () => {
        if (!currentQuestion.questionText.trim()) {
            toast.error('Question text is required');
            return;
        }

        if (currentQuestion.questionType === 'coding' && !currentQuestion.codeSnippet.trim()) {
            toast.error('Code snippet is required for coding questions');
            return;
        }

        if (currentQuestion.options.some(opt => !opt.text.trim())) {
            toast.error('All option texts are required');
            return;
        }

        if (!currentQuestion.options.some(opt => opt.isCorrect)) {
            toast.error('At least one correct option is required');
            return;
        }

        setQuizData(prev => ({
            ...prev,
            questions: [...prev.questions, { ...currentQuestion }]
        }));

        // Reset current question
        setCurrentQuestion({
            questionText: '',
            questionType: 'mcq',
            codeSnippet: '',
            language: 'javascript',
            options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ],
            explanation: '',
            points: 1
        });

        toast.success('Question added successfully');
    };

    const removeQuestion = (index) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!quizData.title.trim()) {
            toast.error('Quiz title is required');
            return;
        }

        if (quizData.questions.length === 0) {
            toast.error('At least one question is required');
            return;
        }

        setLoading(true);
        try {
            await quizService.createQuiz(quizData);
            toast.success('Quiz created successfully');
            navigate(`/admin/courses/${courseId}/modules`);
        } catch (error) {
            console.error('Error creating quiz:', error);
            toast.error('Failed to create quiz');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <FiArrowLeft className="w-5 h-5 mr-2" />
                        Back to Modules
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Create Quiz</h1>
                    {selectedModule && (
                        <p className="text-gray-600">
                            Course: {course?.title} → Module: {selectedModule.name}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Quiz Information */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Quiz Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quiz Title *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={quizData.title}
                                    onChange={handleQuizChange}
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={quizData.description}
                                    onChange={handleQuizChange}
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quiz Settings */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Quiz Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time Limit (minutes, 0 = no limit)
                                </label>
                                <input
                                    type="number"
                                    name="settings.timeLimit"
                                    value={quizData.settings.timeLimit}
                                    onChange={handleQuizChange}
                                    min="0"
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Maximum Attempts
                                </label>
                                <input
                                    type="number"
                                    name="settings.maxAttempts"
                                    value={quizData.settings.maxAttempts}
                                    onChange={handleQuizChange}
                                    min="1"
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Passing Score (%)
                                </label>
                                <input
                                    type="number"
                                    name="settings.passingScore"
                                    value={quizData.settings.passingScore}
                                    onChange={handleQuizChange}
                                    min="0"
                                    max="100"
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="settings.allowMultipleAttempts"
                                        checked={quizData.settings.allowMultipleAttempts}
                                        onChange={handleQuizChange}
                                        className="mr-2"
                                    />
                                    Allow Multiple Attempts
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="settings.showResults"
                                        checked={quizData.settings.showResults}
                                        onChange={handleQuizChange}
                                        className="mr-2"
                                    />
                                    Show Results After Submission
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="settings.showCorrectAnswers"
                                        checked={quizData.settings.showCorrectAnswers}
                                        onChange={handleQuizChange}
                                        className="mr-2"
                                    />
                                    Show Correct Answers
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="settings.shuffleQuestions"
                                        checked={quizData.settings.shuffleQuestions}
                                        onChange={handleQuizChange}
                                        className="mr-2"
                                    />
                                    Shuffle Questions
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="settings.shuffleOptions"
                                        checked={quizData.settings.shuffleOptions}
                                        onChange={handleQuizChange}
                                        className="mr-2"
                                    />
                                    Shuffle Options
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Add Questions */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Add Question</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Question Text *
                                </label>
                                <textarea
                                    name="questionText"
                                    value={currentQuestion.questionText}
                                    onChange={handleQuestionChange}
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Question Type
                                    </label>
                                    <select
                                        name="questionType"
                                        value={currentQuestion.questionType}
                                        onChange={handleQuestionChange}
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="mcq">Multiple Choice (Single Answer)</option>
                                        <option value="msq">Multiple Select (Multiple Answers)</option>
                                        <option value="coding">Coding Question (Output)</option>
                                    </select>
                                </div>
                                {currentQuestion.questionType === 'coding' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Programming Language
                                        </label>
                                        <select
                                            name="language"
                                            value={currentQuestion.language}
                                            onChange={handleQuestionChange}
                                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="javascript">JavaScript</option>
                                            <option value="python">Python</option>
                                            <option value="java">Java</option>
                                            <option value="cpp">C++</option>
                                            <option value="c">C</option>
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Points
                                    </label>
                                    <input
                                        type="number"
                                        name="points"
                                        value={currentQuestion.points}
                                        onChange={handleQuestionChange}
                                        min="1"
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Code Snippet Section for Coding Questions */}
                            {currentQuestion.questionType === 'coding' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Code Snippet *
                                    </label>
                                    <textarea
                                        name="codeSnippet"
                                        value={currentQuestion.codeSnippet}
                                        onChange={handleQuestionChange}
                                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm bg-gray-900 text-gray-100"
                                        rows="8"
                                        placeholder="Paste your code here..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        💡 Tip: Add code that students need to analyze and predict the output
                                    </p>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Options * 
                                        <span className="text-xs text-gray-500 ml-2">
                                            ({currentQuestion.questionType === 'coding' ? 'Add possible outputs (select correct one)' : 
                                              currentQuestion.questionType === 'mcq' ? 'Select one correct answer' : 'Select all correct answers'})
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addOption}
                                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                                    >
                                        <FiPlus className="w-4 h-4 mr-1" />
                                        Add Option
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {currentQuestion.options.map((option, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <input
                                                type={currentQuestion.questionType === 'msq' ? 'checkbox' : 'radio'}
                                                name="correctOption"
                                                checked={option.isCorrect}
                                                onChange={() => handleCorrectOptionChange(index)}
                                                className="text-blue-600"
                                            />
                                            <input
                                                type="text"
                                                value={option.text}
                                                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                                placeholder={currentQuestion.questionType === 'coding' ? `Output option ${index + 1}` : `Option ${index + 1}`}
                                                className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                            />
                                            {currentQuestion.options.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeOption(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Explanation (Optional)
                                </label>
                                <textarea
                                    name="explanation"
                                    value={currentQuestion.explanation}
                                    onChange={handleQuestionChange}
                                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    rows="2"
                                    placeholder="Provide an explanation for the correct answer..."
                                />
                            </div>

                            <button
                                type="button"
                                onClick={addQuestion}
                                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                            >
                                <FiPlus className="w-5 h-5 mr-2" />
                                Add Question
                            </button>
                        </div>
                    </div>

                    {/* Questions List */}
                    {quizData.questions.length > 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                Questions ({quizData.questions.length})
                            </h2>
                            <div className="space-y-4">
                                {quizData.questions.map((question, index) => (
                                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-gray-900">
                                                {index + 1}. {question.questionText}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(index)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Type: {question.questionType === 'mcq' ? 'Multiple Choice' : 
                                                   question.questionType === 'msq' ? 'Multiple Select' : 
                                                   `Coding (${question.language})`} | 
                                            Points: {question.points}
                                        </p>
                                        
                                        {/* Show code snippet for coding questions */}
                                        {question.questionType === 'coding' && question.codeSnippet && (
                                            <div className="mb-3">
                                                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm">
                                                    <code>{question.codeSnippet}</code>
                                                </pre>
                                            </div>
                                        )}
                                        
                                        <div className="space-y-1">
                                            {question.options.map((option, optIndex) => (
                                                <div key={optIndex} className={`text-sm p-2 rounded ${option.isCorrect ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                    {option.isCorrect && '✓ '}{option.text}
                                                </div>
                                            ))}
                                        </div>
                                        {question.explanation && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                                <FiHelpCircle className="inline w-4 h-4 mr-1" />
                                                {question.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate(`/admin/courses/${courseId}/modules`)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || quizData.questions.length === 0}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            <FiSave className="w-5 h-5 mr-2" />
                            {loading ? 'Creating...' : 'Create Quiz'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default AddQuiz;