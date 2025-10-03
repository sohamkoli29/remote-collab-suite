    import React, { useState } from 'react';
import DocumentList from './DocumentList';
import CollaborativeEditor from './CollaborativeEditor';
import { documentAPI } from '../../services/api';

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
      // Revert on error
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
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
              <p className="text-gray-600 mt-1">Create and collaborate on documents in real-time</p>
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
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackToList}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Documents</span>
            </button>
          </div>

          {/* Collaborative Editor */}
          <div className="flex-1 min-h-0">
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