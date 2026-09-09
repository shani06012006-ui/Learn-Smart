// frontend/src/pages/teacher/MaterialManagement.jsx

import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useDeleteMaterialMutation,
  useGetClassDetailQuery,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
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
  MegaphoneIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ... rest of the component code remains the same

const MaterialManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  
  // State
  const [activeTab, setActiveTab] = useState('materials');
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Form data
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    material_type: 'pdf',
    link_url: '',
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    is_pinned: false,
  });

  // Queries
  const { data: classData, isLoading: classLoading } = useGetClassDetailQuery(id);
  const { data: materials = [], isLoading: materialsLoading, refetch: refetchMaterials } = useGetMaterialsQuery(id);
  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements } = useGetAnnouncementsQuery(id);
  
  // Mutations
  const [createMaterial, { isLoading: isCreatingMaterial }] = useCreateMaterialMutation();
  const [deleteMaterial, { isLoading: isDeletingMaterial }] = useDeleteMaterialMutation();
  const [createAnnouncement, { isLoading: isCreatingAnnouncement }] = useCreateAnnouncementMutation();
  const [deleteAnnouncement, { isLoading: isDeletingAnnouncement }] = useDeleteAnnouncementMutation();

  // Handle material form
  const handleMaterialChange = (e) => {
    setMaterialForm({
      ...materialForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!materialForm.title) {
        setMaterialForm(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, ''),
        }));
      }
    }
  };

  const handleMaterialSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', materialForm.title);
    formData.append('description', materialForm.description || '');
    formData.append('material_type', materialForm.material_type);
    
    if (selectedFile) {
      formData.append('file', selectedFile);
    }
    if (materialForm.link_url) {
      formData.append('link_url', materialForm.link_url);
    }

    try {
      await createMaterial({ classId: id, data: formData }).unwrap();
      toast.success('Material uploaded successfully!');
      setIsMaterialModalOpen(false);
      setSelectedFile(null);
      setMaterialForm({
        title: '',
        description: '',
        material_type: 'pdf',
        link_url: '',
      });
      refetchMaterials();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to upload material');
    }
  };

  // Handle announcement form
  const handleAnnouncementChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setAnnouncementForm({
      ...announcementForm,
      [e.target.name]: value,
    });
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    
    if (!announcementForm.title || !announcementForm.content) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await createAnnouncement({ classId: id, data: announcementForm }).unwrap();
      toast.success('Announcement posted successfully!');
      setIsAnnouncementModalOpen(false);
      setAnnouncementForm({
        title: '',
        content: '',
        priority: 'medium',
        is_pinned: false,
      });
      refetchAnnouncements();
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to post announcement');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    try {
      if (activeTab === 'materials') {
        await deleteMaterial(selectedItem.id).unwrap();
        toast.success('Material deleted successfully!');
        refetchMaterials();
      } else {
        await deleteAnnouncement(selectedItem.id).unwrap();
        toast.success('Announcement deleted successfully!');
        refetchAnnouncements();
      }
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error(error?.data?.detail || 'Failed to delete');
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

  const getPriorityBadge = (priority) => {
    const badges = {
      low: 'badge-gray',
      medium: 'badge-info',
      high: 'badge-warning',
      urgent: 'badge-danger',
    };
    return badges[priority] || 'badge-gray';
  };

  if (classLoading || materialsLoading || announcementsLoading) {
    return <LoadingSpinner text="Loading..." />;
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
          <p className="text-gray-600">Manage learning materials and post announcements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAnnouncementModalOpen(true)}>
            <MegaphoneIcon className="h-5 w-5 mr-2" />
            Announce
          </Button>
          <Button onClick={() => setIsMaterialModalOpen(true)}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload Material
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('materials')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === 'materials'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Materials ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === 'announcements'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Announcements ({announcements.length})
          </button>
        </nav>
      </div>

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <>
          {materials.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900">No materials uploaded yet</h3>
              <p className="text-gray-500 mt-1">Upload your first learning material</p>
              <Button className="mt-4" onClick={() => setIsMaterialModalOpen(true)}>
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
                      <button
                        onClick={() => {
                          setSelectedItem(material);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
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
        </>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <>
          {announcements.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-lg font-medium text-gray-900">No announcements yet</h3>
              <p className="text-gray-500 mt-1">Post your first announcement</p>
              <Button className="mt-4" onClick={() => setIsAnnouncementModalOpen(true)}>
                <MegaphoneIcon className="h-5 w-5 mr-2" />
                Post Announcement
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className={announcement.is_pinned ? 'border-l-4 border-primary-500' : ''}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {announcement.title}
                        </h3>
                        <span className={`badge ${getPriorityBadge(announcement.priority)}`}>
                          {announcement.priority}
                        </span>
                        {announcement.is_pinned && (
                          <span className="badge-primary">📌 Pinned</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {announcement.content}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-400">
                        <span>By: {announcement.created_by_name || 'Unknown'}</span>
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedItem(announcement);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors ml-4"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upload Material Modal */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Upload Learning Material" size="lg">
        <form onSubmit={handleMaterialSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={materialForm.title}
            onChange={handleMaterialChange}
            placeholder="Enter material title"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material Type
            </label>
            <select
              name="material_type"
              value={materialForm.material_type}
              onChange={handleMaterialChange}
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
            value={materialForm.description}
            onChange={handleMaterialChange}
            placeholder="Brief description"
            as="textarea"
            rows={2}
          />

          {materialForm.material_type === 'link' ? (
            <Input
              label="URL"
              name="link_url"
              value={materialForm.link_url}
              onChange={handleMaterialChange}
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
            <Button variant="secondary" onClick={() => setIsMaterialModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreatingMaterial}>
              Upload Material
            </Button>
          </div>
        </form>
      </Modal>

      {/* Post Announcement Modal */}
      <Modal isOpen={isAnnouncementModalOpen} onClose={() => setIsAnnouncementModalOpen(false)} title="Post Announcement" size="lg">
        <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={announcementForm.title}
            onChange={handleAnnouncementChange}
            placeholder="Announcement title"
            required
          />
          
          <Input
            label="Content"
            name="content"
            value={announcementForm.content}
            onChange={handleAnnouncementChange}
            placeholder="Write your announcement here..."
            as="textarea"
            rows={5}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={announcementForm.priority}
                onChange={handleAnnouncementChange}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="is_pinned"
                checked={announcementForm.is_pinned}
                onChange={handleAnnouncementChange}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Pin this announcement
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAnnouncementModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreatingAnnouncement}>
              Post Announcement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Item">
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedItem?.title}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete} 
              isLoading={isDeletingMaterial || isDeletingAnnouncement}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MaterialManagement;