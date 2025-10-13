import { useState, useEffect, useRef, useCallback } from 'react';
import { socketService } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export const useVideoCall = (workspaceId, currentUser) => {
  const [isInCall, setIsInCall] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [participants, setParticipants] = useState(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const peerConnections = useRef(new Map());
  const pendingCandidates = useRef(new Map());
  const localStreamRef = useRef(null);

  // Create peer connection
  const createPeerConnection = useCallback((socketId, isInitiator = false) => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`Adding ${track.kind} track to peer connection`);
          pc.addTrack(track, localStreamRef.current);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.sendIceCandidate(socketId, event.candidate);
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('Received remote track from:', socketId);
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(socketId, event.streams[0]);
          return newMap;
        });
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`Connection state with ${socketId}:`, pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          handlePeerDisconnected(socketId);
        }
      };

      peerConnections.current.set(socketId, pc);
      return pc;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      setError('Failed to create peer connection');
      return null;
    }
  }, []);

  // Handle incoming offer
  const handleOffer = useCallback(async ({ offer, fromSocketId, userId, userName }) => {
    try {
      console.log('Received offer from:', fromSocketId);

      // Add participant info
      setParticipants(prev => new Map(prev).set(fromSocketId, { userId, userName }));

      const pc = createPeerConnection(fromSocketId, false);
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Add any pending ICE candidates
      const candidates = pendingCandidates.current.get(fromSocketId) || [];
      for (const candidate of candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.current.delete(fromSocketId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.sendVideoAnswer(
        fromSocketId, 
        answer, 
        currentUser.id, 
        `${currentUser.first_name} ${currentUser.last_name}`
      );
    } catch (error) {
      console.error('Error handling offer:', error);
      setError('Failed to handle video offer');
    }
  }, [createPeerConnection, currentUser]);

  // Handle incoming answer
  const handleAnswer = useCallback(async ({ answer, fromSocketId, userId, userName }) => {
    try {
      console.log('Received answer from:', fromSocketId);

      setParticipants(prev => new Map(prev).set(fromSocketId, { userId, userName }));

      const pc = peerConnections.current.get(fromSocketId);
      if (!pc) {
        console.error('No peer connection found for:', fromSocketId);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Add any pending ICE candidates
      const candidates = pendingCandidates.current.get(fromSocketId) || [];
      for (const candidate of candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.current.delete(fromSocketId);
    } catch (error) {
      console.error('Error handling answer:', error);
      setError('Failed to handle video answer');
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async ({ candidate, fromSocketId }) => {
    try {
      const pc = peerConnections.current.get(fromSocketId);
      
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        // Store candidate for later if remote description not set yet
        if (!pendingCandidates.current.has(fromSocketId)) {
          pendingCandidates.current.set(fromSocketId, []);
        }
        pendingCandidates.current.get(fromSocketId).push(candidate);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  // Handle new user joining
  const handleUserJoined = useCallback(async ({ socketId, userId, userName }) => {
    try {
      console.log('User joined call:', socketId);

      setParticipants(prev => new Map(prev).set(socketId, { userId, userName }));

      // Create offer for the new user
      const pc = createPeerConnection(socketId, true);
      if (!pc) return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketService.sendVideoOffer(
        socketId, 
        offer, 
        currentUser.id, 
        `${currentUser.first_name} ${currentUser.last_name}`
      );
    } catch (error) {
      console.error('Error handling user joined:', error);
      setError('Failed to connect to new participant');
    }
  }, [createPeerConnection, currentUser]);

  // Handle user leaving
  const handleUserLeft = useCallback(({ socketId }) => {
    console.log('User left call:', socketId);
    handlePeerDisconnected(socketId);
  }, []);

  // Handle peer disconnection
  const handlePeerDisconnected = useCallback((socketId) => {
    // Close peer connection
    const pc = peerConnections.current.get(socketId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(socketId);
    }

    // Remove remote stream
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      newMap.delete(socketId);
      return newMap;
    });

    // Remove participant
    setParticipants(prev => {
      const newMap = new Map(prev);
      newMap.delete(socketId);
      return newMap;
    });

    // Clean up pending candidates
    pendingCandidates.current.delete(socketId);
  }, []);

  // Join call
  const joinCall = async () => {
    try {
      setError(null);
      setConnectionStatus('connecting');

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Connect to socket
      await socketService.connect();

      // Join video call room
      await socketService.joinVideoCall(
        workspaceId, 
        currentUser.id, 
        `${currentUser.first_name} ${currentUser.last_name}`
      );

      setIsInCall(true);
      setConnectionStatus('connected');
      console.log('Successfully joined call');
    } catch (error) {
      console.error('Error joining call:', error);
      setError(error.message || 'Failed to join call. Please check camera/microphone permissions.');
      setConnectionStatus('error');
      
      // Clean up on error
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);
    }
  };

  // Leave call
  const leaveCall = useCallback(() => {
    console.log('Leaving call...');

    // Stop local stream tracks (THIS IS CRITICAL)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }
    
    // Also stop tracks from state
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    setLocalStream(null);

    // Stop all remote streams
    remoteStreams.forEach((stream) => {
      stream.getTracks().forEach(track => track.stop());
    });

    // Close all peer connections
    peerConnections.current.forEach(pc => {
      pc.close();
    });
    peerConnections.current.clear();

    // Clear remote streams
    setRemoteStreams(new Map());
    setParticipants(new Map());

    // Clear pending candidates
    pendingCandidates.current.clear();

    // Leave socket room
    socketService.leaveVideoCall(workspaceId, currentUser.id);

    setIsInCall(false);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    setConnectionStatus('disconnected');
    setError(null);
    
    console.log('✅ Left call successfully - all tracks stopped');
  }, [workspaceId, currentUser, localStream, remoteStreams]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        socketService.toggleMedia(workspaceId, 'audio', audioTrack.enabled);
      }
    }
  }, [workspaceId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        socketService.toggleMedia(workspaceId, 'video', videoTrack.enabled);
      }
    }
  }, [workspaceId]);

  // Setup socket listeners
  useEffect(() => {
    if (!isInCall) return;

    socketService.on('existing-participants', async ({ participants: existingParticipants }) => {
      console.log('Existing participants:', existingParticipants);
      // Offers will be sent to us by existing participants
    });

    socketService.on('video-offer', handleOffer);
    socketService.on('video-answer', handleAnswer);
    socketService.on('ice-candidate', handleIceCandidate);
    socketService.on('user-joined-call', handleUserJoined);
    socketService.on('user-left-call', handleUserLeft);

    return () => {
      socketService.off('existing-participants');
      socketService.off('video-offer', handleOffer);
      socketService.off('video-answer', handleAnswer);
      socketService.off('ice-candidate', handleIceCandidate);
      socketService.off('user-joined-call', handleUserJoined);
      socketService.off('user-left-call', handleUserLeft);
    };
  }, [isInCall, handleOffer, handleAnswer, handleIceCandidate, handleUserJoined, handleUserLeft]);

// Cleanup ONLY on final unmount
useEffect(() => {
  return () => {
    // Only cleanup if we're still in a call when component unmounts
    console.log('🧹 Hook cleanup - Final unmount');
    
    // Stop tracks without calling leaveCall again
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    // Close peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
  };
}, []); // Empty array - only run on final unmount

  return {
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
  };
};