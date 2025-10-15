import  { useState, useEffect } from 'react';

const CallNotification = ({ 
  callerName, 
  callerAvatar,
  workspaceName,
  onAccept, 
  onDecline,
  autoDeclineAfter = 30000 // Auto decline after 30 seconds
}) => {
  const [timeLeft, setTimeLeft] = useState(Math.floor(autoDeclineAfter / 1000));
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto decline timeout
    const autoDecline = setTimeout(() => {
      onDecline();
    }, autoDeclineAfter);

    // Play ringtone (optional)
    const audio = new Audio('/ringtone.mp3'); // Add a ringtone file to public folder
    audio.loop = true;
    audio.play().catch(err => console.log('Could not play ringtone:', err));

    return () => {
      clearInterval(timer);
      clearTimeout(autoDecline);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [autoDeclineAfter, onDecline]);

  const handleAccept = () => {
    setIsRinging(false);
    onAccept();
  };

  const handleDecline = () => {
    setIsRinging(false);
    onDecline();
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-96">
        {/* Calling Animation */}
        <div className="flex items-center justify-center mb-4">
          <div className={`relative ${isRinging ? 'animate-pulse' : ''}`}>
            {callerAvatar ? (
              <img 
                src={callerAvatar} 
                alt={callerName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {callerName?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            
            {/* Ripple effect */}
            {isRinging && (
              <>
                <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-75"></div>
                <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-50" style={{ animationDelay: '0.5s' }}></div>
              </>
            )}
          </div>
        </div>

        {/* Caller Info */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {callerName || 'Unknown User'}
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            is calling you in
          </p>
          <p className="text-purple-600 font-semibold">
            {workspaceName || 'Workspace'}
          </p>
        </div>

        {/* Call Type Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="flex items-center space-x-1 text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Video Call</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">{timeLeft}s</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleDecline}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Decline</span>
          </button>
          
          <button
            onClick={handleAccept}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2 animate-pulse"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Accept</span>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 text-center">
          <button
            onClick={handleDecline}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            I'm busy right now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallNotification;