import React, { useState } from 'react';
import { documentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DocumentList = ({ workspaceId, onDocumentSelect, onCreateDocument }) => {
  const { user: currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');

  React.useEffect(() => {
    loadDocuments();
  }, [workspaceId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentAPI.getDocuments(workspaceId);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocumentTitle.trim()) return;

    try {
      const response = await documentAPI.createDocument({
        workspaceId,
        title: newDocumentTitle.trim()
      });
      
      const newDocument = response.data.document;
      setDocuments(prev => [newDocument, ...prev]);
      setNewDocumentTitle('');
      setShowCreateForm(false);
      
      // Auto-open the new document
      onDocumentSelect(newDocument);
    } catch (error) {
      console.error('Error creating document:', error);
      setError('Failed to create document');
    }
  };

  const handleDeleteDocument = async (documentId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentAPI.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      setError('Failed to delete document');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Documents</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary text-sm"
        >
          New Document
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Create Document Form */}
      {showCreateForm && (
        <div className="bg-gray-50 rounded-lg p-4">
          <form onSubmit={handleCreateDocument} className="space-y-3">
            <input
              type="text"
              value={newDocumentTitle}
              onChange={(e) => setNewDocumentTitle(e.target.value)}
              placeholder="Enter document title..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={!newDocumentTitle.trim()}
                className="btn-primary text-sm px-3 py-1 disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary text-sm px-3 py-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-2">
        {documents.map((document) => (
          <div
            key={document.id}
            onClick={() => onDocumentSelect(document)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">
                  {document.title}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Updated {formatDate(document.updated_at)}</span>
                  <span>•</span>
                  <span>Created by {document.creator?.first_name}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleDeleteDocument(document.id, e)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Delete document"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {documents.length === 0 && !showCreateForm && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h4>
            <p className="text-gray-600 mb-4">Create your first document to start collaborating</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
            >
              Create Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;