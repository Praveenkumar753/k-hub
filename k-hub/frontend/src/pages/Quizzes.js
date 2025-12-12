import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    FiClock, 
    FiCheckCircle, 
    FiXCircle, 
    FiPlay, 
    FiArrowLeft, 
    FiHelpCircle,
    FiAward,
    FiRefreshCw
} from 'react-icons/fi';
import { quizService } from '../services/quizService';
import Navbar from '../components/Navbar';

const Quizzes = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [taking, setTaking] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [attempts, setAttempts] = useState([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        fetchQuiz();
        fetchAttempts();
    }, [quizId]);

    useEffect(() => {
        let interval = null;
        if (taking && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => {
                    if (time <= 1) {
                        handleSubmit(true); // Auto-submit when time runs out
                        return 0;
                    }
                    return time - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [taking, timeLeft]);

    const fetchQuiz = async () => {
        try {
            const response = await quizService.getQuiz(quizId);
            setQuiz(response.quiz);
            
            if (response.quiz.settings.timeLimit > 0) {
                setTimeLeft(response.quiz.settings.timeLimit * 60); // Convert minutes to seconds
            }
        } catch (error) {
            console.error('Error fetching quiz:', error);
            toast.error('Failed to load quiz');
        } finally {
            setLoading(false);
        }
    };

    const fetchAttempts = async () => {
        try {
            const response = await quizService.getQuizAttempts(quizId);
            setAttempts(response.attempts);
        } catch (error) {
            console.error('Error fetching attempts:', error);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startQuiz = () => {
        setTaking(true);
        setStartTime(Date.now());
        setCurrentQuestionIndex(0);
        setAnswers({});
        setSubmitted(false);
        setResult(null);
        setShowResults(false);
        
        if (quiz.settings.timeLimit > 0) {
            setTimeLeft(quiz.settings.timeLimit * 60);
        }
    };

    const handleAnswerChange = (questionId, optionId, isChecked) => {
        const question = quiz.questions[currentQuestionIndex];
        
        setAnswers(prev => {
            const newAnswers = { ...prev };
            
            if (question.questionType === 'mcq' || question.questionType === 'coding') {
                // For MCQ and Coding questions, replace the answer (single selection)
                newAnswers[questionId] = [optionId];
            } else {
                // For MSQ, add/remove from array
                if (!newAnswers[questionId]) {
                    newAnswers[questionId] = [];
                }
                
                if (isChecked) {
                    if (!newAnswers[questionId].includes(optionId)) {
                        newAnswers[questionId] = [...newAnswers[questionId], optionId];
                    }
                } else {
                    newAnswers[questionId] = newAnswers[questionId].filter(id => id !== optionId);
                }
            }
            
            return newAnswers;
        });
    };

    const goToQuestion = (index) => {
        setCurrentQuestionIndex(index);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit) {
            const unanswered = quiz.questions.filter(q => !answers[q._id] || answers[q._id].length === 0);
            if (unanswered.length > 0) {
                const confirmSubmit = window.confirm(
                    `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`
                );
                if (!confirmSubmit) return;
            }
        }

        setLoading(true);
        try {
            const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
            const submissionAnswers = quiz.questions.map(q => ({
                questionId: q._id,
                selectedOptions: answers[q._id] || []
            }));

            const response = await quizService.submitQuiz(quizId, submissionAnswers, timeSpent);
            setResult(response);
            setSubmitted(true);
            setTaking(false);
            
            if (autoSubmit) {
                toast.info('Quiz auto-submitted due to time limit');
            } else {
                toast.success('Quiz submitted successfully');
            }
            
            fetchAttempts(); // Refresh attempts
        } catch (error) {
            console.error('Error submitting quiz:', error);
            toast.error('Failed to submit quiz');
        } finally {
            setLoading(false);
        }
    };

    const retakeQuiz = () => {
        window.location.reload(); // Simple way to reset everything
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

    if (!quiz) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-blue-600 hover:text-blue-700"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </>
        );
    }

    const currentQuestion = taking ? quiz.questions[currentQuestionIndex] : null;
    const canAttempt = attempts.length < quiz.settings.maxAttempts && 
                     (quiz.settings.allowMultipleAttempts || attempts.length === 0);

    return (
        <>
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {!taking && !submitted ? (
                    // Quiz Overview
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
                        >
                            <FiArrowLeft className="w-5 h-5 mr-2" />
                            Back to Course
                        </button>

                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
                                {quiz.description && (
                                    <p className="text-gray-600 text-lg">{quiz.description}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <h3 className="font-semibold text-blue-900 mb-4">Quiz Details</h3>
                                    <div className="space-y-2 text-blue-800">
                                        <p>📝 {quiz.questions.length} Questions</p>
                                        <p>⭐ {quiz.totalPoints} Total Points</p>
                                        {quiz.settings.timeLimit > 0 && (
                                            <p>⏱️ {quiz.settings.timeLimit} Minutes</p>
                                        )}
                                        <p>🎯 Passing Score: {quiz.settings.passingScore}%</p>
                                        <p>🔄 Max Attempts: {quiz.settings.maxAttempts}</p>
                                    </div>
                                </div>

                                <div className="bg-green-50 p-6 rounded-lg">
                                    <h3 className="font-semibold text-green-900 mb-4">Your Progress</h3>
                                    <div className="space-y-2 text-green-800">
                                        <p>📊 Attempts: {attempts.length}/{quiz.settings.maxAttempts}</p>
                                        {attempts.length > 0 && (
                                            <>
                                                <p>🏆 Best Score: {Math.max(...attempts.map(a => a.percentage))}%</p>
                                                <p>📈 Last Score: {attempts[0]?.percentage}%</p>
                                                <p className={attempts[0]?.isPassed ? 'text-green-600' : 'text-red-600'}>
                                                    {attempts[0]?.isPassed ? '✅ Passed' : '❌ Not Passed'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Previous Attempts */}
                            {attempts.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4">Previous Attempts</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-300 px-4 py-2">Attempt</th>
                                                    <th className="border border-gray-300 px-4 py-2">Score</th>
                                                    <th className="border border-gray-300 px-4 py-2">Percentage</th>
                                                    <th className="border border-gray-300 px-4 py-2">Status</th>
                                                    <th className="border border-gray-300 px-4 py-2">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attempts.map((attempt, index) => (
                                                    <tr key={attempt._id}>
                                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                                            {attempt.attemptNumber}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                                            {attempt.score}/{quiz.totalPoints}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                                            {attempt.percentage}%
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                                            {attempt.isPassed ? (
                                                                <span className="text-green-600">✅ Passed</span>
                                                            ) : (
                                                                <span className="text-red-600">❌ Failed</span>
                                                            )}
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                                            {new Date(attempt.submittedAt).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div className="text-center">
                                {canAttempt ? (
                                    <button
                                        onClick={startQuiz}
                                        className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 text-lg font-semibold flex items-center mx-auto"
                                    >
                                        <FiPlay className="w-6 h-6 mr-3" />
                                        {attempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
                                    </button>
                                ) : (
                                    <div className="text-gray-600">
                                        <p className="text-lg font-semibold mb-2">No more attempts available</p>
                                        <p>You have used all {quiz.settings.maxAttempts} attempts for this quiz.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : taking ? (
                    // Taking Quiz
                    <div className="max-w-4xl mx-auto">
                        {/* Quiz Header */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                                <div className="flex items-center space-x-4">
                                    {quiz.settings.timeLimit > 0 && (
                                        <div className={`flex items-center px-4 py-2 rounded-lg ${
                                            timeLeft < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            <FiClock className="w-5 h-5 mr-2" />
                                            {formatTime(timeLeft)}
                                        </div>
                                    )}
                                    <div className="text-gray-600">
                                        Question {currentQuestionIndex + 1} of {quiz.questions.length}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Question Navigation */}
                        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                                {quiz.questions.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToQuestion(index)}
                                        className={`w-10 h-10 rounded-lg border-2 text-sm font-semibold ${
                                            index === currentQuestionIndex
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : answers[quiz.questions[index]._id] && answers[quiz.questions[index]._id].length > 0
                                                ? 'bg-green-100 text-green-800 border-green-300'
                                                : 'bg-gray-100 text-gray-600 border-gray-300'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Current Question */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="mb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Question {currentQuestionIndex + 1}
                                    </h2>
                                    <div className="text-sm text-gray-600">
                                        {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <p className="text-lg text-gray-800 mb-4">{currentQuestion.questionText}</p>
                                
                                {/* Show code snippet for coding questions */}
                                {currentQuestion.questionType === 'coding' && currentQuestion.codeSnippet && (
                                    <div className="mb-6">
                                        <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
                                            <div className="bg-gray-800 px-4 py-2 text-xs text-gray-300 flex items-center justify-between">
                                                <span>💻 {currentQuestion.language}</span>
                                                <span>Analyze the code below</span>
                                            </div>
                                            <pre className="p-4 overflow-x-auto">
                                                <code className="font-mono text-sm">{currentQuestion.codeSnippet}</code>
                                            </pre>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="text-sm text-blue-600 mb-4">
                                    {currentQuestion.questionType === 'coding' 
                                        ? '📍 What is the output of this program?' 
                                        : currentQuestion.questionType === 'mcq' 
                                        ? '📍 Select one answer' 
                                        : '📍 Select all correct answers'
                                    }
                                </div>
                            </div>

                            <div className="space-y-3">
                                {currentQuestion.options.map((option, index) => (
                                    <label
                                        key={option._id}
                                        className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <input
                                            type={currentQuestion.questionType === 'msq' ? 'checkbox' : 'radio'}
                                            name={`question_${currentQuestion._id}`}
                                            checked={answers[currentQuestion._id]?.includes(option._id) || false}
                                            onChange={(e) => handleAnswerChange(
                                                currentQuestion._id, 
                                                option._id, 
                                                e.target.checked
                                            )}
                                            className="mr-4 text-blue-600"
                                        />
                                        <span className="text-gray-800">{option.text}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={prevQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            <div className="flex space-x-4">
                                {currentQuestionIndex === quiz.questions.length - 1 ? (
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                                    >
                                        Submit Quiz
                                    </button>
                                ) : (
                                    <button
                                        onClick={nextQuestion}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Next
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Quiz Results
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
                                    result.isPassed ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                    {result.isPassed ? (
                                        <FiCheckCircle className="w-12 h-12 text-green-600" />
                                    ) : (
                                        <FiXCircle className="w-12 h-12 text-red-600" />
                                    )}
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                    {result.isPassed ? 'Congratulations!' : 'Quiz Completed'}
                                </h1>
                                <p className="text-gray-600 text-lg">
                                    {result.isPassed 
                                        ? 'You have successfully passed the quiz!' 
                                        : 'You can retake the quiz to improve your score.'
                                    }
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="text-center p-6 bg-blue-50 rounded-lg">
                                    <div className="text-3xl font-bold text-blue-600 mb-2">
                                        {result.score}/{result.totalPoints}
                                    </div>
                                    <div className="text-blue-800">Score</div>
                                </div>
                                <div className="text-center p-6 bg-purple-50 rounded-lg">
                                    <div className="text-3xl font-bold text-purple-600 mb-2">
                                        {result.percentage}%
                                    </div>
                                    <div className="text-purple-800">Percentage</div>
                                </div>
                                <div className="text-center p-6 bg-green-50 rounded-lg">
                                    <div className={`text-3xl font-bold mb-2 ${
                                        result.isPassed ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {result.isPassed ? 'PASS' : 'FAIL'}
                                    </div>
                                    <div className={result.isPassed ? 'text-green-800' : 'text-red-800'}>
                                        Status
                                    </div>
                                </div>
                            </div>

                            {quiz.settings.showResults && quiz.settings.showCorrectAnswers && (
                                <div className="mb-8">
                                    <button
                                        onClick={() => setShowResults(!showResults)}
                                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                                    >
                                        <FiHelpCircle className="w-5 h-5 mr-2" />
                                        {showResults ? 'Hide' : 'Show'} Detailed Results
                                    </button>
                                    
                                    {showResults && result.correctAnswers && (
                                        <div className="space-y-6">
                                            {quiz.questions.map((question, index) => {
                                                const userAnswer = result.answers.find(a => a.questionId === question._id);
                                                const correctAnswer = result.correctAnswers.find(ca => ca.questionId === question._id);
                                                
                                                return (
                                                    <div key={question._id} className="border rounded-lg p-6">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <h3 className="font-semibold text-lg">
                                                                {index + 1}. {question.questionText}
                                                            </h3>
                                                            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                                userAnswer?.isCorrect 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {userAnswer?.isCorrect ? 'Correct' : 'Incorrect'}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="space-y-2">
                                                            {question.options.map(option => {
                                                                const isUserSelected = userAnswer?.selectedOptions.includes(option._id);
                                                                const isCorrect = correctAnswer?.correctOptions.includes(option._id);
                                                                
                                                                return (
                                                                    <div
                                                                        key={option._id}
                                                                        className={`p-3 rounded-lg border-2 ${
                                                                            isCorrect 
                                                                                ? 'border-green-500 bg-green-50' 
                                                                                : isUserSelected 
                                                                                ? 'border-red-500 bg-red-50' 
                                                                                : 'border-gray-200 bg-gray-50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center">
                                                                            {isCorrect && <span className="text-green-600 mr-2">✓</span>}
                                                                            {isUserSelected && !isCorrect && <span className="text-red-600 mr-2">✗</span>}
                                                                            <span>{option.text}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        
                                                        {correctAnswer?.explanation && (
                                                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                                                <div className="text-blue-800 font-semibold mb-2">Explanation:</div>
                                                                <div className="text-blue-700">{correctAnswer.explanation}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Back to Course
                                </button>
                                {canAttempt && (
                                    <button
                                        onClick={retakeQuiz}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                    >
                                        <FiRefreshCw className="w-5 h-5 mr-2" />
                                        Retake Quiz
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Quizzes;