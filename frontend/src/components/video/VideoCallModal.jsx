import React, { useEffect, useRef, useState } from 'react';
import { useVideoCall } from '../../hooks/useVideoCall';
import VideoControls from './VideoControls';
import VideoParticipant from './VideoParticipant';

const VideoCallModal = ({ workspaceId, currentUser, onClose }) => {
  const {
    isInCall,
    localStream,
    remoteStreams,
    participants,
    isAudioEnabled,
    isVideoEnabled,
    error,
    connectionStatus,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo
  } = useVideoCall(workspaceId, currentUser);

  const localVideoRef = useRef(null);
  const hasJoinedRef = useRef(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Auto-join on mount (ONLY ONCE)
  useEffect(() => {
    if (!hasJoinedRef.current && !isInCall) {
      hasJoinedRef.current = true;
      joinCall();
    }
  }, []);

  // Set local video stream - ONLY WHEN BOTH exist
  useEffect(() => {
    // CRITICAL FIX: Check if BOTH video element AND stream exist AND we're in call
    if (!localVideoRef.current || !localStream || !isInCall) {
      console.log('⏳ Waiting for video setup:', {
        hasVideoElement: !!localVideoRef.current,
        hasStream: !!localStream,
        isInCall: isInCall
      });
      return;
    }

    const videoElement = localVideoRef.current;
    
    console.log('🎥 Setting up local video...');
    console.log('📊 Stream details:', {
      id: localStream.id,
      active: localStream.active,
      videoTracks: localStream.getVideoTracks().length,
      audioTracks: localStream.getAudioTracks().length
    });

    // Log each track
    localStream.getTracks().forEach((track, index) => {
      console.log(`Track ${index} (${track.kind}):`, {
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState
      });
    });

    try {
      // Set the stream
      videoElement.srcObject = localStream;
      console.log('✅ srcObject set successfully');

      // Play the video
      const playPromise = videoElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Video is playing!');
            console.log('📺 Video dimensions:', {
              videoWidth: videoElement.videoWidth,
              videoHeight: videoElement.videoHeight,
              clientWidth: videoElement.clientWidth,
              clientHeight: videoElement.clientHeight
            });
            setIsVideoReady(true);
          })
          .catch(error => {
            console.error('❌ Error playing video:', error);
            // Try again after a short delay
            setTimeout(() => {
              videoElement.play().catch(e => console.error('Retry failed:', e));
            }, 500);
          });
      }
    } catch (error) {
      console.error('❌ Error setting srcObject:', error);
    }

    // Clean up only the srcObject when unmounting
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [localStream, isInCall]); // Depend on BOTH localStream AND isInCall

  const handleLeaveCall = () => {
    leaveCall();
    onClose();
  };

  const participantCount = remoteStreams.size + (isInCall ? 1 : 0);
  const remoteParticipants = Array.from(remoteStreams.entries());

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white text-lg font-semibold">Video Call</h2>
          <p className="text-gray-400 text-sm">
            {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
          </p>
        </div>
        <button
          onClick={handleLeaveCall}
          className="text-gray-400 hover:text-white transition-colors"
          title="Close"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Connection Status */}
      {connectionStatus === 'connecting' && (
        <div className="bg-blue-500 text-white px-6 py-3 flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Connecting to call...</span>
        </div>
      )}

      {/* Video Grid - RENDERS IMMEDIATELY when isInCall is true */}
      <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
        {isInCall ? (
          <div className={`w-full max-w-7xl grid gap-4 ${
            remoteParticipants.length === 0 
              ? 'grid-cols-1 max-w-2xl' 
              : remoteParticipants.length === 1
              ? 'grid-cols-2'
              : remoteParticipants.length <= 4
              ? 'grid-cols-2 md:grid-cols-3'
              : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`} style={{ gridAutoRows: '1fr' }}>
            {/* Local Video - NOW RENDERS IMMEDIATELY */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden group">
              {/* Video element with explicit inline styles */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#1f2937',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
                onLoadedMetadata={(e) => {
                  console.log('✅ Video metadata loaded:', {
                    width: e.target.videoWidth,
                    height: e.target.videoHeight
                  });
                }}
                onCanPlay={() => console.log('✅ Video can play')}
                onPlay={() => console.log('✅ Video playing')}
                onError={(e) => {
                  console.error('❌ Video error:', e);
                  console.error('Error details:', e.target.error);
                }}
              />
              
              {/* Loading overlay while video initializes */}
              {!isVideoReady && localStream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm">Loading video feed...</p>
                  </div>
                </div>
              )}

              {/* Overlay Info */}
              <div className="absolute bottom-4 left-4 flex items-center space-x-2 z-20">
                <span className="bg-gray-900 bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium">
                  You {isVideoReady && '🟢'}
                </span>
                {!isVideoEnabled && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Camera Off
                  </span>
                )}
                {!isAudioEnabled && (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Debug indicator - remove after testing */}
              {localStream && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded z-20">
                  Stream Active
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {remoteParticipants.map(([socketId, stream]) => (
              <VideoParticipant
                key={socketId}
                socketId={socketId}
                stream={stream}
                participant={participants.get(socketId)}
              />
            ))}

            {/* Empty Slots */}
            {remoteParticipants.length === 0 && (
              <div className="bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-lg font-medium">Waiting for others to join...</p>
                  <p className="text-sm mt-2">Share the workspace link with your team</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-lg">Setting up your camera and microphone...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isInCall && (
        <VideoControls
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onLeaveCall={handleLeaveCall}
        />
      )}
    </div>
  );
};

export default VideoCallModal;