// frontend/src/components/teacher/AIQuestionGenerator.jsx

import { useState, useRef } from 'react';
import { useGenerateQuestionsMutation } from '../../api/apiSlice';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

const AIQuestionGenerator = ({ isOpen, onClose, onQuestionsGenerated }) => {
  const [formData, setFormData] = useState({
    text: '',
    question_type: 'mcq',
    difficulty: 'medium',
    count: 5,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef();

  const [generateQuestions] = useGenerateQuestionsMutation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!formData.text && !selectedFile) {
      toast.error('Please provide text or upload a file');
      return;
    }

    setIsGenerating(true);

    const formDataToSend = new FormData();
    formDataToSend.append('text', formData.text);
    formDataToSend.append('question_type', formData.question_type);
    formDataToSend.append('difficulty', formData.difficulty);
    formDataToSend.append('count', formData.count);

    if (selectedFile) {
      formDataToSend.append('file', selectedFile);
    }

    try {
      const result = await generateQuestions(formDataToSend).unwrap();
      setGeneratedQuestions(result.questions || []);
      toast.success(`Generated ${result.questions?.length || 0} questions!`);
    } catch (error) {
      toast.error(error?.data?.error || 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddQuestions = () => {
    if (generatedQuestions.length > 0) {
      onQuestionsGenerated(generatedQuestions);
      toast.success(`Added ${generatedQuestions.length} questions to exam`);
      onClose();
      setGeneratedQuestions([]);
      setSelectedFile(null);
      setFormData({
        text: '',
        question_type: 'mcq',
        difficulty: 'medium',
        count: 5,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Question Generator" size="xl">
      <div className="space-y-6">
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <SparklesIcon className="h-6 w-6 text-primary-600 mt-1" />
            <div>
              <p className="text-sm font-medium text-primary-800">AI-Powered Question Generation</p>
              <p className="text-xs text-primary-600">
                Provide text, upload a PDF/Image, or paste a link to generate questions automatically.
                The AI will analyze the content and create relevant questions.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                name="question_type"
                value={formData.question_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="short">Short Answer</option>
                <option value="long">Long Answer</option>
                <option value="true_false">True/False</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="input-field"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                name="count"
                value={formData.count}
                onChange={handleChange}
                min="1"
                max="20"
                className="input-field"
              />
            </div>
          </div>

          <Input
            label="Text Content"
            name="text"
            value={formData.text}
            onChange={handleChange}
            placeholder="Paste your text content here for AI to generate questions..."
            as="textarea"
            rows={4}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Or Upload File (PDF/Image)
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.gif"
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                  <span className="text-sm text-gray-600">{selectedFile.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="text-danger-600 hover:text-danger-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div>
                  <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, PNG, JPG, GIF supported
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" isLoading={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Questions'}
            </Button>
          </div>
        </form>

        {/* Generated Questions Preview */}
        {generatedQuestions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Generated Questions ({generatedQuestions.length})
            </h4>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {generatedQuestions.map((q, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Q{index + 1}: {q.question_text}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {q.options.map((opt, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              {String.fromCharCode(65 + idx)}. {opt}
                            </p>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        ✓ {q.correct_answer}
                      </p>
                      {q.explanation && (
                        <p className="text-xs text-gray-400 mt-1">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 ml-2">
                      {q.marks || 10} marks
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <Button variant="secondary" onClick={() => setGeneratedQuestions([])}>
                Clear All
              </Button>
              <Button onClick={handleAddQuestions}>
                Add All to Exam
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AIQuestionGenerator;