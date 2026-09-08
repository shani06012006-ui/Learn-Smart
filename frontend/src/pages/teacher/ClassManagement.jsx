// frontend/src/pages/teacher/ClassManagement.jsx

import React, { useState } from 'react';
import { useGetClassesQuery, useCreateClassMutation } from '../../api/apiSlice';
import toast from 'react-hot-toast';
import { PlusIcon, MagnifyingGlassIcon, UserGroupIcon, AcademicCapIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ClassCard from '../../components/teacher/ClassCard';

const ClassManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    grade_level: '',
    section: '',
    description: '',
    academic_year: new Date().getFullYear().toString(),
  });

  const { data: classes = [], isLoading, refetch } = useGetClassesQuery();
  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.subject) {
      toast.error('Name and subject are required');
      return;
    }

    try {
      await createClass(formData).unwrap();
      toast.success('Class created successfully!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        subject: '',
        grade_level: '',
        section: '',
        description: '',
        academic_year: new Date().getFullYear().toString(),
      });
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to create class');
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner text="Loading your classes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600">Manage your classes and students</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-full">
              <AcademicCapIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.reduce((acc, cls) => acc + (cls.student_count || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-secondary-50 rounded-full">
              <UserGroupIcon className="h-6 w-6 text-secondary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(classes.map(c => c.subject)).size}
              </p>
            </div>
            <div className="p-3 bg-warning-50 rounded-full">
              <BookOpenIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Classes</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.filter(c => c.is_active !== false).length}
              </p>
            </div>
            <div className="p-3 bg-success-50 rounded-full">
              <div className="h-6 w-6 rounded-full bg-success-500 animate-pulse"></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900">No classes yet</h3>
          <p className="text-gray-500 mt-1">Create your first class to get started</p>
          <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
            Create Class
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <ClassCard key={cls.id} classData={cls} />
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Class">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Class Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Class 10A"
              required
            />
            <Input
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g., Mathematics"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Grade Level"
              name="grade_level"
              value={formData.grade_level}
              onChange={handleChange}
              placeholder="e.g., 10"
            />
            <Input
              label="Section"
              name="section"
              value={formData.section}
              onChange={handleChange}
              placeholder="e.g., A"
            />
          </div>
          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of the class"
            as="textarea"
            rows={3}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Class
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClassManagement;