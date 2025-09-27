import React from 'react';

const VideoCall = ({ workspaceId, isExpanded = false }) => {
  return (
    <div className={`bg-white border rounded-lg ${isExpanded ? 'h-full' : 'h-80'}`}>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-medium">Video Call</h3>
        <div className="flex space-x-2">
          <button className="p-2 rounded bg-red-500 text-white">📞</button>
          <button className="p-2 rounded bg-gray-100">🎤</button>
          <button className="p-2 rounded bg-gray-100">📹</button>
        </div>
      </div>
      <div className="p-4 h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📹</div>
          <p>Start a video call with your team</p>
          <button className="mt-4 btn-primary">Start Call</button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;