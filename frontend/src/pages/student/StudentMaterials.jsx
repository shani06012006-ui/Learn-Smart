// frontend/src/pages/student/StudentMaterials.jsx

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetMaterialsQuery,
  useGetAnnouncementsQuery,
  useGetClassDetailQuery,
} from '../../api/apiSlice';
import {
  DocumentIcon,
  VideoCameraIcon,
  LinkIcon,
  DocumentTextIcon,
  PhotoIcon,
  MegaphoneIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// ... rest of the component code remains the same

const StudentMaterials = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('materials');

  const { data: classData, isLoading: classLoading } = useGetClassDetailQuery(id);
  const { data: materials = [], isLoading: materialsLoading } = useGetMaterialsQuery(id);
  const { data: announcements = [], isLoading: announcementsLoading } = useGetAnnouncementsQuery(id);

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
    return <LoadingSpinner text="Loading materials..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/student/classes')}
          className="text-sm text-primary-600 hover:text-primary-700 mb-1 flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Classes
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {classData?.name || 'Class'} - Learning Resources
        </h1>
        <p className="text-gray-600">Access materials and announcements for this class</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Materials</p>
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
              <p className="text-sm text-gray-500">Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
            <div className="p-3 bg-warning-50 rounded-full">
              <MegaphoneIcon className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </Card>
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
              <h3 className="text-lg font-medium text-gray-900">No materials available</h3>
              <p className="text-gray-500 mt-1">Your teacher hasn't uploaded any materials yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => {
                const Icon = getMaterialIcon(material.material_type);
                const colorClass = getMaterialColor(material.material_type);
                
                return (
                  <Card key={material.id} hover className="h-full">
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
              <h3 className="text-lg font-medium text-gray-900">No announcements</h3>
              <p className="text-gray-500 mt-1">Your teacher hasn't posted any announcements yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className={announcement.is_pinned ? 'border-l-4 border-primary-500' : ''}>
                  <div className="flex items-start">
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
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentMaterials;