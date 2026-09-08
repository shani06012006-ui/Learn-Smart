// frontend/src/pages/student/ExamResults.jsx

import { useParams, useNavigate } from 'react-router-dom';
import { useGetExamResultsQuery } from '../../api/apiSlice';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const ExamResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { data: results, isLoading } = useGetExamResultsQuery(attemptId);

  if (isLoading) {
    return <LoadingSpinner text="Loading results..." />;
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-900">Results Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const percentage = (results.total_marks_obtained / results.exam.total_marks) * 100;
  const passed = percentage >= results.exam.passing_percentage;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className={`text-6xl mb-4 ${passed ? 'text-success-500' : 'text-danger-500'}`}>
            {passed ? '🎉' : '😢'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{results.exam.title}</h1>
          <p className="text-gray-600 mt-1">Exam Results</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Score</p>
            <p className="text-2xl font-bold text-gray-900">
              {results.total_marks_obtained} / {results.exam.total_marks}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Percentage</p>
            <p className={`text-2xl font-bold ${passed ? 'text-success-600' : 'text-danger-600'}`}>
              {percentage.toFixed(1)}%
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Status</p>
            <span className={`text-lg font-bold ${passed ? 'text-success-600' : 'text-danger-600'}`}>
              {passed ? 'PASSED' : 'FAILED'}
            </span>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-gray-500">Time Taken</p>
            <p className="text-lg font-bold text-gray-900">
              {results.time_taken ? `${Math.floor(results.time_taken / 60)}m ${results.time_taken % 60}s` : 'N/A'}
            </p>
          </Card>
        </div>
      </div>

      {/* Answer Review */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Answer Review</h2>
        <div className="space-y-4">
          {results.answers?.map((answer, index) => (
            <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Question {index + 1}</p>
                  <p className="font-medium text-gray-900">{answer.question.question_text}</p>
                  
                  <div className="mt-2">
                    <p className="text-sm">
                      <span className="text-gray-500">Your Answer:</span>
                      <span className={answer.is_correct ? 'text-success-600' : 'text-danger-600'}>
                        {' '}
                        {answer.answer_text || answer.selected_option !== null 
                          ? (typeof answer.selected_option === 'number' 
                              ? answer.question.options?.[answer.selected_option] 
                              : answer.answer_text)
                          : 'Not answered'}
                      </span>
                    </p>
                    {!answer.is_correct && answer.question.correct_answer && (
                      <p className="text-sm text-success-600 mt-1">
                        Correct Answer: {answer.question.correct_answer}
                      </p>
                    )}
                    {answer.question.explanation && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                        💡 {answer.question.explanation}
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  {answer.is_correct ? (
                    <CheckCircleIcon className="h-6 w-6 text-success-500" />
                  ) : answer.is_correct === null ? (
                    <ClockIcon className="h-6 w-6 text-gray-400" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-danger-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button onClick={() => navigate('/student/dashboard')}>
          Back to Dashboard
        </Button>
        {!passed && (
          <Button variant="warning" onClick={() => navigate(`/student/exam/${results.exam.id}`)}>
            Retry Exam
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExamResults;