import { useEffect, useRef, useState } from "react";

export function useWebRTC(socket: WebSocket | null, participantId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  // Initialize media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
      } catch (error) {
        console.error('Failed to get user media:', error);
      }
    };

    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Setup peer connection
  useEffect(() => {
    if (!socket) return;

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    peerConnectionRef.current = peerConnection;

    // Add local stream to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      setRemoteStream(stream);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'webrtc-signal',
          signal: {
            type: 'ice-candidate',
            candidate: event.candidate,
          },
          targetParticipantId: 'other', // In a real app, this would be the specific participant
        }));
      }
    };

    // Handle WebRTC signaling messages
    const handleMessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'webrtc-signal') {
        const { signal } = data;
        
        if (signal.type === 'offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          
          socket.send(JSON.stringify({
            type: 'webrtc-signal',
            signal: {
              type: 'answer',
              sdp: answer.sdp,
            },
            targetParticipantId: data.fromParticipantId,
          }));
        } else if (signal.type === 'answer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === 'ice-candidate') {
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
      peerConnection.close();
    };
  }, [socket, localStream]);

  const startCall = async (targetParticipantId: string) => {
    if (!peerConnectionRef.current || !socket) return;

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.send(JSON.stringify({
        type: 'webrtc-signal',
        signal: {
          type: 'offer',
          sdp: offer.sdp,
        },
        targetParticipantId,
      }));
      
      setIsCallActive(true);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const shareScreen = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      if (peerConnectionRef.current && localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(screenStream.getVideoTracks()[0]);
        }
        
        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        };
      }
    } catch (error) {
      console.error('Failed to share screen:', error);
      throw error;
    }
  };

  const stopScreenShare = () => {
    if (peerConnectionRef.current && localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => 
        s.track && s.track.kind === 'video'
      );
      
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    isCallActive,
    startCall,
    toggleAudio,
    toggleVideo,
    shareScreen,
    stopScreenShare,
  };
}
