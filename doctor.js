/**
 * SwasthyaBhandhu - Doctor Dashboard
 * 
 * NOTE: All data is static and stored in localStorage.
 * In production, replace with API calls to backend server.
 */

// Global variables
let currentUser = null;
let videoConsultation = null;
let currentConversation = null;

// Groq API Configuration - Load from config.js
const GROQ_API_KEY = () => CONFIG.GROQ_API_KEY || prompt('Please enter your Groq API key:');
const GROQ_API_URL = CONFIG.GROQ_API_URL;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUser = requireAuth(['doctor']);
    if (!currentUser) return;

    // Display user name
    document.getElementById('user-name').textContent = currentUser.name;

    // Initialize tabs
    initializeTabs('doctor-tabs');

    // Load data
    loadProfile();
    loadAppointments();
    loadPatients();
    loadConsultationHistory();
    loadMessages();
    loadAnalytics();

    // Initialize video consultation
    videoConsultation = new VideoConsultation({ mode: 'simulation' });
    videoConsultation.initialize('local-video', 'remote-video', 'consultation-status');
});

// ============== PROFILE MANAGEMENT ==============

function loadProfile() {
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-specialization').value = currentUser.specialization || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-license').value = currentUser.licenseNo || '';
    document.getElementById('profile-experience').value = currentUser.experience || '';
    document.getElementById('profile-about').value = currentUser.about || '';
}

function saveProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const updates = {
        name: form.name.value,
        specialization: form.specialization.value,
        email: form.email.value,
        phone: form.phone.value,
        licenseNo: form.licenseNo.value,
        experience: form.experience.value,
        about: form.about.value
    };

    if (updateUser(currentUser.id, updates)) {
        currentUser = { ...currentUser, ...updates };
        localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(currentUser));
        showAlert('Profile updated successfully!', 'success');
    } else {
        showAlert('Failed to update profile', 'error');
    }

    return false;
}

// ============== APPOINTMENTS ==============

function loadAppointments() {
    const appointments = getAppointments();
    const tbody = document.getElementById('appointments-list');
    
    if (appointments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No appointments scheduled</td></tr>';
        return;
    }

    tbody.innerHTML = appointments.map(apt => `
        <tr>
            <td>${apt.patientName}</td>
            <td>${formatDateTime(apt.dateTime)}</td>
            <td><span class="badge badge-info">${apt.type}</span></td>
            <td><span class="badge badge-${getStatusBadge(apt.status)}">${apt.status}</span></td>
            <td>
                <button class="btn btn-outline" onclick="viewAppointment('${apt.id}')">View</button>
                ${apt.status === 'scheduled' ? `<button class="btn btn-secondary" onclick="completeAppointment('${apt.id}')">Complete</button>` : ''}
            </td>
        </tr>
    `).join('');
    
    // Populate patient select for new appointments
    const patients = getAllUsers().filter(u => u.role === 'patient');
    const patientSelect = document.getElementById('patient-select');
    patientSelect.innerHTML = '<option value="">Select Patient</option>' + 
        patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function getAppointments() {
    const allAppointments = JSON.parse(localStorage.getItem(StorageKeys.APPOINTMENTS) || '[]');
    return allAppointments.filter(a => a.doctorId === currentUser.id)
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
}

function addAppointment(event) {
    event.preventDefault();
    
    const form = event.target;
    const patients = getAllUsers();
    const patient = patients.find(p => p.id === form.patientId.value);
    
    const appointment = {
        id: generateId('APT'),
        doctorId: currentUser.id,
        doctorName: currentUser.name,
        patientId: form.patientId.value,
        patientName: patient ? patient.name : 'Unknown',
        dateTime: `${form.date.value}T${form.time.value}`,
        type: form.type.value,
        status: 'scheduled',
        notes: form.notes.value,
        createdAt: new Date().toISOString()
    };

    const appointments = JSON.parse(localStorage.getItem(StorageKeys.APPOINTMENTS) || '[]');
    appointments.push(appointment);
    localStorage.setItem(StorageKeys.APPOINTMENTS, JSON.stringify(appointments));

    showAlert('Appointment scheduled successfully!', 'success');
    closeModal('add-appointment-modal');
    form.reset();
    loadAppointments();
    loadAnalytics();

    return false;
}

function completeAppointment(id) {
    const appointments = JSON.parse(localStorage.getItem(StorageKeys.APPOINTMENTS) || '[]');
    const index = appointments.findIndex(a => a.id === id);
    
    if (index !== -1) {
        appointments[index].status = 'completed';
        localStorage.setItem(StorageKeys.APPOINTMENTS, JSON.stringify(appointments));
        showAlert('Appointment marked as completed', 'success');
        loadAppointments();
        loadAnalytics();
    }
}

function viewAppointment(id) {
    const appointments = getAppointments();
    const apt = appointments.find(a => a.id === id);
    if (apt) {
        alert(`Appointment Details:

Patient: ${apt.patientName}
Date: ${formatDateTime(apt.dateTime)}
Type: ${apt.type}
Status: ${apt.status}
Notes: ${apt.notes || 'None'}`);
    }
}

function getStatusBadge(status) {
    const badges = {
        'scheduled': 'info',
        'completed': 'success',
        'cancelled': 'danger'
    };
    return badges[status] || 'info';
}

// ============== VIDEO CONSULTATION ==============

async function startConsultation() {
    const result = await videoConsultation.startConsultation({
        doctorId: currentUser.id,
        doctorName: currentUser.name,
        patientId: 'P001', // In production, select from appointment
        patientName: 'Patient Name',
        type: 'video'
    });

    if (result.success) {
        document.getElementById('end-call-btn').style.display = 'inline-block';
        document.getElementById('mic-btn').style.display = 'inline-block';
        document.getElementById('camera-btn').style.display = 'inline-block';
    }
}

async function endConsultation() {
    await videoConsultation.endConsultation();
    
    document.getElementById('end-call-btn').style.display = 'none';
    document.getElementById('mic-btn').style.display = 'none';
    document.getElementById('camera-btn').style.display = 'none';
    
    loadConsultationHistory();
    loadAnalytics();
}

function toggleMicrophone() {
    const enabled = videoConsultation.toggleMicrophone();
    const btn = document.getElementById('mic-btn');
    btn.textContent = enabled ? '🎤 Mute' : '🎤 Unmute';
}

function toggleCamera() {
    const enabled = videoConsultation.toggleCamera();
    const btn = document.getElementById('camera-btn');
    btn.textContent = enabled ? '📹 Stop Video' : '📹 Start Video';
}

function saveConsultationNotes() {
    const notes = document.getElementById('consultation-notes').value;
    if (notes.trim()) {
        showAlert('Consultation notes saved', 'success');
        // In production, save to backend
    }
}

// ============== AI VOICE TO SUMMARY GENERATOR ==============

let mediaRecorder = null;
let audioChunks = [];

function startVoiceRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            mediaRecorder.addEventListener('stop', async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await processVoiceToSummary(audioBlob);
            });
            
            mediaRecorder.start();
            showAlert('Voice recording started...', 'info');
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            showAlert('Could not access microphone', 'error');
        });
}

function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        showAlert('Processing voice notes...', 'info');
    }
}

async function processVoiceToSummary(audioBlob) {
    // For demo purposes, we'll use text input instead of actual speech-to-text
    // In production, integrate with speech-to-text API (Groq Whisper, Google Speech-to-Text, etc.)
    
    const voiceText = prompt('Enter your voice notes (speech-to-text simulation):');
    if (!voiceText) return;
    
    try {
        const prompt = `You are a medical documentation assistant. Convert these doctor's voice notes into a structured consultation summary.

Doctor's Voice Notes:
"${voiceText}"

Generate a professional medical summary with:
1. Chief Complaint
2. History of Present Illness
3. Physical Examination Findings
4. Assessment/Diagnosis
5. Treatment Plan
6. Follow-up Instructions

Format in clear, concise medical documentation style.`;

        const summary = await callGroqAPI(prompt);
        
        // Insert summary into consultation notes
        const notesArea = document.getElementById('consultation-notes');
        notesArea.value = summary;
        
        showAlert('Voice notes converted to summary!', 'success');
        
    } catch (error) {
        console.error('Error processing voice summary:', error);
        showAlert('Failed to generate summary', 'error');
    }
}

async function callGroqAPI(prompt) {
    const apiKey = typeof GROQ_API_KEY === 'function' ? GROQ_API_KEY() : GROQ_API_KEY;
    
    if (!apiKey) {
        throw new Error('Groq API key not configured');
    }
    
    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are a helpful medical AI assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2048
        })
    });

    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'Failed to generate content.';
}

// ============== PATIENT RECORDS ==============

function loadPatients() {
    const patients = getAllUsers().filter(u => u.role === 'patient');
    const grid = document.getElementById('patients-grid');
    
    if (patients.length === 0) {
        grid.innerHTML = '<p>No patient records found</p>';
        return;
    }

    grid.innerHTML = patients.map(patient => `
        <div class="patient-card" onclick="viewPatient('${patient.id}')">
            <div class="patient-card-header">
                <div>
                    <div class="patient-name">${patient.name}</div>
                    <div class="patient-id">ID: ${patient.id}</div>
                </div>
                <span class="badge badge-${patient.active ? 'success' : 'danger'}">
                    ${patient.active ? 'Active' : 'Inactive'}
                </span>
            </div>
            <div class="patient-info">
                <div class="patient-info-item">
                    <strong>Age:</strong> ${patient.age || 'N/A'}
                </div>
                <div class="patient-info-item">
                    <strong>Blood Group:</strong> ${patient.bloodGroup || 'N/A'}
                </div>
                <div class="patient-info-item">
                    <strong>Phone:</strong> ${patient.phone || 'N/A'}
                </div>
            </div>
        </div>
    `).join('');

    // Search functionality
    document.getElementById('patient-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.patient-card');
        
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query) ? 'block' : 'none';
        });
    });
}

function viewPatient(patientId) {
    const patients = getAllUsers();
    const patient = patients.find(p => p.id === patientId);
    
    if (!patient) return;

    const content = document.getElementById('patient-details-content');
    content.innerHTML = `
        <div class="patient-details">
            <h4>${patient.name}</h4>
            <p><strong>ID:</strong> ${patient.id}</p>
            <p><strong>Email:</strong> ${patient.email}</p>
            <p><strong>Phone:</strong> ${patient.phone}</p>
            <p><strong>Age:</strong> ${patient.age || 'N/A'}</p>
            <p><strong>Blood Group:</strong> ${patient.bloodGroup || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="badge badge-${patient.active ? 'success' : 'danger'}">${patient.active ? 'Active' : 'Inactive'}</span></p>
        </div>
    `;
    
    openModal('view-patient-modal');
}

// ============== CONSULTATION HISTORY ==============

function loadConsultationHistory() {
    const consultations = VideoConsultation.getConsultationHistory(currentUser.id);
    const container = document.getElementById('consultation-history-list');
    
    if (consultations.length === 0) {
        container.innerHTML = '<p>No consultation history found</p>';
        return;
    }

    container.innerHTML = consultations.map(consultation => `
        <div class="consultation-history-item">
            <div class="consultation-history-header">
                <div>
                    <h4>${consultation.patientName || 'Patient'}</h4>
                    <p>${formatDateTime(consultation.startTime)}</p>
                </div>
                <span class="badge badge-${consultation.status === 'completed' ? 'success' : 'info'}">
                    ${consultation.status}
                </span>
            </div>
            <p><strong>Duration:</strong> ${calculateDuration(consultation.startTime, consultation.endTime)}</p>
            <button class="btn btn-primary mt-2" onclick="playConsultation('${consultation.id}')">
                📹 Play Recording
            </button>
            <div id="video-player-${consultation.id}" style="display: none; margin-top: 1rem;">
                <video class="consultation-video-player" controls id="video-${consultation.id}"></video>
            </div>
        </div>
    `).join('');
}

function playConsultation(consultationId) {
    const playerDiv = document.getElementById(`video-player-${consultationId}`);
    playerDiv.style.display = 'block';
    VideoConsultation.playRecordedConsultation(`video-${consultationId}`, consultationId);
}

function calculateDuration(start, end) {
    if (!end) return 'In Progress';
    const duration = Math.floor((new Date(end) - new Date(start)) / 1000 / 60);
    return `${duration} minutes`;
}

// ============== MESSAGING ==============

function loadMessages() {
    const conversations = getConversations();
    const list = document.getElementById('conversations-list');
    
    if (conversations.length === 0) {
        list.innerHTML = '<p>No conversations</p>';
        return;
    }

    list.innerHTML = conversations.map(conv => `
        <div class="conversation-item" onclick="selectConversation('${conv.id}')">
            <div class="conversation-name">${conv.name}</div>
            <div class="conversation-preview">${conv.lastMessage}</div>
        </div>
    `).join('');
}

function getConversations() {
    // Static demo conversations
    const patients = getAllUsers().filter(u => u.role === 'patient');
    return patients.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        lastMessage: 'Thank you for the consultation'
    }));
}

function selectConversation(userId) {
    currentConversation = userId;
    
    // Highlight selected conversation
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Load messages
    loadConversationMessages(userId);
}

function loadConversationMessages(userId) {
    const container = document.getElementById('messages-container');
    const user = getAllUsers().find(u => u.id === userId);
    
    // Static demo messages
    const demoMessages = [
        { sender: userId, text: 'Hello Doctor, I need to schedule an appointment', time: new Date(Date.now() - 3600000).toISOString() },
        { sender: currentUser.id, text: 'Hello! I can help you with that. What time works best for you?', time: new Date(Date.now() - 3000000).toISOString() },
        { sender: userId, text: 'Tomorrow afternoon would be great', time: new Date(Date.now() - 2400000).toISOString() }
    ];
    
    container.innerHTML = demoMessages.map(msg => `
        <div class="message-item ${msg.sender === currentUser.id ? 'sent' : ''}">
            <div class="message-bubble">
                <div class="message-text">${msg.text}</div>
                <div class="message-time">${formatTime(msg.time)}</div>
            </div>
        </div>
    `).join('');
    
    container.scrollTop = container.scrollHeight;
}

function sendMessage() {
    if (!currentConversation) {
        showAlert('Please select a conversation first', 'warning');
        return;
    }
    
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text) return;
    
    // Add message to UI
    const container = document.getElementById('messages-container');
    const messageHtml = `
        <div class="message-item sent">
            <div class="message-bubble">
                <div class="message-text">${text}</div>
                <div class="message-time">${formatTime(new Date().toISOString())}</div>
            </div>
        </div>
    `;
    
    container.innerHTML += messageHtml;
    container.scrollTop = container.scrollHeight;
    
    input.value = '';
    showAlert('Message sent', 'success');
}

// ============== ANALYTICS ==============

function loadAnalytics() {
    const patients = getAllUsers().filter(u => u.role === 'patient');
    const consultations = VideoConsultation.getConsultationHistory(currentUser.id);
    const appointments = getAppointments();
    const pendingAppointments = appointments.filter(a => a.status === 'scheduled');
    
    document.getElementById('total-patients').textContent = patients.length;
    document.getElementById('total-consultations').textContent = consultations.length;
    document.getElementById('pending-appointments').textContent = pendingAppointments.length;
    
    // Recent activity
    const activityContainer = document.getElementById('recent-activity');
    const activities = [
        { text: 'Completed video consultation with patient', time: new Date(Date.now() - 7200000).toISOString() },
        { text: 'Updated patient record', time: new Date(Date.now() - 14400000).toISOString() },
        { text: 'Scheduled new appointment', time: new Date(Date.now() - 21600000).toISOString() }
    ];
    
    activityContainer.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div>${activity.text}</div>
            <div class="activity-time">${formatDateTime(activity.time)}</div>
        </div>
    `).join('');
}
