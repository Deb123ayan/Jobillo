export class WebRTCManager {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private socket: WebSocket;
  private participantId: string;

  constructor(socket: WebSocket, participantId: string) {
    this.socket = socket;
    this.participantId = participantId;
    
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.ontrack = (event) => {
      const [stream] = event.streams;
      this.remoteStream = stream;
      this.onRemoteStream?.(stream);
    };
  }

  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream!);
      });
      
      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  async createOffer(targetParticipantId: string): Promise<void> {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    this.sendSignal({
      type: 'offer',
      sdp: offer.sdp,
    }, targetParticipantId);
  }

  async handleOffer(offer: RTCSessionDescriptionInit, fromParticipantId: string): Promise<void> {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    this.sendSignal({
      type: 'answer',
      sdp: answer.sdp,
    }, fromParticipantId);
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  private sendSignal(signal: any, targetParticipantId?: string) {
    this.socket.send(JSON.stringify({
      type: 'webrtc-signal',
      signal,
      targetParticipantId,
    }));
  }

  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  async shareScreen(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      const videoTrack = this.localStream?.getVideoTracks()[0];
      const sender = this.peerConnection.getSenders().find(s => 
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
    } catch (error) {
      console.error('Failed to share screen:', error);
      throw error;
    }
  }

  destroy(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    this.peerConnection.close();
  }

  // Callback for when remote stream is received
  onRemoteStream?: (stream: MediaStream) => void;
}
