// frontend/src/pages/student/StudentExam.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetExamDetailQuery,
  useStartExamMutation,
  useSubmitAnswerMutation,
  useSubmitExamMutation,
} from '../../api/apiSlice';
import toast from 'react-hot-toast';
import { ClockIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

// ... rest of the component code remains the same

const StudentExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  const { data: exam, isLoading: examLoading } = useGetExamDetailQuery(id);
  const [startExam, { isLoading: startingExam }] = useStartExamMutation();
  const [submitAnswer] = useSubmitAnswerMutation();
  const [submitExam] = useSubmitExamMutation();

  // Start the exam
  const handleStartExam = async () => {
    try {
      const result = await startExam(id).unwrap();
      setAttemptId(result.attempt_id);
      setExamStarted(true);
      setTimeLeft(exam.duration_minutes * 60);
      toast.success('Exam started! Good luck!');
    } catch (error) {
      toast.error(error?.data?.error || 'Failed to start exam');
    }
  };

  // Submit entire exam - defined before useEffect
  const handleSubmitExam = useCallback(async () => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitExam(attemptId).unwrap();
      toast.success('Exam submitted successfully!');
      navigate(`/student/exam/results/${attemptId}`);
    } catch (error) {
      toast.error(error?.data?.error || 'Failed to submit exam');
    } finally {
      setIsSubmitting(false);
    }
  }, [attemptId, isSubmitting, submitExam, navigate]);

  // Timer effect - now has handleSubmitExam as dependency
  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft, handleSubmitExam]);

  // Handle answer change
  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Submit single answer
  const handleSubmitAnswer = async (questionId, answer) => {
    if (!attemptId) return;

    try {
      await submitAnswer({
        attemptId,
        data: {
          question_id: questionId,
          answer_text: typeof answer === 'string' ? answer : '',
          selected_option: typeof answer === 'number' ? answer : null,
        },
      }).unwrap();
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get progress
  const getProgress = () => {
    const total = exam?.questions?.length || 1;
    const answered = Object.keys(answers).length;
    return (answered / total) * 100;
  };

  // Loading state
  if (examLoading) {
    return <LoadingSpinner text="Loading exam..." />;
  }

  // Exam not found
  if (!exam) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-900">Exam Not Found</h2>
        <p className="text-gray-600 mt-2">The exam you're looking for doesn't exist or has been removed.</p>
        <Button className="mt-4" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Exam not started yet
  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-gray-600 mt-2">{exam.description}</p>
          
          <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Total Marks</p>
              <p className="text-lg font-semibold">{exam.total_marks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-lg font-semibold">{exam.duration_minutes} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Questions</p>
              <p className="text-lg font-semibold">{exam.questions?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Passing Score</p>
              <p className="text-lg font-semibold">{exam.passing_percentage}%</p>
            </div>
          </div>

          {exam.instructions && (
            <div className="mt-4 p-4 bg-info-50 border border-info-200 rounded-lg">
              <h4 className="font-medium text-info-800">Instructions</h4>
              <p className="text-sm text-info-700 mt-1 whitespace-pre-wrap">{exam.instructions}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button onClick={handleStartExam} isLoading={startingExam} className="w-full sm:w-auto">
              {startingExam ? 'Starting...' : 'Start Exam'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Exam in progress
  const questions = exam.questions || [];
  const currentQ = questions[currentQuestion];

  if (!currentQ) {
    return <LoadingSpinner text="Loading questions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-4 sticky top-0 z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{exam.title}</h2>
            <p className="text-sm text-gray-500">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-500" />
              <span className={`font-bold ${timeLeft < 60 ? 'text-danger-600' : 'text-gray-700'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {Object.keys(answers).length} / {questions.length} answered
            </div>
            <Button
              variant="success"
              size="sm"
              onClick={handleSubmitExam}
              isLoading={isSubmitting}
            >
              Submit
            </Button>
          </div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(index)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
              currentQuestion === index
                ? 'bg-primary-600 text-white'
                : answers[q.id]
                ? 'bg-success-100 text-success-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Display */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {currentQ.marks} {currentQ.marks === 1 ? 'mark' : 'marks'}
            </span>
            <span className="text-xs text-gray-400 capitalize">{currentQ.question_type}</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-2">
            {currentQ.question_text}
          </h3>
        </div>

        {/* MCQ */}
        {currentQ.question_type === 'mcq' && (
          <div className="space-y-3">
            {currentQ.options?.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  answers[currentQ.id] === idx
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question_${currentQ.id}`}
                  value={idx}
                  checked={answers[currentQ.id] === idx}
                  onChange={() => {
                    handleAnswerChange(currentQ.id, idx);
                    handleSubmitAnswer(currentQ.id, idx);
                  }}
                  className="h-4 w-4 text-primary-600"
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* True/False */}
        {currentQ.question_type === 'true_false' && (
          <div className="space-y-3">
            {['True', 'False'].map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  answers[currentQ.id] === option
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`question_${currentQ.id}`}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={() => {
                    handleAnswerChange(currentQ.id, option);
                    handleSubmitAnswer(currentQ.id, option);
                  }}
                  className="h-4 w-4 text-primary-600"
                />
                <span className="ml-3 text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )}

        {/* Short/Long Answer */}
        {(currentQ.question_type === 'short' || currentQ.question_type === 'long') && (
          <textarea
            value={answers[currentQ.id] || ''}
            onChange={(e) => {
              const value = e.target.value;
              handleAnswerChange(currentQ.id, value);
              // Debounce submission for descriptive answers
              clearTimeout(window._submitTimeout);
              window._submitTimeout = setTimeout(() => {
                handleSubmitAnswer(currentQ.id, value);
              }, 1000);
            }}
            rows={currentQ.question_type === 'long' ? 6 : 3}
            className="input-field"
            placeholder={`Type your ${currentQ.question_type === 'short' ? 'short' : 'detailed'} answer here...`}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQuestion === questions.length - 1}
          >
            Next
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="success" onClick={handleSubmitExam} isLoading={isSubmitting}>
            Submit Exam
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentExam;