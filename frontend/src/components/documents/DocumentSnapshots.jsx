import  { useState, useEffect } from 'react';
import { documentSnapshotAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { History, RotateCcw, Trash2, Plus, Calendar, User } from 'lucide-react';

const DocumentSnapshots = ({ documentId, isOpen, onClose, onSnapshotRestored }) => {
  const { user: currentUser } = useAuth();
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen && documentId) {
      loadSnapshots();
    }
  }, [isOpen, documentId]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const response = await documentSnapshotAPI.getSnapshots(documentId);
      setSnapshots(response.data.snapshots || []);
    } catch (error) {
      console.error('Error loading snapshots:', error);
      setError('Failed to load document history');
    } finally {
      setLoading(false);
    }
  };

  const createSnapshot = async () => {
    if (!description.trim()) return;

    try {
      setCreatingSnapshot(true);
      await documentSnapshotAPI.createSnapshot(documentId, description.trim());
      setDescription('');
      await loadSnapshots(); // Refresh list
    } catch (error) {
      console.error('Error creating snapshot:', error);
      setError('Failed to create snapshot');
    } finally {
      setCreatingSnapshot(false);
    }
  };

  const restoreSnapshot = async (snapshotId) => {
    if (!window.confirm('Are you sure you want to restore this version? Current changes will be lost.')) {
      return;
    }

    try {
      await documentSnapshotAPI.restoreSnapshot(snapshotId);
      onSnapshotRestored?.();
      onClose();
    } catch (error) {
      console.error('Error restoring snapshot:', error);
      setError('Failed to restore snapshot');
    }
  };

  const deleteSnapshot = async (snapshotId, version) => {
    if (!window.confirm(`Are you sure you want to delete version ${version}? This action cannot be undone.`)) {
      return;
    }

    try {
      await documentSnapshotAPI.deleteSnapshot(snapshotId);
      await loadSnapshots(); // Refresh list
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      setError('Failed to delete snapshot');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <History className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Document History</h3>
              <p className="text-sm text-gray-600">View and restore previous versions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            ✕
          </button>
        </div>

        {/* Create Snapshot Form */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this version..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={createSnapshot}
              disabled={!description.trim() || creatingSnapshot}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{creatingSnapshot ? 'Creating...' : 'Create Version'}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No versions yet</h4>
              <p className="text-gray-600">Create your first version to start tracking changes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                          Version {snapshot.version}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(snapshot.created_at)}
                        </span>
                      </div>
                      
                      {snapshot.description && (
                        <p className="text-gray-700 mb-2">{snapshot.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>
                            {snapshot.creator?.first_name} {snapshot.creator?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(snapshot.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => restoreSnapshot(snapshot.id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                        title="Restore this version"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore</span>
                      </button>
                      
                      {snapshot.version !== 1 && (
                        <button
                          onClick={() => deleteSnapshot(snapshot.id, snapshot.version)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          title="Delete this version"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{snapshots.length} versions saved</span>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSnapshots;