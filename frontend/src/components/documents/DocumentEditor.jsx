    import React from 'react';

const DocumentEditor = ({ workspaceId }) => {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">📝</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Document Editor</h3>
      <p className="text-gray-600">Real-time collaborative document editing coming soon!</p>
      <div className="mt-6 bg-white border rounded-lg p-8 max-w-2xl mx-auto">
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div>
            <div className="text-2xl mb-2">✏️</div>
            <p>Start typing to begin collaboration</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;