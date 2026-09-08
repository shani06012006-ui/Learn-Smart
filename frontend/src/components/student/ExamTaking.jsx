// frontend/src/components/student/ExamTaking.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const ExamTaking = ({ exam, questions, onSubmit, timeLimit }) => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(timeLimit * 60); // in seconds
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0 && !submitted) {
      handleSubmit();
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unanswered.length} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitted(true);
    try {
      await onSubmit(answers);
      toast.success('Exam submitted successfully!');
      navigate('/student/dashboard');
    } catch (error) {
      toast.error('Failed to submit exam. Please try again.');
      setSubmitted(false);
    }
  };

  const progress = ((Object.keys(answers).length / questions.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
            <p className="text-gray-600 mt-1">{exam.description}</p>
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
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
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
        {questions.length > 0 && (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
                <span className="text-sm text-gray-500">{questions[currentQuestion].marks} marks</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                {questions[currentQuestion].question_text}
              </h3>
            </div>

            {/* Question Type Specific Rendering */}
            {questions[currentQuestion].question_type === 'mcq' && (
              <div className="space-y-3">
                {questions[currentQuestion].options?.map((option, idx) => (
                  <label
                    key={idx}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question_${questions[currentQuestion].id}`}
                      value={idx}
                      checked={answers[questions[currentQuestion].id] === idx}
                      onChange={() => handleAnswerChange(questions[currentQuestion].id, idx)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {questions[currentQuestion].question_type === 'true_false' && (
              <div className="space-y-3">
                {['True', 'False'].map((option, idx) => (
                  <label
                    key={idx}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name={`question_${questions[currentQuestion].id}`}
                      value={option}
                      checked={answers[questions[currentQuestion].id] === option}
                      onChange={() => handleAnswerChange(questions[currentQuestion].id, option)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {(questions[currentQuestion].question_type === 'short' || 
              questions[currentQuestion].question_type === 'long') && (
              <textarea
                value={answers[questions[currentQuestion].id] || ''}
                onChange={(e) => handleAnswerChange(questions[currentQuestion].id, e.target.value)}
                rows={questions[currentQuestion].question_type === 'long' ? 6 : 3}
                className="input-field"
                placeholder="Type your answer here..."
              />
            )}
          </>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="btn-secondary disabled:opacity-50"
        >
          Previous
        </button>
        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentQuestion === questions.length - 1}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="btn-success"
          >
            {submitted ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamTaking;