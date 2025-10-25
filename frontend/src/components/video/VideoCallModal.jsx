import { useEffect, useRef, useState } from 'react';
import { useVideoCall } from '../../hooks/useVideoCall';
import VideoControls from './VideoControls';
import VideoParticipant from './VideoParticipant';
import { 
  X, Users, AlertCircle, Loader2, Video, VideoOff, 
  Mic, MicOff, Wifi, ChevronDown, ChevronUp
} from 'lucide-react';

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
  const [isParticipantsPanelOpen, setIsParticipantsPanelOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Track window size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;

  useEffect(() => {
    if (!hasJoinedRef.current && !isInCall) {
      hasJoinedRef.current = true;
      joinCall();
    }
  }, []);

  useEffect(() => {
    if (!localVideoRef.current || !localStream || !isInCall) return;

    const videoElement = localVideoRef.current;
    
    try {
      videoElement.srcObject = localStream;
      const playPromise = videoElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsVideoReady(true);
          })
          .catch(error => {
            console.error('❌ Error playing video:', error);
            setTimeout(() => {
              videoElement.play().catch(e => console.error('Retry failed:', e));
            }, 500);
          });
      }
    } catch (error) {
      console.error('❌ Error setting srcObject:', error);
    }

    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [localStream, isInCall]);

  const handleLeaveCall = () => {
    leaveCall();
    onClose();
  };

  const participantCount = remoteStreams.size + (isInCall ? 1 : 0);
  const remoteParticipants = Array.from(remoteStreams.entries());

  // Responsive grid configuration
  const getGridConfig = () => {
    if (isMobile) {
      return {
        grid: 'grid-cols-1',
        mainClass: 'w-full',
        showParticipantsPanel: isParticipantsPanelOpen
      };
    }
    
    if (isTablet) {
      if (remoteParticipants.length <= 2) {
        return {
          grid: 'grid-cols-2',
          mainClass: 'w-full',
          showParticipantsPanel: isParticipantsPanelOpen
        };
      }
      return {
        grid: 'grid-cols-2',
        mainClass: remoteParticipants.length > 4 ? 'w-full' : 'w-full',
        showParticipantsPanel: isParticipantsPanelOpen && remoteParticipants.length > 4
      };
    }
    
    // Desktop
    if (remoteParticipants.length <= 2) {
      return {
        grid: 'grid-cols-2',
        mainClass: 'w-full',
        showParticipantsPanel: true
      };
    }
    return {
      grid: remoteParticipants.length <= 4 ? 'grid-cols-2' : 
            remoteParticipants.length <= 9 ? 'grid-cols-3' : 'grid-cols-4',
      mainClass: 'w-full',
      showParticipantsPanel: true
    };
  };

  const gridConfig = getGridConfig();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 z-[100] flex flex-col animate-fade-in">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-20" style={{ animationDelay: '2s' }}></div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      </div>

      {/* Header - Adjusted for Layout header height */}
      <div className="relative z-10 flex-shrink-0 glass-panel backdrop-blur-2xl bg-white/10 border-b border-white/10 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-neon flex-shrink-0">
              <Video className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div>
                <h2 className="text-white text-sm sm:text-lg font-display font-bold leading-tight">
                  {isMobile ? 'Call' : 'Video Call'}
                </h2>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  <p className="text-gray-300 text-xs sm:text-sm leading-tight">
                    {participantCount} {participantCount === 1 ? 'user' : 'users'}
                  </p>
                </div>
              </div>
              
              {/* Mobile Participants Toggle */}
              {isMobile && remoteParticipants.length > 0 && (
                <button
                  onClick={() => setIsParticipantsPanelOpen(!isParticipantsPanelOpen)}
                  className="glass-panel backdrop-blur-md bg-cyan-500/20 border-cyan-500/30 text-cyan-300 px-2 py-1 rounded-lg text-xs flex items-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  {isParticipantsPanelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
          
          <button
            onClick={handleLeaveCall}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg sm:rounded-xl text-gray-400 hover:text-white hover:bg-red-500/20 transition-all duration-200 flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="relative z-10 bg-red-500/10 border-y border-red-500/50 text-red-300 px-4 sm:px-6 py-2 flex items-center gap-2 sm:gap-3 text-sm">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="leading-tight truncate">{error}</span>
        </div>
      )}

      {/* Connection Status */}
      {connectionStatus === 'connecting' && (
        <div className="relative z-10 bg-blue-500/10 border-y border-blue-500/50 text-blue-300 px-4 sm:px-6 py-2 flex items-center gap-2 sm:gap-3 text-sm">
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin flex-shrink-0" />
          <span className="leading-tight">Connecting to call...</span>
        </div>
      )}

      {/* Main Content Area - Adjusted height calculation */}
      <div className={`relative z-10 flex-1 flex ${
        isMobile ? 'flex-col' : 'flex-row'
      } overflow-hidden`} style={{ 
        height: 'calc(100vh - 80px)' // Adjust based on header height
      }}>
        {/* Main Video Grid */}
        <div className={`${gridConfig.mainClass} ${
          isMobile ? 'flex-1' : 'flex-1'
        } p-2 sm:p-4 overflow-auto flex items-center justify-center`}>
          {isInCall ? (
            <div className="w-full h-full max-w-6xl">
              {remoteParticipants.length === 0 ? (
                // Single participant view
                <div className="w-full h-full flex items-center justify-center p-2">
                  <div className="relative glass-panel backdrop-blur-sm bg-white/5 border-white/20 rounded-xl sm:rounded-2xl overflow-hidden w-full max-w-4xl h-48 sm:h-64 md:h-80 animate-scale-in">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover bg-slate-800"
                    />
                    
                    {!isVideoReady && localStream && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 z-10">
                        <div className="text-center">
                          <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 shadow-neon animate-pulse-glow">
                            <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin text-white" />
                          </div>
                          <p className="text-white font-semibold text-xs sm:text-sm">Loading video...</p>
                        </div>
                      </div>
                    )}

                    {!isVideoEnabled && isVideoReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 z-10">
                        <div className="text-center">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mb-2 sm:mb-4 shadow-lg">
                            <VideoOff className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          </div>
                          <p className="text-white font-semibold text-xs sm:text-sm">Camera is off</p>
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex flex-wrap items-center gap-1 sm:gap-2 z-20">
                      <span className="glass-panel backdrop-blur-md bg-slate-900/80 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border border-white/20 flex items-center gap-1 sm:gap-1.5">
                        {isVideoReady && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></span>}
                        You
                      </span>
                      {!isVideoEnabled && (
                        <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs font-semibold flex items-center gap-0.5 sm:gap-1 shadow-lg">
                          <VideoOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {!isMobile && 'Camera Off'}
                        </span>
                      )}
                      {!isAudioEnabled && (
                        <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-xs font-semibold flex items-center gap-0.5 sm:gap-1 shadow-lg">
                          <MicOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {!isMobile && 'Muted'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Grid view for multiple participants
                <div className={`grid gap-2 sm:gap-3 h-full ${gridConfig.grid} auto-rows-fr`}>
                  {/* Local Video */}
                  <div className="relative glass-panel backdrop-blur-sm bg-white/5 border-white/20 rounded-xl sm:rounded-2xl overflow-hidden animate-scale-in min-h-[120px] sm:min-h-[160px]">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover bg-slate-800"
                    />
                    
                    <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 flex items-center gap-1 z-20">
                      <span className="glass-panel backdrop-blur-md bg-slate-900/80 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-semibold border border-white/20">
                        You
                      </span>
                      {!isVideoEnabled && (
                        <span className="bg-red-500 text-white p-0.5 rounded text-[10px] sm:text-xs">
                          <VideoOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Remote Videos */}
                  {remoteParticipants.map(([socketId, stream]) => (
                    <VideoParticipant
                      key={socketId}
                      socketId={socketId}
                      stream={stream}
                      participant={participants.get(socketId)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Loading state
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-center space-y-4 sm:space-y-6 animate-scale-in">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-neon animate-pulse-glow">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-white" />
                </div>
                <div>
                  <p className="text-white text-base sm:text-lg font-display font-bold mb-1 sm:mb-2">
                    Setting up your call...
                  </p>
                  <p className="text-gray-400 text-sm sm:text-base">Initializing camera and microphone</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Participants Panel - Responsive */}
        {isInCall && remoteParticipants.length > 0 && gridConfig.showParticipantsPanel && (
          <div className={`
            ${isMobile ? 'h-48 border-t border-white/10' : 'w-60 lg:w-72 border-l border-white/10'} 
            flex-shrink-0 bg-black/20 backdrop-blur-lg transition-all duration-300
          `}>
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="flex-shrink-0 glass-panel backdrop-blur-md bg-white/5 border-b border-white/10 px-3 sm:px-4 py-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                  <span className="text-white font-semibold text-sm sm:text-base">Participants</span>
                  <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-semibold">
                    {participantCount}
                  </span>
                </div>
              </div>

              {/* Participants List */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
                {/* Local User */}
                <div className="glass-panel backdrop-blur-sm bg-white/5 border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded sm:rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs sm:text-sm">
                      {currentUser?.first_name?.[0]?.toUpperCase() || 'Y'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-xs sm:text-sm truncate">
                      {currentUser?.first_name || 'You'} (You)
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isAudioEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isVideoEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
                  </div>
                </div>

                {/* Remote Participants */}
                {remoteParticipants.map(([socketId, stream]) => {
                  const participant = participants.get(socketId);
                  const videoTrack = stream?.getVideoTracks()[0];
                  const audioTrack = stream?.getAudioTracks()[0];
                  
                  return (
                    <div key={socketId} className="glass-panel backdrop-blur-sm bg-white/5 border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded sm:rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {participant?.name?.[0]?.toUpperCase() || 'P'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-xs sm:text-sm truncate">
                          {participant?.name || 'Participant'}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${audioTrack?.enabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${videoTrack?.enabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls - Made Responsive */}
      {isInCall && (
        <div className="relative z-10">
          <VideoControls
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onLeaveCall={handleLeaveCall}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  );
};

export default VideoCallModal;