import { useEffect, useRef, useState } from 'react';

const VideoParticipant = ({ socketId, stream, participant }) => {
  const videoRef = useRef(null);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!videoRef.current || !stream) return;

    console.log('🎥 Attaching stream for participant:', socketId);

    try {
      videoRef.current.srcObject = stream;
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Video playing for:', socketId);
            setHasError(false);
          })
          .catch(error => {
            console.error('❌ Error playing video for:', socketId, error);
            setHasError(true);
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(e => console.error('Retry failed:', e));
              }
            }, 1000);
          });
      }
    } catch (error) {
      console.error('❌ Error setting srcObject for participant:', socketId, error);
      setHasError(true);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream, socketId]);

  useEffect(() => {
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    setIsVideoActive(videoTrack?.enabled ?? false);
    setIsAudioActive(audioTrack?.enabled ?? false);

    const handleVideoMute = () => setIsVideoActive(false);
    const handleVideoUnmute = () => setIsVideoActive(true);
    const handleVideoEnd = () => setIsVideoActive(false);
    const handleAudioMute = () => setIsAudioActive(false);
    const handleAudioUnmute = () => setIsAudioActive(true);

    if (videoTrack) {
      videoTrack.addEventListener('mute', handleVideoMute);
      videoTrack.addEventListener('unmute', handleVideoUnmute);
      videoTrack.addEventListener('ended', handleVideoEnd);
    }

    if (audioTrack) {
      audioTrack.addEventListener('mute', handleAudioMute);
      audioTrack.addEventListener('unmute', handleAudioUnmute);
    }

    return () => {
      if (videoTrack) {
        videoTrack.removeEventListener('mute', handleVideoMute);
        videoTrack.removeEventListener('unmute', handleVideoUnmute);
        videoTrack.removeEventListener('ended', handleVideoEnd);
      }
      if (audioTrack) {
        audioTrack.removeEventListener('mute', handleAudioMute);
        audioTrack.removeEventListener('unmute', handleAudioUnmute);
      }
    };
  }, [stream, socketId]);

  return (
    <div className="relative glass-panel backdrop-blur-sm bg-white/5 border-white/20 rounded-2xl overflow-hidden group aspect-video animate-scale-in">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover bg-slate-800"
        muted
      />

      {/* Video Off Overlay */}
      {!isVideoActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 z-10">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <span className="text-white text-xl font-bold">
              {participant?.name?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <p className="text-white font-semibold text-sm">{participant?.name || 'Participant'}</p>
        </div>
      )}

      {/* Participant Info Overlay */}
      <div className="absolute bottom-2 left-2 flex flex-wrap items-center gap-1 z-20">
        <span className="glass-panel backdrop-blur-md bg-slate-900/80 text-white px-2 py-1 rounded-lg text-xs font-semibold border border-white/20">
          {participant?.name || 'Participant'}
        </span>

        {!isAudioActive && (
          <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold flex items-center gap-0.5 shadow-lg">
            <span className="text-[10px]">🔇</span>
            Muted
          </span>
        )}
      </div>

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 text-red-300 text-sm font-semibold z-30">
          Stream Error
        </div>
      )}
    </div>
  );
};

export default VideoParticipant;