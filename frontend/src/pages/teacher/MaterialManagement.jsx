// frontend/src/pages/teacher/MaterialManagement.jsx

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useDeleteMaterialMutation,
  useGetClassDetailQuery,
} from '../../api/apiSlice';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  DocumentTextIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  LinkIcon,
  TrashIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';


const MaterialManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'pdf',
    link_url: '',
    category: '',
  });

  const { data: classData } = useGetClassDetailQuery(id);
  const { data: materials = [], isLoading, refetch } = useGetMaterialsQuery(id);
  const [createMaterial, { isLoading: isCreating }] = useCreateMaterialMutation();
  const [deleteMaterial, { isLoading: isDeleting }] = useDeleteMaterialMutation();

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
      // Auto-set title from filename
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('material_type', formData.material_type);
    formDataToSend.append('category', formData.category || '');
    
    if (selectedFile) {
      formDataToSend.append('file', selectedFile);
    }
    
    if (formData.link_url) {
      formDataToSend.append('link_url', formData.link_url);
    }

    try {
      await createMaterial({ classId: id, data: formDataToSend }).unwrap();
      toast.success('Material uploaded successfully!');
      setIsModalOpen(false);
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        material_type: 'pdf',
        link_url: '',
        category: '',
      });
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to upload material');
    }
  };

  const handleDelete = async () => {
    if (!selectedMaterial) return;
    try {
      await deleteMaterial(selectedMaterial.id).unwrap();
      toast.success('Material deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedMaterial(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to delete material');
    }
  };

  const getMaterialIcon = (type) => {
    const icons = {
      pdf: DocumentIcon,
      note: DocumentTextIcon,
      video: VideoCameraIcon,
      image: PhotoIcon,
      link: LinkIcon,
      presentation: DocumentTextIcon,
    };
    return icons[type] || DocumentIcon;
  };

  const getMaterialColor = (type) => {
    const colors = {
      pdf: 'text-danger-600 bg-danger-50',
      note: 'text-primary-600 bg-primary-50',
      video: 'text-purple-600 bg-purple-50',
      image: 'text-secondary-600 bg-secondary-50',
      link: 'text-info-600 bg-info-50',
      presentation: 'text-warning-600 bg-warning-50',
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading materials..." />;
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
            {classData?.name || 'Class'} - Materials
          </h1>
          <p className="text-gray-600">Manage learning materials for your class</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Upload Material
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-full">
              <DocumentIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">PDFs</p>
              <p className="text-2xl font-bold text-gray-900">
                {materials.filter(m => m.material_type === 'pdf').length}
              </p>
            </div>
            <div className="p-3 bg-danger-50 rounded-full">
              <DocumentIcon className="h-6 w-6 text-danger-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Videos</p>
              <p className="text-2xl font-bold text-gray-900">
                {materials.filter(m => m.material_type === 'video').length}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-full">
              <VideoCameraIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Links</p>
              <p className="text-2xl font-bold text-gray-900">
                {materials.filter(m => m.material_type === 'link').length}
              </p>
            </div>
            <div className="p-3 bg-info-50 rounded-full">
              <LinkIcon className="h-6 w-6 text-info-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Materials Grid */}
      {materials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900">No materials uploaded yet</h3>
          <p className="text-gray-500 mt-1">Upload your first learning material</p>
          <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Material
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => {
            const Icon = getMaterialIcon(material.material_type);
            const colorClass = getMaterialColor(material.material_type);
            
            return (
              <Card key={material.id} hover className="h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {material.title}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {material.material_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        setSelectedMaterial(material);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {material.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {material.description}
                  </p>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {material.view_count || 0} views
                      {material.download_count > 0 && ` • ${material.download_count} downloads`}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (material.link_url) {
                          window.open(material.link_url, '_blank');
                        } else if (material.file) {
                          window.open(material.file, '_blank');
                        }
                      }}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Learning Material" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter material title"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material Type
            </label>
            <select
              name="material_type"
              value={formData.material_type}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="pdf">PDF Document</option>
              <option value="note">Note</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="link">External Link</option>
              <option value="presentation">Presentation</option>
            </select>
          </div>

          <Input
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description"
            as="textarea"
            rows={2}
          />

          {formData.material_type === 'link' ? (
            <Input
              label="URL"
              name="link_url"
              value={formData.link_url}
              onChange={handleChange}
              placeholder="https://example.com/resource"
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center space-x-2">
                    <DocumentIcon className="h-8 w-8 text-primary-600" />
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
                      PDF, Video, Image, Presentation files supported
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Upload Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Material">
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedMaterial?.title}</strong>?
            This action cannot be undone.
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

export default MaterialManagement;