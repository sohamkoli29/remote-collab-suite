

const VideoControls = ({ 
  isAudioEnabled, 
  isVideoEnabled, 
  onToggleAudio, 
  onToggleVideo, 
  onLeaveCall 
}) => {
  return (
    <div className="bg-gray-800 px-6 py-4">
      <div className="flex items-center justify-center space-x-4">
        {/* Toggle Audio */}
        <button
          onClick={onToggleAudio}
          className={`p-4 rounded-full transition-all duration-200 ${
            isAudioEnabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          )}
        </button>

        {/* Toggle Video */}
        <button
          onClick={onToggleVideo}
          className={`p-4 rounded-full transition-all duration-200 ${
            isVideoEnabled
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>

        {/* Leave Call / End Call */}
        <button
          onClick={onLeaveCall}
          className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 flex items-center space-x-2 font-semibold"
          title="End call"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
          <span>End Call</span>
        </button>

        {/* Screen Share (Optional - placeholder) */}
        <button
          onClick={() => alert('Screen sharing will be implemented in a future update')}
          className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
          title="Share screen (coming soon)"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-center mt-3 space-x-4 text-sm">
        <div className={`flex items-center space-x-1 ${isAudioEnabled ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{isAudioEnabled ? 'Mic On' : 'Mic Off'}</span>
        </div>
        <div className={`flex items-center space-x-1 ${isVideoEnabled ? 'text-green-400' : 'text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isVideoEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{isVideoEnabled ? 'Camera On' : 'Camera Off'}</span>
        </div>
      </div>
    </div>
  );
};

export default VideoControls;