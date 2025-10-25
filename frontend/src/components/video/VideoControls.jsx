import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp } from 'lucide-react';

const VideoControls = ({ 
  isAudioEnabled, 
  isVideoEnabled, 
  onToggleAudio, 
  onToggleVideo, 
  onLeaveCall 
}) => {
  const ControlButton = ({ onClick, icon: Icon, label, active, variant = 'default' }) => {
    const variants = {
      default: active 
        ? 'bg-slate-700 text-white border-slate-600' 
        : 'bg-red-600 text-white border-red-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white border-red-500'
    };

    return (
      <button
        onClick={onClick}
        className={`group relative flex flex-col items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${variants[variant]} border-2 shadow-lg backdrop-blur-md`}
        aria-label={label}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        <span className="text-xs font-semibold hidden sm:block">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex justify-center px-4">
      <div className="glass-panel backdrop-blur-2xl bg-slate-900/90 border-slate-700/50 rounded-2xl shadow-2xl p-3 sm:p-4">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {/* Microphone Toggle */}
          <ControlButton
            onClick={onToggleAudio}
            icon={isAudioEnabled ? Mic : MicOff}
            label={isAudioEnabled ? 'Mute' : 'Unmute'}
            active={isAudioEnabled}
          />

          {/* Camera Toggle */}
          <ControlButton
            onClick={onToggleVideo}
            icon={isVideoEnabled ? Video : VideoOff}
            label={isVideoEnabled ? 'Stop Video' : 'Start Video'}
            active={isVideoEnabled}
          />

          {/* Screen Share (placeholder) */}
          <ControlButton
            onClick={() => console.log('Screen share')}
            icon={MonitorUp}
            label="Share Screen"
            active={true}
          />

          {/* End Call */}
          <ControlButton
            onClick={onLeaveCall}
            icon={PhoneOff}
            label="End Call"
            variant="danger"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoControls;