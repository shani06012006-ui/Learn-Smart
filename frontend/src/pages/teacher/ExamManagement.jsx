// frontend/src/pages/teacher/ExamManagement.jsx

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetExamsQuery,
  useCreateExamMutation,
  useDeleteExamMutation,
  useGetClassDetailQuery,
} from '../../api/apiSlice';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ... rest of the component code remains the same


const ExamManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exam_type: 'exam',
    difficulty: 'medium',
    total_marks: 100,
    duration_minutes: 60,
    start_time: '',
    end_time: '',
    passing_percentage: 40,
    instructions: '',
  });

  const { data: classData } = useGetClassDetailQuery(id);
  const { data: exams = [], isLoading, refetch } = useGetExamsQuery(id);
  const [createExam, { isLoading: isCreating }] = useCreateExamMutation();
  const [deleteExam, { isLoading: isDeleting }] = useDeleteExamMutation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate dates
    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    
    if (endTime <= startTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      await createExam({ classId: id, data: formData }).unwrap();
      toast.success('Exam created successfully!');
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        exam_type: 'exam',
        difficulty: 'medium',
        total_marks: 100,
        duration_minutes: 60,
        start_time: '',
        end_time: '',
        passing_percentage: 40,
        instructions: '',
      });
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to create exam');
    }
  };

  const handleDelete = async () => {
    if (!selectedExam) return;
    try {
      await deleteExam(selectedExam.id).unwrap();
      toast.success('Exam deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedExam(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to delete exam');
    }
  };

  const getStatusBadge = (exam) => {
    const now = new Date();
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);

    if (!exam.is_published) {
      return <span className="badge-warning">Draft</span>;
    }
    if (now < start) {
      return <span className="badge-info">Upcoming</span>;
    }
    if (now >= start && now <= end) {
      return <span className="badge-success">Active</span>;
    }
    return <span className="badge-gray">Ended</span>;
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading exams..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/teacher/classes')}
            className="text-sm text-primary-600 hover:text-primary-700 mb-1"
          >
            ← Back to Classes
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {classData?.name || 'Class'} - Exams
          </h1>
          <p className="text-gray-600">Create and manage exams for your students</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Exam
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-full">
              <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {exams.filter(e => {
                  const now = new Date();
                  const start = new Date(e.start_time);
                  const end = new Date(e.end_time);
                  return e.is_published && now >= start && now <= end;
                }).length}
              </p>
            </div>
            <div className="p-3 bg-success-50 rounded-full">
              <PlayIcon className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">
                {exams.filter(e => {
                  const now = new Date();
                  const start = new Date(e.start_time);
                  return e.is_published && now < start;
                }).length}
              </p>
            </div>
            <div className="p-3 bg-info-50 rounded-full">
              <ClockIcon className="h-6 w-6 text-info-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Drafts</p>
              <p className="text-2xl font-bold text-gray-900">
                {exams.filter(e => !e.is_published).length}
              </p>
            </div>
            <div className="p-3 bg-warning-50 rounded-full">
              <PencilIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Exams List */}
      {exams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900">No exams created yet</h3>
          <p className="text-gray-500 mt-1">Create your first exam for this class</p>
          <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
            Create Exam
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                    {getStatusBadge(exam)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>📝 {exam.total_marks} marks</span>
                    <span>⏱ {exam.duration_minutes} min</span>
                    <span>📊 {exam.difficulty}</span>
                    <span>📋 {exam.exam_type}</span>
                    <span>
                      📅 {new Date(exam.start_time).toLocaleDateString()} 
                      at {new Date(exam.start_time).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/teacher/exams/${exam.id}/questions`)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Questions
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setSelectedExam(exam);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Exam" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Exam Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Mid-Term Exam"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exam Type
              </label>
              <select
                name="exam_type"
                value={formData.exam_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="exam">Exam</option>
                <option value="quiz">Quiz</option>
                <option value="practice">Practice Test</option>
              </select>
            </div>
          </div>

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the exam"
            as="textarea"
            rows={2}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Total Marks"
              name="total_marks"
              type="number"
              value={formData.total_marks}
              onChange={handleChange}
              required
            />
            <Input
              label="Duration (minutes)"
              name="duration_minutes"
              type="number"
              value={formData.duration_minutes}
              onChange={handleChange}
              required
            />
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Time"
              name="start_time"
              type="datetime-local"
              value={formData.start_time}
              onChange={handleChange}
              required
            />
            <Input
              label="End Time"
              name="end_time"
              type="datetime-local"
              value={formData.end_time}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Passing Percentage"
            name="passing_percentage"
            type="number"
            value={formData.passing_percentage}
            onChange={handleChange}
            placeholder="40"
          />

          <Input
            label="Instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            placeholder="Instructions for students"
            as="textarea"
            rows={3}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Exam
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Exam">
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedExam?.title}</strong>?
            All questions and student attempts will also be deleted.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamManagement;