import React, { useEffect, useRef, useState } from 'react';

const VideoParticipant = ({ socketId, stream, participant }) => {
  const videoRef = useRef(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Attach stream to video element
  useEffect(() => {
    if (!videoRef.current || !stream) return;

    console.log('Attaching stream to video element for:', socketId);
    
    try {
      videoRef.current.srcObject = stream;
      
      // Force play the video
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playing successfully for:', socketId);
            setHasError(false);
          })
          .catch(error => {
            console.error('Error playing video for:', socketId, error);
            setHasError(true);
            
            // Retry after a short delay
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(e => console.error('Retry failed:', e));
              }
            }, 1000);
          });
      }
    } catch (error) {
      console.error('Error setting srcObject:', error);
      setHasError(true);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream, socketId]);

  // Monitor track status in real-time
  useEffect(() => {
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    // Set initial states
    setIsVideoActive(videoTrack?.enabled ?? false);
    setIsAudioActive(audioTrack?.enabled ?? false);

    console.log('Initial track states for', socketId, '- Video:', videoTrack?.enabled, 'Audio:', audioTrack?.enabled);

    // Listen for track changes
    const handleTrackMute = () => {
      setIsVideoActive(false);
      console.log('Video track muted for:', socketId);
    };

    const handleTrackUnmute = () => {
      setIsVideoActive(true);
      console.log('Video track unmuted for:', socketId);
    };

    const handleTrackEnded = () => {
      setIsVideoActive(false);
      console.log('Video track ended for:', socketId);
    };

    const handleAudioMute = () => {
      setIsAudioActive(false);
      console.log('Audio track muted for:', socketId);
    };

    const handleAudioUnmute = () => {
      setIsAudioActive(true);
      console.log('Audio track unmuted for:', socketId);
    };

    // Add event listeners
    if (videoTrack) {
      videoTrack.addEventListener('mute', handleTrackMute);
      videoTrack.addEventListener('unmute', handleTrackUnmute);
      videoTrack.addEventListener('ended', handleTrackEnded);
    }

    if (audioTrack) {
      audioTrack.addEventListener('mute', handleAudioMute);
      audioTrack.addEventListener('unmute', handleAudioUnmute);
    }

    // Poll for enabled state changes (some browsers don't fire events reliably)
    const pollInterval = setInterval(() => {
      if (videoTrack) {
        setIsVideoActive(videoTrack.enabled);
      }
      if (audioTrack) {
        setIsAudioActive(audioTrack.enabled);
      }
    }, 500);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      
      if (videoTrack) {
        videoTrack.removeEventListener('mute', handleTrackMute);
        videoTrack.removeEventListener('unmute', handleTrackUnmute);
        videoTrack.removeEventListener('ended', handleTrackEnded);
      }

      if (audioTrack) {
        audioTrack.removeEventListener('mute', handleAudioMute);
        audioTrack.removeEventListener('unmute', handleAudioUnmute);
      }
    };
  }, [stream, socketId]);

  const displayName = participant?.userName || 'Guest';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden group" style={{ aspectRatio: '1/1' }}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false} // Don't mute remote videos
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: !isVideoActive || hasError ? 'none' : 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        onLoadedMetadata={() => console.log('Video metadata loaded for:', socketId)}
        onPlay={() => console.log('Video started playing for:', socketId)}
        onError={(e) => {
          console.error('Video element error for:', socketId, e);
          setHasError(true);
        }}
      />

      {/* Avatar Fallback (when video is off or error) */}
      {(!isVideoActive || hasError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
          <div className="text-white text-6xl font-bold mb-4">
            {initials}
          </div>
          {hasError && (
            <div className="text-white text-sm bg-red-500 bg-opacity-50 px-3 py-1 rounded">
              Video Error - Reconnecting...
            </div>
          )}
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="bg-gray-900 bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium truncate max-w-xs">
            {displayName}
          </span>
          
          {/* Audio Indicator */}
          {!isAudioActive && (
            <div className="bg-red-500 p-1 rounded-full" title="Microphone off">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          {/* Audio Active Indicator */}
          {isAudioActive && (
            <div className="bg-green-500 p-1 rounded-full" title="Microphone on">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          )}
        </div>

        {/* Connection Quality Indicator */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1 bg-gray-900 bg-opacity-75 px-2 py-1 rounded">
            <div className="w-1 h-3 bg-green-500 rounded"></div>
            <div className="w-1 h-4 bg-green-500 rounded"></div>
            <div className="w-1 h-5 bg-green-500 rounded"></div>
          </div>
        </div>
      </div>

      {/* Video Off Badge */}
      {!isVideoActive && !hasError && (
        <div className="absolute top-4 right-4">
          <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Camera Off
          </span>
        </div>
      )}

      {/* Speaking Indicator (animated border when speaking) */}
      {isAudioActive && (
        <div className="absolute inset-0 pointer-events-none border-4 border-green-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"></div>
      )}
    </div>
  );
};

export default VideoParticipant;