import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiHelpCircle } from 'react-icons/fi';
import { quizService } from '../../services/quizService';
import { courseService } from '../../services/courseService';
import Navbar from '../../components/Navbar';

const EditQuiz = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [course, setCourse] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);

    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        courseId: '',
        moduleId: '',
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
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ],
        explanation: '',
        points: 1
    });

    const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);

    useEffect(() => {
        fetchQuizData();
    }, [quizId]);

    const fetchQuizData = async () => {
        try {
            setInitialLoading(true);
            // Get quiz details with admin privileges to see correct answers
            const quizResponse = await fetch(`/api/quizzes/${quizId}/admin`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!quizResponse.ok) {
                throw new Error('Failed to fetch quiz');
            }
            
            const quizResult = await quizResponse.json();
            const quiz = quizResult.quiz;

            // Extract courseId and moduleId properly (handle both ObjectId and populated objects)
            const courseIdString = typeof quiz.courseId === 'object' ? quiz.courseId._id : quiz.courseId;
            const moduleIdString = typeof quiz.moduleId === 'object' ? quiz.moduleId._id : quiz.moduleId;

            console.log('Quiz data:', quiz);
            console.log('Course ID:', courseIdString);
            console.log('Module ID:', moduleIdString);

            // Fetch course details
            const courseResponse = await courseService.getCourse(courseIdString);
            setCourse(courseResponse.course);
            
            const module = courseResponse.course.modules.find(m => m._id === moduleIdString);
            setSelectedModule(module);

            // Set quiz data with proper question handling
            setQuizData({
                title: quiz.title,
                description: quiz.description || '',
                courseId: courseIdString,
                moduleId: moduleIdString,
                questions: quiz.questions || [],
                settings: {
                    timeLimit: quiz.settings?.timeLimit || 0,
                    allowMultipleAttempts: quiz.settings?.allowMultipleAttempts !== false,
                    maxAttempts: quiz.settings?.maxAttempts || 3,
                    showResults: quiz.settings?.showResults !== false,
                    showCorrectAnswers: quiz.settings?.showCorrectAnswers !== false,
                    shuffleQuestions: quiz.settings?.shuffleQuestions || false,
                    shuffleOptions: quiz.settings?.shuffleOptions || false,
                    passingScore: quiz.settings?.passingScore || 60
                }
            });
        } catch (error) {
            console.error('Error fetching quiz:', error);
            toast.error('Failed to load quiz data');
            navigate('/admin/courses');
        } finally {
            setInitialLoading(false);
        }
    };

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
        if (currentQuestion.questionType === 'mcq') {
            // For MCQ, only one option can be correct
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

        if (currentQuestion.options.some(opt => !opt.text.trim())) {
            toast.error('All option texts are required');
            return;
        }

        if (!currentQuestion.options.some(opt => opt.isCorrect)) {
            toast.error('At least one correct option is required');
            return;
        }

        if (editingQuestionIndex >= 0) {
            // Update existing question
            setQuizData(prev => ({
                ...prev,
                questions: prev.questions.map((q, i) => 
                    i === editingQuestionIndex ? { ...currentQuestion } : q
                )
            }));
            setEditingQuestionIndex(-1);
            toast.success('Question updated successfully');
        } else {
            // Add new question
            setQuizData(prev => ({
                ...prev,
                questions: [...prev.questions, { ...currentQuestion }]
            }));
            toast.success('Question added successfully');
        }

        // Reset current question
        setCurrentQuestion({
            questionText: '',
            questionType: 'mcq',
            options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ],
            explanation: '',
            points: 1
        });
    };

    const editQuestion = (index) => {
        const question = quizData.questions[index];
        setCurrentQuestion({ ...question });
        setEditingQuestionIndex(index);
    };

    const cancelEdit = () => {
        setEditingQuestionIndex(-1);
        setCurrentQuestion({
            questionText: '',
            questionType: 'mcq',
            options: [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ],
            explanation: '',
            points: 1
        });
    };

    const removeQuestion = (index) => {
        setQuizData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
        if (editingQuestionIndex === index) {
            cancelEdit();
        } else if (editingQuestionIndex > index) {
            setEditingQuestionIndex(editingQuestionIndex - 1);
        }
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
            await quizService.updateQuiz(quizId, quizData);
            toast.success('Quiz updated successfully');
            navigate(`/admin/courses/${quizData.courseId}/modules`);
        } catch (error) {
            console.error('Error updating quiz:', error);
            toast.error('Failed to update quiz');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-center items-center min-h-96">
                        <div className="text-lg">Loading quiz data...</div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/admin/courses/${quizData.courseId}/modules`)}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <FiArrowLeft className="w-5 h-5 mr-2" />
                        Back to Modules
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Quiz</h1>
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

                    {/* Add/Edit Questions */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingQuestionIndex >= 0 ? 'Edit Question' : 'Add Question'}
                        </h2>
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
                                    </select>
                                </div>
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

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Options * 
                                        <span className="text-xs text-gray-500 ml-2">
                                            ({currentQuestion.questionType === 'mcq' ? 'Select one correct answer' : 'Select all correct answers'})
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
                                                type={currentQuestion.questionType === 'mcq' ? 'radio' : 'checkbox'}
                                                name="correctOption"
                                                checked={option.isCorrect}
                                                onChange={() => handleCorrectOptionChange(index)}
                                                className="text-blue-600"
                                            />
                                            <input
                                                type="text"
                                                value={option.text}
                                                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                                placeholder={`Option ${index + 1}`}
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

                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                                >
                                    <FiSave className="w-5 h-5 mr-2" />
                                    {editingQuestionIndex >= 0 ? 'Update Question' : 'Add Question'}
                                </button>
                                {editingQuestionIndex >= 0 && (
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
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
                                    <div 
                                        key={index} 
                                        className={`border rounded-lg p-4 ${editingQuestionIndex === index ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-gray-900">
                                                {index + 1}. {question.questionText}
                                            </h3>
                                            <div className="flex space-x-1">
                                                <button
                                                    type="button"
                                                    onClick={() => editQuestion(index)}
                                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(index)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            Type: {question.questionType === 'mcq' ? 'Multiple Choice' : 'Multiple Select'} | 
                                            Points: {question.points}
                                        </p>
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
                            onClick={() => navigate(`/admin/courses/${quizData.courseId}/modules`)}
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
                            {loading ? 'Updating...' : 'Update Quiz'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default EditQuiz;