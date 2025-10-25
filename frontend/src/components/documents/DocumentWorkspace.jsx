import { useState } from 'react';
import DocumentList from './DocumentList';
import CollaborativeEditor from './CollaborativeEditor';
import { documentAPI } from '../../services/api';
import { FileText, ArrowLeft, Sparkles } from 'lucide-react';

const DocumentWorkspace = ({ workspaceId }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
    setDocumentTitle(document.title);
  };

  const handleTitleChange = async (newTitle) => {
    if (!selectedDocument || newTitle === selectedDocument.title) return;

    try {
      const response = await documentAPI.updateDocument(selectedDocument.id, {
        title: newTitle
      });
      
      setSelectedDocument(response.data.document);
      setDocumentTitle(newTitle);
    } catch (error) {
      console.error('Error updating document title:', error);
      setDocumentTitle(selectedDocument.title);
    }
  };

  const handleBackToList = () => {
    setSelectedDocument(null);
    setDocumentTitle('');
  };

  const handleCreateDocument = () => {
    setSelectedDocument(null);
  };

  return (
    <div className="space-y-6">
      {!selectedDocument ? (
        <>
          {/* Header */}
          <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 animate-slide-in-down">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-neon flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white leading-tight">Documents</h2>
                <p className="text-gray-300 text-sm leading-tight mt-1">Create and collaborate on documents in real-time</p>
              </div>
            </div>
          </div>

          {/* Document List */}
          <DocumentList
            workspaceId={workspaceId}
            onDocumentSelect={handleDocumentSelect}
            onCreateDocument={handleCreateDocument}
          />
        </>
      ) : (
        <>
          {/* Editor Header */}
          <div className="glass-panel backdrop-blur-2xl bg-white/10 border-white/20 animate-slide-in-down">
            <button
              onClick={handleBackToList}
              className="group flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all duration-200">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold leading-tight">Back to Documents</div>
                <div className="text-xs text-gray-400 leading-tight">View all documents</div>
              </div>
            </button>
          </div>

          {/* Collaborative Editor */}
          <div className="flex-1 min-h-0 animate-fade-in">
            <CollaborativeEditor
              documentId={selectedDocument.id}
              workspaceId={workspaceId}
              documentTitle={documentTitle}
              onTitleChange={handleTitleChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentWorkspace;