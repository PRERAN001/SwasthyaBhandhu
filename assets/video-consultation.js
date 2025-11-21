/**
 * SwasthyaBhandhu - Video Consultation Module
 * 
 * This module provides video consultation functionality with two modes:
 * 1. WebRTC Mode: Real peer-to-peer video calls (requires signaling server)
 * 2. Simulation Mode: Simulated video consultation for demo purposes
 * 
 * NOTE: This is STATIC implementation. In production, replace with:
 * - Professional WebRTC service (Twilio, Agora, etc.)
 * - Backend signaling server
 * - Proper authentication and session management
 */

class VideoConsultation {
    constructor(options = {}) {
        this.mode = options.mode || 'simulation'; // 'webrtc' or 'simulation'
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.signalingServer = options.signalingServer || null;
        this.isConnected = false;
        this.consultationId = null;
        
        // DOM elements
        this.localVideoElement = null;
        this.remoteVideoElement = null;
        this.statusElement = null;
        
        // Simulated video URL (placeholder - replace with actual video file)
        this.simulatedVideoUrl = options.videoUrl || 'assets/sample-consultation.mp4';
    }

    /**
     * Initialize video consultation interface
     */
    async initialize(localVideoId, remoteVideoId, statusId) {
        this.localVideoElement = document.getElementById(localVideoId);
        this.remoteVideoElement = document.getElementById(remoteVideoId);
        this.statusElement = document.getElementById(statusId);
        
        if (!this.localVideoElement || !this.remoteVideoElement) {
            console.error('Video elements not found');
            return false;
        }
        
        this.updateStatus('Ready to start consultation');
        return true;
    }

    /**
     * Start a new video consultation
     */
    async startConsultation(consultationData = {}) {
        this.consultationId = generateId('CONSULT');
        
        try {
            if (this.mode === 'webrtc') {
                await this.startWebRTCCall();
            } else {
                await this.startSimulatedCall();
            }
            
            // Save consultation record
            this.saveConsultationRecord({
                id: this.consultationId,
                ...consultationData,
                startTime: new Date().toISOString(),
                status: 'active'
            });
            
            return { success: true, consultationId: this.consultationId };
        } catch (error) {
            console.error('Error starting consultation:', error);
            this.updateStatus('Failed to start consultation');
            return { success: false, error: error.message };
        }
    }

    /**
     * Start WebRTC video call
     */
    async startWebRTCCall() {
        this.updateStatus('Requesting camera and microphone access...');
        
        // Get local media stream
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 },
                audio: true
            });
            
            this.localVideoElement.srcObject = this.localStream;
            this.updateStatus('Camera ready. Connecting to peer...');
            
            // Initialize peer connection
            await this.initializePeerConnection();
            
        } catch (error) {
            console.error('Error accessing media devices:', error);
            this.updateStatus('Camera/microphone access denied. Using simulation mode.');
            // Fallback to simulation
            this.mode = 'simulation';
            await this.startSimulatedCall();
        }
    }

    /**
     * Initialize WebRTC peer connection
     */
    async initializePeerConnection() {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };
        
        this.peerConnection = new RTCPeerConnection(configuration);
        
        // Add local stream tracks
        this.localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, this.localStream);
        });
        
        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
                this.remoteVideoElement.srcObject = this.remoteStream;
            }
            this.remoteStream.addTrack(event.track);
            this.updateStatus('Connected');
            this.isConnected = true;
        };
        
        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.signalingServer) {
                // Send candidate to signaling server
                this.sendToSignalingServer({
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state
        this.peerConnection.onconnectionstatechange = () => {
            this.updateStatus(`Connection: ${this.peerConnection.connectionState}`);
            
            if (this.peerConnection.connectionState === 'connected') {
                this.isConnected = true;
            } else if (this.peerConnection.connectionState === 'failed' || 
                       this.peerConnection.connectionState === 'disconnected') {
                this.isConnected = false;
            }
        };
        
        this.updateStatus('Peer connection initialized. Waiting for remote peer...');
    }

    /**
     * Start simulated video call (for demo purposes)
     */
    async startSimulatedCall() {
        this.updateStatus('Starting simulated consultation...');
        
        try {
            // Get local camera
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            this.localVideoElement.srcObject = this.localStream;
        } catch (error) {
            // If camera not available, show placeholder
            this.localVideoElement.style.backgroundColor = '#1f2937';
            this.localVideoElement.style.display = 'flex';
            this.localVideoElement.style.alignItems = 'center';
            this.localVideoElement.style.justifyContent = 'center';
            
            const placeholder = document.createElement('div');
            placeholder.textContent = 'Your Camera';
            placeholder.style.color = 'white';
            this.localVideoElement.appendChild(placeholder);
        }
        
        // Simulate remote video with placeholder or video file
        this.simulateRemoteVideo();
        
        this.isConnected = true;
        this.updateStatus('Consultation in progress (Simulated)');
    }

    /**
     * Simulate remote video stream
     */
    simulateRemoteVideo() {
        // Try to use video file if available
        const videoFile = this.remoteVideoElement;
        videoFile.src = this.simulatedVideoUrl;
        videoFile.loop = true;
        videoFile.muted = false;
        
        videoFile.play().catch(() => {
            // If video file not found, show placeholder
            this.remoteVideoElement.style.backgroundColor = '#374151';
            this.remoteVideoElement.style.display = 'flex';
            this.remoteVideoElement.style.alignItems = 'center';
            this.remoteVideoElement.style.justifyContent = 'center';
            
            const placeholder = document.createElement('div');
            placeholder.innerHTML = `
                <div style="color: white; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">👨‍⚕️</div>
                    <div>Remote Participant</div>
                    <div style="font-size: 12px; color: #9ca3af; margin-top: 5px;">
                        (Place video file at: ${this.simulatedVideoUrl})
                    </div>
                </div>
            `;
            this.remoteVideoElement.appendChild(placeholder);
        });
    }

    /**
     * End the consultation
     */
    async endConsultation() {
        this.updateStatus('Ending consultation...');
        
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
        }
        
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        // Clear video elements
        if (this.localVideoElement) {
            this.localVideoElement.srcObject = null;
        }
        if (this.remoteVideoElement) {
            this.remoteVideoElement.srcObject = null;
            this.remoteVideoElement.src = '';
        }
        
        // Update consultation record
        if (this.consultationId) {
            this.updateConsultationRecord(this.consultationId, {
                endTime: new Date().toISOString(),
                status: 'completed'
            });
        }
        
        this.isConnected = false;
        this.updateStatus('Consultation ended');
    }

    /**
     * Toggle microphone
     */
    toggleMicrophone() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }

    /**
     * Toggle camera
     */
    toggleCamera() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }

    /**
     * Update status display
     */
    updateStatus(message) {
        console.log('Video Consultation:', message);
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
    }

    /**
     * Send data to signaling server (WebRTC mode)
     */
    sendToSignalingServer(data) {
        if (this.signalingServer) {
            // In production, this would send to actual signaling server
            console.log('Send to signaling server:', data);
            // Example: this.signalingServer.emit('message', data);
        }
    }

    /**
     * Save consultation record to storage
     */
    saveConsultationRecord(record) {
        const consultations = JSON.parse(localStorage.getItem(StorageKeys.CONSULTATIONS) || '[]');
        consultations.push(record);
        localStorage.setItem(StorageKeys.CONSULTATIONS, JSON.stringify(consultations));
    }

    /**
     * Update consultation record
     */
    updateConsultationRecord(consultationId, updates) {
        const consultations = JSON.parse(localStorage.getItem(StorageKeys.CONSULTATIONS) || '[]');
        const index = consultations.findIndex(c => c.id === consultationId);
        
        if (index !== -1) {
            consultations[index] = { ...consultations[index], ...updates };
            localStorage.setItem(StorageKeys.CONSULTATIONS, JSON.stringify(consultations));
        }
    }

    /**
     * Get consultation history
     */
    static getConsultationHistory(userId = null) {
        const consultations = JSON.parse(localStorage.getItem(StorageKeys.CONSULTATIONS) || '[]');
        
        if (userId) {
            return consultations.filter(c => 
                c.doctorId === userId || c.patientId === userId
            );
        }
        
        return consultations;
    }

    /**
     * Play recorded consultation
     */
    static playRecordedConsultation(videoElementId, consultationId) {
        const videoElement = document.getElementById(videoElementId);
        if (!videoElement) return;
        
        // In production, this would fetch the actual recording
        // For demo, use the sample video
        videoElement.src = 'assets/sample-consultation.mp4';
        videoElement.controls = true;
        videoElement.play().catch(err => {
            console.error('Error playing video:', err);
            // Show placeholder if video not found
            videoElement.style.backgroundColor = '#1f2937';
            const placeholder = document.createElement('div');
            placeholder.innerHTML = `
                <div style="color: white; padding: 20px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📹</div>
                    <div>Consultation Recording</div>
                    <div style="font-size: 12px; color: #9ca3af; margin-top: 10px;">
                        Recording ID: ${consultationId}<br>
                        (Video file not found)
                    </div>
                </div>
            `;
            videoElement.appendChild(placeholder);
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoConsultation;
}
