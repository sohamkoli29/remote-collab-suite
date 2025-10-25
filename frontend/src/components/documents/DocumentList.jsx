import React, { useState } from 'react';
import { documentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FileText, Plus, Loader2, AlertCircle, Trash2, 
  Calendar, User, X, Check, FilePlus 
} from 'lucide-react';

const DocumentList = ({ workspaceId, onDocumentSelect, onCreateDocument }) => {
  const { user: currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [creating, setCreating] = useState(false);

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
      setCreating(true);
      const response = await documentAPI.createDocument({
        workspaceId,
        title: newDocumentTitle.trim()
      });
      
      const newDocument = response.data.document;
      setDocuments(prev => [newDocument, ...prev]);
      setNewDocumentTitle('');
      setShowCreateForm(false);
      onDocumentSelect(newDocument);
    } catch (error) {
      console.error('Error creating document:', error);
      setError('Failed to create document');
    } finally {
      setCreating(false);
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

  if (loading) {
    return (
      <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 min-h-64 flex items-center justify-center">
        <div className="text-center space-y-4 animate-scale-in">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-neon animate-pulse-glow">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg">Loading Documents</p>
            <p className="text-gray-400 text-sm mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <h3 className="text-xl font-display font-bold text-white">All Documents</h3>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span className="leading-none">New Document</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-scale-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* Create Document Form */}
      {showCreateForm && (
        <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 animate-scale-in">
          <form onSubmit={handleCreateDocument} className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-white leading-none">
                <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Document Title</span>
              </label>
              <input
                type="text"
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
                placeholder="e.g., Project Proposal, Meeting Notes..."
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400/50 transition-all duration-300 leading-normal"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!newDocumentTitle.trim() || creating}
                className="group relative flex-1 overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span className="leading-none">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 flex-shrink-0" />
                      <span className="leading-none">Create</span>
                    </>
                  )}
                </span>
                {!creating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDocumentTitle('');
                }}
                className="px-6 py-3 bg-white/5 backdrop-blur-sm text-white rounded-xl font-semibold border-2 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300 leading-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 && !showCreateForm ? (
        <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 text-center py-16 animate-scale-in">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-neon animate-float">
              <FilePlus className="w-12 h-12 text-white" />
            </div>
            <h4 className="text-2xl font-display font-bold text-white mb-3">No documents yet</h4>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Create your first document to start collaborating with your team
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="group relative inline-flex items-center overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span className="leading-none">Create Document</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {documents.map((document, index) => (
            <div
              key={document.id}
              onClick={() => onDocumentSelect(document)}
              className="group glass-panel backdrop-blur-2xl bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 cursor-pointer transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1 relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              
              {/* Content */}
              <div className="space-y-4">
                {/* Document Icon & Title */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-neon group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-white line-clamp-2 group-hover:text-cyan-300 transition-colors leading-tight">
                      {document.title}
                    </h4>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="leading-tight">Updated {formatDate(document.updated_at)}</span>
                  </div>
                  {document.creator && (
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 flex-shrink-0" />
                      <span className="leading-tight truncate">Created by {document.creator.first_name}</span>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteDocument(document.id, e)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList;