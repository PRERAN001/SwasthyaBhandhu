/**
 * SwasthyaBhandhu - Patient Dashboard
 * 
 * NOTE: All data is static and stored in localStorage.
 * In production, replace with API calls to backend server.
 */

// Global variables
let currentUser = null;
let currentDoctor = null;
let selectedRating = 0;
let currentReportId = null;

// Groq API Configuration - Load from config.js
const GROQ_API_KEY = () => CONFIG.GROQ_API_KEY || prompt('Please enter your Groq API key:');
const GROQ_API_URL = CONFIG.GROQ_API_URL;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUser = requireAuth(['patient']);
    if (!currentUser) return;

    // Display user name
    document.getElementById('user-name').textContent = currentUser.name;

    // Initialize tabs
    initializeTabs('patient-tabs');

    // Load data
    loadProfile();
    loadPreviousReports();
    loadAppointments();
    loadPrescriptions();
    loadConsultationHistory();
    loadDoctors();
    loadFeedback();
    loadDocuments();
    loadAnalytics();

    // Initialize rating stars
    initializeRatingStars();
});

// ============== PROFILE MANAGEMENT ==============

function loadProfile() {
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-age').value = currentUser.age || '';
    document.getElementById('profile-blood-group').value = currentUser.bloodGroup || '';
    document.getElementById('profile-gender').value = currentUser.gender || '';
    document.getElementById('profile-medical-history').value = currentUser.medicalHistory || '';
    document.getElementById('profile-allergies').value = currentUser.allergies || '';
}

function saveProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const updates = {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        age: parseInt(form.age.value),
        bloodGroup: form.bloodGroup.value,
        gender: form.gender.value,
        medicalHistory: form.medicalHistory.value,
        allergies: form.allergies.value
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

// ============== AI HEALTH ASSISTANT & REPORT GENERATION ==============

/**
 * Generate health report using Groq API based on conversation summary
 */
async function generateHealthReport() {
    const summaryTextarea = document.getElementById('conversation-summary');
    const conversationSummary = summaryTextarea.value.trim();
    
    if (!conversationSummary) {
        showAlert('Please enter a conversation summary to generate a report', 'error');
        return;
    }

    const generateBtn = document.getElementById('generate-report-btn');
    const originalBtnText = generateBtn.innerHTML;
    
    // Show loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading-spinner"></span> Generating Report...';
    
    try {
        // Prepare the prompt for Groq API
        const prompt = `You are a medical AI assistant. Based on the following patient conversation summary, generate a comprehensive health report.

Patient Information:
- Name: ${currentUser.name}
- Age: ${currentUser.age || 'Not specified'}
- Blood Group: ${currentUser.bloodGroup || 'Not specified'}
- Medical History: ${currentUser.medicalHistory || 'None recorded'}
- Allergies: ${currentUser.allergies || 'None recorded'}

Conversation Summary:
${conversationSummary}

Please generate a detailed health report with the following sections:
1. Chief Complaints - Summary of main symptoms/concerns
2. Symptoms Analysis - Detailed analysis of reported symptoms
3. Preliminary Assessment - Initial medical assessment (not a diagnosis)
4. Recommendations - General health recommendations
5. Action Items - Specific next steps for the patient
6. When to Seek Immediate Care - Warning signs to watch for

Format the report in HTML with appropriate headings (h3), paragraphs (p), and lists (ul/li).`;

        const reportContent = await callGroqAPI(prompt);
        
        // Save the report
        const report = {
            id: generateId('REPORT'),
            patientId: currentUser.id,
            patientName: currentUser.name,
            conversationSummary: conversationSummary,
            content: reportContent,
            generatedAt: new Date().toISOString()
        };
        
        saveHealthReport(report);
        
        // Display the report
        displayHealthReport(report);
        
        // Clear the summary textarea
        summaryTextarea.value = '';
        
        showAlert('Health report generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating report:', error);
        showAlert('Failed to generate report. Please try again.', 'error');
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalBtnText;
    }
}

/**
 * Call Groq API to generate content
 */
async function callGroqAPI(prompt) {
    try {
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
                    {
                        role: 'system',
                        content: 'You are a helpful medical AI assistant. Provide informative health reports based on patient conversations. Always include disclaimers that this is not a medical diagnosis.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 1
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'Failed to generate report content.';
        
    } catch (error) {
        console.error('Groq API Error:', error);
        throw error;
    }
}

/**
 * Save health report to localStorage
 */
function saveHealthReport(report) {
    const reports = JSON.parse(localStorage.getItem('swasthya_health_reports') || '[]');
    reports.push(report);
    localStorage.setItem('swasthya_health_reports', JSON.stringify(reports));
    loadPreviousReports();
}

/**
 * Display health report
 */
function displayHealthReport(report) {
    currentReportId = report.id;
    const reportSection = document.getElementById('health-report-section');
    const reportContent = document.getElementById('health-report-content');
    
    reportContent.innerHTML = report.content;
    reportSection.style.display = 'block';
    
    // Scroll to report
    reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Load previous health reports
 */
function loadPreviousReports() {
    const reports = JSON.parse(localStorage.getItem('swasthya_health_reports') || '[]')
        .filter(r => r.patientId === currentUser.id)
        .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    
    const container = document.getElementById('previous-reports-list');
    
    if (reports.length === 0) {
        container.innerHTML = '<p>No previous reports available</p>';
        return;
    }
    
    container.innerHTML = reports.map(report => `
        <div class="previous-report-item" onclick="viewPreviousReport('${report.id}')">
            <strong>Health Report - ${formatDate(report.generatedAt)}</strong>
            <p class="report-date">${formatDateTime(report.generatedAt)}</p>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
                ${report.conversationSummary.substring(0, 100)}${report.conversationSummary.length > 100 ? '...' : ''}
            </p>
        </div>
    `).join('');
}

/**
 * View a previous health report
 */
function viewPreviousReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('swasthya_health_reports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (report) {
        displayHealthReport(report);
    }
}

/**
 * Save conversation notes
 */
function saveConversationNotes() {
    const summaryTextarea = document.getElementById('conversation-summary');
    const notes = summaryTextarea.value.trim();
    
    if (!notes) {
        showAlert('Please enter conversation notes to save', 'error');
        return;
    }
    
    const conversationNote = {
        id: generateId('NOTE'),
        patientId: currentUser.id,
        notes: notes,
        savedAt: new Date().toISOString()
    };
    
    const allNotes = JSON.parse(localStorage.getItem('swasthya_conversation_notes') || '[]');
    allNotes.push(conversationNote);
    localStorage.setItem('swasthya_conversation_notes', JSON.stringify(allNotes));
    
    showAlert('Conversation notes saved successfully!', 'success');
}

/**
 * Download report as text file (simplified version)
 */
function downloadReport() {
    if (!currentReportId) {
        showAlert('No report to download', 'error');
        return;
    }
    
    const reports = JSON.parse(localStorage.getItem('swasthya_health_reports') || '[]');
    const report = reports.find(r => r.id === currentReportId);
    
    if (!report) {
        showAlert('Report not found', 'error');
        return;
    }
    
    // Create a simple text version
    const textContent = `
SWASTHYABHANDHU HEALTH REPORT
================================

Patient: ${report.patientName}
Date: ${formatDateTime(report.generatedAt)}
Report ID: ${report.id}

================================

CONVERSATION SUMMARY:
${report.conversationSummary}

================================

REPORT:
${stripHtml(report.content)}

================================

DISCLAIMER:
This report is for informational purposes only and does not constitute 
medical advice. Please consult a healthcare professional for proper 
diagnosis and treatment.

Generated by SwasthyaBhandhu AI Health Assistant
    `.trim();
    
    // Create and download file
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-report-${formatDate(report.generatedAt)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('Report downloaded successfully!', 'success');
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// ============== AI SYMPTOM CHECKER ==============

async function checkSymptoms(event) {
    event.preventDefault();
    
    const form = event.target;
    const symptoms = form.symptoms.value;
    const duration = form.duration.value;
    const severity = form.severity.value;

    const resultDiv = document.getElementById('symptom-result');
    const contentDiv = document.getElementById('symptom-result-content');
    
    // Show loading state
    contentDiv.innerHTML = '<div class="flex-center"><span class="loading-spinner"></span> <span class="ml-2">Analyzing symptoms with AI...</span></div>';
    resultDiv.style.display = 'block';
    
    try {
        // AI-powered symptom analysis using Groq
        const prompt = `You are a medical AI assistant. Analyze the following symptoms and provide a detailed assessment.

Patient Information:
- Name: ${currentUser.name}
- Age: ${currentUser.age || 'Not specified'}
- Medical History: ${currentUser.medicalHistory || 'None recorded'}
- Allergies: ${currentUser.allergies || 'None recorded'}

Symptoms: ${symptoms}
Duration: ${duration}
Severity: ${severity}

Provide a structured analysis with:
1. Symptom Summary
2. Possible Conditions (3-5 most likely, with percentages)
3. Urgency Level (Low/Medium/High/Emergency)
4. Self-Care Recommendations
5. When to See a Doctor
6. Warning Signs to Watch For

Format in HTML with appropriate tags. Include medical disclaimer.`;

        const aiAnalysis = await callGroqAPI(prompt);
        
        // Save symptom check to history
        saveSymptomCheck({
            symptoms,
            duration,
            severity,
            analysis: aiAnalysis,
            timestamp: new Date().toISOString()
        });
        
        contentDiv.innerHTML = `
            <div class="symptom-analysis">
                <h4>AI Symptom Analysis</h4>
                ${aiAnalysis}
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="openModal('schedule-appointment-modal')">Schedule Doctor Consultation</button>
                    <button class="btn btn-secondary" onclick="saveSymptomAnalysis()">Save Analysis</button>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error analyzing symptoms:', error);
        // Fallback to basic analysis
        let recommendation = '';
        
        if (severity === 'severe') {
            recommendation = `
                <div class="alert alert-error">
                    <strong>⚠️ Seek Immediate Medical Attention</strong>
                    <p>Based on the severity of your symptoms, we recommend consulting a doctor immediately or visiting an emergency room.</p>
                </div>
            `;
        } else if (duration === '1-week') {
            recommendation = `
                <div class="alert alert-error">
                    <strong>Consult a Doctor</strong>
                    <p>Your symptoms have persisted for over a week. We recommend scheduling an appointment with a doctor for proper evaluation.</p>
                </div>
            `;
        } else {
            recommendation = `
                <div class="alert alert-info">
                    <strong>General Recommendations</strong>
                    <p>Based on your symptoms:</p>
                    <ul>
                        <li>Rest and stay hydrated</li>
                        <li>Monitor your symptoms</li>
                        <li>Consider over-the-counter medication for symptom relief</li>
                        <li>Schedule a doctor consultation if symptoms worsen or persist</li>
                    </ul>
                </div>
            `;
        }
        
        contentDiv.innerHTML = `
            <p><strong>Symptoms:</strong> ${symptoms}</p>
            <p><strong>Duration:</strong> ${duration}</p>
            <p><strong>Severity:</strong> ${severity}</p>
            ${recommendation}
            <button class="btn btn-primary mt-2" onclick="openModal('schedule-appointment-modal')">Schedule Doctor Consultation</button>
        `;
    }
    
    return false;
}

function saveSymptomCheck(data) {
    const checks = JSON.parse(localStorage.getItem('swasthya_symptom_checks') || '[]');
    checks.push({ id: generateId('SYM'), patientId: currentUser.id, ...data });
    localStorage.setItem('swasthya_symptom_checks', JSON.stringify(checks));
}

function saveSymptomAnalysis() {
    showAlert('Symptom analysis saved to your health records', 'success');
}

// ============== APPOINTMENTS ==============

function loadAppointments() {
    const appointments = getPatientAppointments();
    const container = document.getElementById('appointments-list');
    
    if (appointments.length === 0) {
        container.innerHTML = '<p>No appointments scheduled</p>';
        return;
    }

    container.innerHTML = appointments.map(apt => `
        <div class="appointment-card">
            <div class="appointment-header">
                <div>
                    <h4>${apt.doctorName}</h4>
                    <p>${formatDateTime(apt.dateTime)}</p>
                </div>
                <span class="badge badge-${getStatusBadge(apt.status)}">${apt.status}</span>
            </div>
            <p><strong>Type:</strong> ${apt.type}</p>
            <p><strong>Reason:</strong> ${apt.reason || apt.notes || 'N/A'}</p>
            ${apt.status === 'scheduled' ? `<button class="btn btn-danger mt-2" onclick="cancelAppointment('${apt.id}')">Cancel</button>` : ''}
        </div>
    `).join('');

    // Load doctors for scheduling
    const doctors = getAllUsers().filter(u => u.role === 'doctor');
    const doctorSelect = document.getElementById('doctor-select');
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>' + 
        doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialization}</option>`).join('');
}

function getPatientAppointments() {
    const allAppointments = JSON.parse(localStorage.getItem(StorageKeys.APPOINTMENTS) || '[]');
    return allAppointments.filter(a => a.patientId === currentUser.id)
        .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
}

function scheduleAppointment(event) {
    event.preventDefault();
    
    const form = event.target;
    const doctors = getAllUsers();
    const doctor = doctors.find(d => d.id === form.doctorId.value);
    
    const appointment = {
        id: generateId('APT'),
        patientId: currentUser.id,
        patientName: currentUser.name,
        doctorId: form.doctorId.value,
        doctorName: doctor ? doctor.name : 'Unknown',
        dateTime: `${form.date.value}T${form.time.value}`,
        type: form.type.value,
        reason: form.reason.value,
        status: 'scheduled',
        createdAt: new Date().toISOString()
    };

    const appointments = JSON.parse(localStorage.getItem(StorageKeys.APPOINTMENTS) || '[]');
    appointments.push(appointment);
    localStorage.setItem(StorageKeys.APPOINTMENTS, JSON.stringify(appointments));

    showAlert('Appointment scheduled successfully!', 'success');
    closeModal('schedule-appointment-modal');
    form.reset();
    loadAppointments();
    loadAnalytics();

    return false;
}

function cancelAppointment(id) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    const appointments = JSON.parse(localStorage.getItem(StorageKeys.APPOINTMENTS) || '[]');
    const index = appointments.findIndex(a => a.id === id);
    
    if (index !== -1) {
        appointments[index].status = 'cancelled';
        localStorage.setItem(StorageKeys.APPOINTMENTS, JSON.stringify(appointments));
        showAlert('Appointment cancelled', 'success');
        loadAppointments();
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

// ============== PRESCRIPTIONS ==============

function loadPrescriptions() {
    const prescriptions = getPatientPrescriptions();
    const container = document.getElementById('prescriptions-list');
    
    if (prescriptions.length === 0) {
        container.innerHTML = '<p>No prescriptions available</p>';
        // Add demo prescription
        const demoPrescription = {
            id: 'RX001',
            patientId: currentUser.id,
            doctorName: 'Dr. Rajesh Kumar',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            medicines: [
                { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days' },
                { name: 'Vitamin D3', dosage: '1 capsule', frequency: 'Once daily', duration: '30 days' }
            ]
        };
        
        const prescriptions = [demoPrescription];
        localStorage.setItem(StorageKeys.PRESCRIPTIONS, JSON.stringify(prescriptions));
        loadPrescriptions(); // Reload
        return;
    }

    container.innerHTML = prescriptions.map(rx => `
        <div class="prescription-card">
            <div class="prescription-header">
                <h4>Prescription #${rx.id}</h4>
                <p><strong>Doctor:</strong> ${rx.doctorName}</p>
                <p><strong>Date:</strong> ${formatDate(rx.date)}</p>
            </div>
            <h5>Medicines:</h5>
            ${rx.medicines.map(med => `
                <div class="medicine-item">
                    <p><strong>${med.name}</strong></p>
                    <p>Dosage: ${med.dosage} | ${med.frequency} for ${med.duration}</p>
                </div>
            `).join('')}
            <div class="mt-2">
                <button class="btn btn-primary" onclick="downloadPrescription('${rx.id}')">📄 Download</button>
                <button class="btn btn-secondary" onclick="checkPrescriptionSafety('${rx.id}')">🛡️ Safety Check</button>
            </div>
            <div id="safety-check-${rx.id}" class="mt-2" style="display: none;"></div>
        </div>
    `).join('');
}

function getPatientPrescriptions() {
    const allPrescriptions = JSON.parse(localStorage.getItem(StorageKeys.PRESCRIPTIONS) || '[]');
    return allPrescriptions.filter(rx => rx.patientId === currentUser.id);
}

function downloadPrescription(id) {
    showAlert('Prescription download started (simulated)', 'info');
}

// ============== AI PRESCRIPTION SAFETY CHECKER ==============

async function checkPrescriptionSafety(prescriptionId) {
    const prescriptions = getPatientPrescriptions();
    const prescription = prescriptions.find(rx => rx.id === prescriptionId);
    
    if (!prescription) return;
    
    const safetyDiv = document.getElementById(`safety-check-${prescriptionId}`);
    safetyDiv.style.display = 'block';
    safetyDiv.innerHTML = '<div class="flex-center"><span class="loading-spinner"></span> <span class="ml-2">Running AI safety check...</span></div>';
    
    try {
        const medicineList = prescription.medicines.map(m => m.name).join(', ');
        
        const prompt = `You are a pharmaceutical AI assistant. Perform a comprehensive safety check for this prescription.

Patient Information:
- Name: ${currentUser.name}
- Age: ${currentUser.age || 'Not specified'}
- Medical History: ${currentUser.medicalHistory || 'None recorded'}
- Known Allergies: ${currentUser.allergies || 'None recorded'}

Prescribed Medications:
${prescription.medicines.map(m => `- ${m.name}: ${m.dosage}, ${m.frequency} for ${m.duration}`).join('\n')}

Analyze for:
1. Drug Interactions (between prescribed medicines)
2. Allergy Warnings (based on patient allergies)
3. Age Appropriateness
4. Dosage Safety
5. Potential Side Effects
6. Contraindications
7. Safety Score (0-100)

Provide results in HTML format with color-coded warnings (green=safe, yellow=caution, red=danger).`;

        const safetyAnalysis = await callGroqAPI(prompt);
        
        safetyDiv.innerHTML = `
            <div class="safety-check-result">
                <h5>🛡️ AI Safety Check Results</h5>
                ${safetyAnalysis}
                <div class="alert alert-info mt-2">
                    <small><strong>Note:</strong> This is an AI-powered analysis. Always consult your doctor or pharmacist for professional advice.</small>
                </div>
            </div>
        `;
        
        // Save safety check
        saveSafetyCheck({
            prescriptionId,
            medicines: prescription.medicines,
            analysis: safetyAnalysis,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error checking prescription safety:', error);
        safetyDiv.innerHTML = `
            <div class="alert alert-error">
                <strong>Safety Check Failed</strong>
                <p>Unable to complete AI safety analysis. Please consult your pharmacist or doctor.</p>
            </div>
        `;
    }
}

function saveSafetyCheck(data) {
    const checks = JSON.parse(localStorage.getItem('swasthya_safety_checks') || '[]');
    checks.push({ id: generateId('SAFE'), patientId: currentUser.id, ...data });
    localStorage.setItem('swasthya_safety_checks', JSON.stringify(checks));
}

// ============== CONSULTATION HISTORY ==============

function loadConsultationHistory() {
    const consultations = VideoConsultation.getConsultationHistory(currentUser.id);
    const container = document.getElementById('consultation-history-list');
    
    if (consultations.length === 0) {
        container.innerHTML = '<p>No consultation history available</p>';
        return;
    }

    container.innerHTML = consultations.map(consultation => `
        <div class="consultation-history-item">
            <div class="consultation-history-header">
                <div>
                    <h4>Dr. ${consultation.doctorName || 'Doctor'}</h4>
                    <p>${formatDateTime(consultation.startTime)}</p>
                </div>
                <span class="badge badge-${consultation.status === 'completed' ? 'success' : 'info'}">
                    ${consultation.status}
                </span>
            </div>
            <p><strong>Duration:</strong> ${calculateDuration(consultation.startTime, consultation.endTime)}</p>
            <button class="btn btn-primary mt-2" onclick="playConsultation('${consultation.id}')">
                📹 View Recording
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

// ============== FEEDBACK ==============

function initializeRatingStars() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-rating'));
            document.getElementById('rating-value').value = selectedRating;
            updateStars(selectedRating);
        });
    });
}

function updateStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function submitFeedback(event) {
    event.preventDefault();
    
    const form = event.target;
    
    if (!selectedRating) {
        showAlert('Please select a rating', 'error');
        return false;
    }

    const feedback = {
        id: generateId('FB'),
        patientId: currentUser.id,
        patientName: currentUser.name,
        type: form.type.value,
        rating: selectedRating,
        comments: form.comments.value,
        date: new Date().toISOString()
    };

    // Save feedback (in production, send to backend)
    const feedbacks = JSON.parse(localStorage.getItem('swasthya_feedbacks') || '[]');
    feedbacks.push(feedback);
    localStorage.setItem('swasthya_feedbacks', JSON.stringify(feedbacks));

    showAlert('Feedback submitted successfully!', 'success');
    form.reset();
    selectedRating = 0;
    updateStars(0);
    loadFeedback();

    return false;
}

function loadFeedback() {
    const feedbacks = JSON.parse(localStorage.getItem('swasthya_feedbacks') || '[]')
        .filter(fb => fb.patientId === currentUser.id);
    
    const container = document.getElementById('feedback-list');
    
    if (feedbacks.length === 0) {
        container.innerHTML = '<p>No feedback submitted yet</p>';
        return;
    }

    container.innerHTML = feedbacks.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <span class="badge badge-info">${fb.type}</span>
                <span class="feedback-rating">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span>
            </div>
            <p>${fb.comments}</p>
            <p class="text-secondary" style="font-size: 0.75rem;">${formatDate(fb.date)}</p>
        </div>
    `).join('');
}

// ============== DOCUMENTS ==============

function handleDocumentUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Simulate upload (in production, upload to server)
    const document = {
        id: generateId('DOC'),
        patientId: currentUser.id,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString()
    };

    const documents = JSON.parse(localStorage.getItem('swasthya_documents') || '[]');
    documents.push(document);
    localStorage.setItem('swasthya_documents', JSON.stringify(documents));

    showAlert('Document uploaded successfully!', 'success');
    event.target.value = '';
    loadDocuments();
}

function loadDocuments() {
    const documents = JSON.parse(localStorage.getItem('swasthya_documents') || '[]')
        .filter(doc => doc.patientId === currentUser.id);
    
    const container = document.getElementById('documents-list');
    
    if (documents.length === 0) {
        container.innerHTML = '<p>No documents uploaded</p>';
        return;
    }

    container.innerHTML = documents.map(doc => `
        <div class="document-item">
            <div class="document-info">
                <div class="document-icon">📄</div>
                <div>
                    <div class="document-name">${doc.name}</div>
                    <div class="document-meta">${formatDate(doc.uploadDate)} • ${(doc.size / 1024).toFixed(2)} KB</div>
                </div>
            </div>
            <button class="btn btn-danger" onclick="deleteDocument('${doc.id}')">Delete</button>
        </div>
    `).join('');
}

function deleteDocument(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    let documents = JSON.parse(localStorage.getItem('swasthya_documents') || '[]');
    documents = documents.filter(doc => doc.id !== id);
    localStorage.setItem('swasthya_documents', JSON.stringify(documents));
    
    showAlert('Document deleted', 'success');
    loadDocuments();
}

// ============== MESSAGING ==============

function loadDoctors() {
    const doctors = getAllUsers().filter(u => u.role === 'doctor');
    const container = document.getElementById('doctors-list');
    
    if (doctors.length === 0) {
        container.innerHTML = '<p>No doctors available</p>';
        return;
    }

    container.innerHTML = doctors.map(doctor => `
        <div class="doctor-item" onclick="selectDoctor('${doctor.id}')">
            <div class="doctor-name">${doctor.name}</div>
            <div class="doctor-specialization">${doctor.specialization || 'General'}</div>
        </div>
    `).join('');
}

function selectDoctor(doctorId) {
    currentDoctor = doctorId;
    
    // Highlight selected doctor
    document.querySelectorAll('.doctor-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Load messages
    loadMessages(doctorId);
}

function loadMessages(doctorId) {
    const container = document.getElementById('messages-container');
    const doctor = getAllUsers().find(u => u.id === doctorId);
    
    // Static demo messages
    const demoMessages = [
        { sender: currentUser.id, text: 'Hello Doctor, I need to discuss my test results', time: new Date(Date.now() - 3600000).toISOString() },
        { sender: doctorId, text: 'Hello! I\'d be happy to discuss your results. When would you like to schedule a consultation?', time: new Date(Date.now() - 3000000).toISOString() }
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
    if (!currentDoctor) {
        showAlert('Please select a doctor first', 'warning');
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
    const appointments = getPatientAppointments();
    const consultations = VideoConsultation.getConsultationHistory(currentUser.id);
    const prescriptions = getPatientPrescriptions();
    
    document.getElementById('total-appointments').textContent = appointments.length;
    document.getElementById('total-consultations').textContent = consultations.length;
    document.getElementById('total-prescriptions').textContent = prescriptions.length;
    
    // Find last and next appointments
    const now = new Date();
    const pastAppointments = appointments.filter(a => new Date(a.dateTime) < now && a.status === 'completed');
    const futureAppointments = appointments.filter(a => new Date(a.dateTime) > now && a.status === 'scheduled');
    
    const lastCheckup = pastAppointments.length > 0 ? 
        formatDate(pastAppointments[pastAppointments.length - 1].dateTime) : 'N/A';
    
    const nextAppointment = futureAppointments.length > 0 ?
        formatDateTime(futureAppointments[0].dateTime) : 'N/A';
    
    document.getElementById('last-checkup').textContent = lastCheckup;
    document.getElementById('next-appointment').textContent = nextAppointment;
}
