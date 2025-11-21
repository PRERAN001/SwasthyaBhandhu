
/**
 * SwasthyaBhandhu - Admin Dashboard
 * 
 * NOTE: All data is static and stored in localStorage.
 * In production, replace with API calls to backend server.
 */

// Global variables
let currentUser = null;
let allUsers = [];

// Groq API Configuration - Load from config.js
const GROQ_API_KEY = () => CONFIG.GROQ_API_KEY || prompt('Please enter your Groq API key:');
const GROQ_API_URL = CONFIG.GROQ_API_URL;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    currentUser = requireAuth(['admin']);
    if (!currentUser) return;

    // Display user name
    document.getElementById('user-name').textContent = currentUser.name;

    // Initialize tabs
    initializeTabs('admin-tabs');

    // Load data
    loadProfile();
    loadUsers();
    loadActivityLog();
    loadStatistics();
    loadFeedback();

    // Initialize search and filters
    initializeSearch();
});

// ============== PROFILE MANAGEMENT =======
function loadProfile() {
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-admin-level').value = currentUser.adminLevel || 'standard';
}

function saveProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const updates = {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value
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

// ============== USER MANAGEMENT =======
function loadUsers() {
    allUsers = getAllUsers();
    displayUsers(allUsers);
}

function displayUsers(users) {
    const tbody = document.getElementById('users-list');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-info">${user.role}</span></td>
            <td><span class="badge badge-${user.active ? 'success' : 'danger'}">${user.active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-outline" onclick="editUser('${user.id}')">Edit</button>
                <button class="btn ${user.active ? 'btn-danger' : 'btn-secondary'}" onclick="toggleUserStatus('${user.id}')">
                    ${user.active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    const roleFilter = document.getElementById('role-filter').value;
    const searchQuery = document.getElementById('user-search').value.toLowerCase();
    
    let filtered = allUsers;
    
    // Filter by role
    if (roleFilter) {
        filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(u => 
            u.name.toLowerCase().includes(searchQuery) ||
            u.email.toLowerCase().includes(searchQuery) ||
            u.id.toLowerCase().includes(searchQuery)
        );
    }
    
    displayUsers(filtered);
}

function initializeSearch() {
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
}

function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.name;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-active').value = user.active.toString();
    
    openModal('edit-user-modal');
}

function updateUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const userId = form.userId.value;
    
    const updates = {
        name: form.name.value,
        email: form.email.value,
        role: form.role.value,
        active: form.active.value === 'true'
    };

    const users = getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) {
        showAlert('User not found', 'error');
        return false;
    }

    users[index] = { ...users[index], ...updates };
    saveData(StorageKeys.USERS, users);

    showAlert('User updated successfully!', 'success');
    closeModal('edit-user-modal');
    loadUsers();
    loadStatistics();

    return false;
}

function toggleUserStatus(userId) {
    const users = getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) return;

    const action = user.active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    user.active = !user.active;
    saveData(StorageKeys.USERS, users);

    showAlert(`User ${action}d successfully!`, 'success');
    loadUsers();
    loadStatistics();
}

// ============== ACTIVITY LOG =======
function loadActivityLog() {
    const activities = getActivityLog();
    const container = document.getElementById('activity-log');
    
    if (activities.length === 0) {
        container.innerHTML = '<p>No recent activity</p>';
        return;
    }

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-user">${activity.userName}</div>
            <div>${activity.action}</div>
            <div class="activity-time">${formatDateTime(activity.timestamp)}</div>
        </div>
    `).join('');
}

function getActivityLog() {
    // Static demo activity log
    const users = getAllUsers();
    const activities = [];
    
    // Generate demo activities
    const now = Date.now();
    
    activities.push({
        userName: users.find(u => u.role === 'patient')?.name || 'Patient',
        action: 'Scheduled an appointment',
        timestamp: new Date(now - 3600000).toISOString()
    });
    
    activities.push({
        userName: users.find(u => u.role === 'doctor')?.name || 'Doctor',
        action: 'Completed a video consultation',
        timestamp: new Date(now - 7200000).toISOString()
    });
    
    activities.push({
        userName: users.find(u => u.role === 'pharmacist')?.name || 'Pharmacist',
        action: 'Added new medicine to inventory',
        timestamp: new Date(now - 10800000).toISOString()
    });
    
    activities.push({
        userName: 'New User',
        action: 'Registered as a patient',
        timestamp: new Date(now - 14400000).toISOString()
    });
    
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ============== STATISTICS =======
function loadStatistics() {
    const users = getAllUsers();
    const appointments = JSON.parse(localStorage.getItem(StorageKeys.APPOINTMENTS) || '[]');
    const consultations = JSON.parse(localStorage.getItem(StorageKeys.CONSULTATIONS) || '[]');
    
    // User counts
    const doctors = users.filter(u => u.role === 'doctor');
    const patients = users.filter(u => u.role === 'patient');
    const pharmacists = users.filter(u => u.role === 'pharmacist');
    const activeUsers = users.filter(u => u.active);
    
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('total-doctors').textContent = doctors.length;
    document.getElementById('total-patients').textContent = patients.length;
    document.getElementById('total-pharmacists').textContent = pharmacists.length;
    document.getElementById('total-appointments').textContent = appointments.length;
    document.getElementById('total-consultations').textContent = consultations.length;
    document.getElementById('active-users').textContent = activeUsers.length;
}

// ============== FEEDBACK =======
function loadFeedback() {
    const feedbacks = JSON.parse(localStorage.getItem('swasthya_feedbacks') || '[]');
    
    // Calculate statistics
    const totalFeedback = feedbacks.length;
    const avgRating = totalFeedback > 0 
        ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedback).toFixed(1)
        : '0.0';
    
    // Rating distribution
    const distribution = {
        5: feedbacks.filter(fb => fb.rating === 5).length,
        4: feedbacks.filter(fb => fb.rating === 4).length,
        3: feedbacks.filter(fb => fb.rating === 3).length,
        2: feedbacks.filter(fb => fb.rating === 2).length,
        1: feedbacks.filter(fb => fb.rating === 1).length
    };
    
    // Update summary
    document.querySelector('.overall-rating').textContent = `${avgRating} ★`;
    document.getElementById('total-feedback-count').textContent = `${totalFeedback} reviews`;
    
    // Display rating distribution
    const distributionContainer = document.getElementById('rating-distribution');
    distributionContainer.innerHTML = Object.keys(distribution).sort((a, b) => b - a).map(rating => {
        const count = distribution[rating];
        const percentage = totalFeedback > 0 ? (count / totalFeedback * 100) : 0;
        
        return `
            <div class="rating-bar">
                <span class="rating-bar-label">${rating} ★</span>
                <div class="rating-bar-track">
                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="rating-bar-count">${count}</span>
            </div>
        `;
    }).join('');
    
    // Display recent feedback
    const feedbackList = document.getElementById('feedback-list');
    
    if (totalFeedback === 0) {
        feedbackList.innerHTML = '<p>No feedback received yet</p>';
        return;
    }
    
    const recentFeedback = feedbacks.slice(-10).reverse();
    
    feedbackList.innerHTML = recentFeedback.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div>
                    <strong>${fb.patientName}</strong>
                    <span class="badge badge-info">${fb.type}</span>
                    <span id="sentiment-${fb.id || fb.patientId}" class="badge" style="display: none;"></span>
                </div>
                <span class="feedback-rating">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span>
            </div>
            <p>${fb.comments}</p>
            <div class="flex gap-2 mt-2">
                <p class="text-secondary" style="font-size: 0.75rem;">${formatDate(fb.date)}</p>
                <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" 
                    onclick="analyzeSentiment('${fb.id || fb.patientId}', '${fb.comments.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
                    🧠 Analyze Sentiment
                </button>
            </div>
        </div>
    `).join('');
}

// ============== AI SENTIMENT ANALYSIS =======
async function analyzeSentiment(feedbackId, comment) {
    const sentimentBadge = document.getElementById(`sentiment-${feedbackId}`);
    sentimentBadge.style.display = 'inline-block';
    sentimentBadge.className = 'badge badge-info';
    sentimentBadge.innerHTML = '<span class="loading-spinner" style="width: 12px; height: 12px;"></span> Analyzing...';
    
    try {
        const prompt = `Analyze the sentiment of this customer feedback and categorize it.

Feedback: "${comment}"

Provide:
1. Sentiment: Positive, Negative, Neutral, or Mixed
2. Emotional Tone: (e.g., Happy, Frustrated, Concerned, Satisfied)
3. Key Topics: List main topics mentioned
4. Urgency Level: Low, Medium, High
5. Action Required: Yes/No

Respond in JSON format: {"sentiment": "...", "tone": "...", "topics": ["..."], "urgency": "...", "actionRequired": true/false}`;

        const response = await callGroqAPI(prompt);
        
        // Parse JSON response
        let analysis;
        try {
            analysis = JSON.parse(response);
        } catch {
            // If not valid JSON, extract sentiment from text
            analysis = {
                sentiment: response.includes('Positive') ? 'Positive' : 
                          response.includes('Negative') ? 'Negative' : 'Neutral',
                tone: 'Unknown',
                urgency: 'Low'
            };
        }
        
        // Color code based on sentiment
        let badgeClass = 'badge-info';
        if (analysis.sentiment === 'Positive') badgeClass = 'badge-success';
        else if (analysis.sentiment === 'Negative') badgeClass = 'badge-danger';
        else if (analysis.sentiment === 'Mixed') badgeClass = 'badge-warning';
        
        sentimentBadge.className = `badge ${badgeClass}`;
        sentimentBadge.innerHTML = `${analysis.sentiment} | ${analysis.tone || 'N/A'} | Urgency: ${analysis.urgency || 'Low'}`;
        
        // Save analysis
        saveSentimentAnalysis(feedbackId, analysis);
        
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        sentimentBadge.className = 'badge badge-danger';
        sentimentBadge.textContent = 'Analysis Failed';
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
                { role: 'system', content: 'You are a sentiment analysis AI assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500
        })
    });

    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '{}';
}

function saveSentimentAnalysis(feedbackId, analysis) {
    const analyses = JSON.parse(localStorage.getItem('swasthya_sentiment_analyses') || '{}');
    analyses[feedbackId] = { ...analysis, analyzedAt: new Date().toISOString() };
    localStorage.setItem('swasthya_sentiment_analyses', JSON.stringify(analyses));
}
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-admin-level').value = currentUser.adminLevel || 'standard';
}

function saveProfile(event) {
    event.preventDefault();
    
    const form = event.target;
    const updates = {
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value
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

// ============== USER MANAGEMENT =======function loadUsers() {
    allUsers = getAllUsers();
    displayUsers(allUsers);
}

function displayUsers(users) {
    const tbody = document.getElementById('users-list');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-info">${user.role}</span></td>
            <td><span class="badge badge-${user.active ? 'success' : 'danger'}">${user.active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn btn-outline" onclick="editUser('${user.id}')">Edit</button>
                <button class="btn ${user.active ? 'btn-danger' : 'btn-secondary'}" onclick="toggleUserStatus('${user.id}')">
                    ${user.active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    const roleFilter = document.getElementById('role-filter').value;
    const searchQuery = document.getElementById('user-search').value.toLowerCase();
    
    let filtered = allUsers;
    
    // Filter by role
    if (roleFilter) {
        filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(u => 
            u.name.toLowerCase().includes(searchQuery) ||
            u.email.toLowerCase().includes(searchQuery) ||
            u.id.toLowerCase().includes(searchQuery)
        );
    }
    
    displayUsers(filtered);
}

function initializeSearch() {
    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
}

function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.name;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-active').value = user.active.toString();
    
    openModal('edit-user-modal');
}

function updateUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const userId = form.userId.value;
    
    const updates = {
        name: form.name.value,
        email: form.email.value,
        role: form.role.value,
        active: form.active.value === 'true'
    };

    const users = getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index === -1) {
        showAlert('User not found', 'error');
        return false;
    }

    users[index] = { ...users[index], ...updates };
    saveData(StorageKeys.USERS, users);

    showAlert('User updated successfully!', 'success');
    closeModal('edit-user-modal');
    loadUsers();
    loadStatistics();

    return false;
}

function toggleUserStatus(userId) {
    const users = getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) return;

    const action = user.active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    user.active = !user.active;
    saveData(StorageKeys.USERS, users);

    showAlert(`User ${action}d successfully!`, 'success');
    loadUsers();
    loadStatistics();
}

// ============== ACTIVITY LOG =======function loadActivityLog() {
    const activities = getActivityLog();
    const container = document.getElementById('activity-log');
    
    if (activities.length === 0) {
        container.innerHTML = '<p>No recent activity</p>';
        return;
    }

    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-user">${activity.userName}</div>
            <div>${activity.action}</div>
            <div class="activity-time">${formatDateTime(activity.timestamp)}</div>
        </div>
    `).join('');
}

function getActivityLog() {
    // Static demo activity log
    const users = getAllUsers();
    const activities = [];
    
    // Generate demo activities
    const now = Date.now();
    
    activities.push({
        userName: users.find(u => u.role === 'patient')?.name || 'Patient',
        action: 'Scheduled an appointment',
        timestamp: new Date(now - 3600000).toISOString()
    });
    
    activities.push({
        userName: users.find(u => u.role === 'doctor')?.name || 'Doctor',
        action: 'Completed a video consultation',
        timestamp: new Date(now - 7200000).toISOString()
    });
    
    activities.push({
        userName: users.find(u => u.role === 'pharmacist')?.name || 'Pharmacist',
        action: 'Added new medicine to inventory',
        timestamp: new Date(now - 10800000).toISOString()
    });
    
    activities.push({
        userName: 'New User',
        action: 'Registered as a patient',
        timestamp: new Date(now - 14400000).toISOString()
    });
    
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ============== STATISTICS =======function loadStatistics() {
    const users = getAllUsers();
    const appointments = JSON.parse(localStorage.getItem(StorageKeys.APPOINTMENTS) || '[]');
    const consultations = JSON.parse(localStorage.getItem(StorageKeys.CONSULTATIONS) || '[]');
    
    // User counts
    const doctors = users.filter(u => u.role === 'doctor');
    const patients = users.filter(u => u.role === 'patient');
    const pharmacists = users.filter(u => u.role === 'pharmacist');
    const activeUsers = users.filter(u => u.active);
    
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('total-doctors').textContent = doctors.length;
    document.getElementById('total-patients').textContent = patients.length;
    document.getElementById('total-pharmacists').textContent = pharmacists.length;
    document.getElementById('total-appointments').textContent = appointments.length;
    document.getElementById('total-consultations').textContent = consultations.length;
    document.getElementById('active-users').textContent = activeUsers.length;
}

// ============== FEEDBACK =======function loadFeedback() {
    const feedbacks = JSON.parse(localStorage.getItem('swasthya_feedbacks') || '[]');
    
    // Calculate statistics
    const totalFeedback = feedbacks.length;
    const avgRating = totalFeedback > 0 
        ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / totalFeedback).toFixed(1)
        : '0.0';
    
    // Rating distribution
    const distribution = {
        5: feedbacks.filter(fb => fb.rating === 5).length,
        4: feedbacks.filter(fb => fb.rating === 4).length,
        3: feedbacks.filter(fb => fb.rating === 3).length,
        2: feedbacks.filter(fb => fb.rating === 2).length,
        1: feedbacks.filter(fb => fb.rating === 1).length
    };
    
    // Update summary
    document.querySelector('.overall-rating').textContent = `${avgRating} ★`;
    document.getElementById('total-feedback-count').textContent = `${totalFeedback} reviews`;
    
    // Display rating distribution
    const distributionContainer = document.getElementById('rating-distribution');
    distributionContainer.innerHTML = Object.keys(distribution).sort((a, b) => b - a).map(rating => {
        const count = distribution[rating];
        const percentage = totalFeedback > 0 ? (count / totalFeedback * 100) : 0;
        
        return `
            <div class="rating-bar">
                <span class="rating-bar-label">${rating} ★</span>
                <div class="rating-bar-track">
                    <div class="rating-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="rating-bar-count">${count}</span>
            </div>
        `;
    }).join('');
    
    // Display recent feedback
    const feedbackList = document.getElementById('feedback-list');
    
    if (totalFeedback === 0) {
        feedbackList.innerHTML = '<p>No feedback received yet</p>';
        return;
    }
    
    const recentFeedback = feedbacks.slice(-10).reverse();
    
    feedbackList.innerHTML = recentFeedback.map(fb => `
        <div class="feedback-item">
            <div class="feedback-header">
                <div>
                    <strong>${fb.patientName}</strong>
                    <span class="badge badge-info">${fb.type}</span>
                    <span id="sentiment-${fb.id || fb.patientId}" class="badge" style="display: none;"></span>
                </div>
                <span class="feedback-rating">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</span>
            </div>
            <p>${fb.comments}</p>
            <div class="flex gap-2 mt-2">
                <p class="text-secondary" style="font-size: 0.75rem;">${formatDate(fb.date)}</p>
                <button class="btn btn-outline" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" 
                    onclick="analyzeSentiment('${fb.id || fb.patientId}', '${fb.comments.replace(/'/g, "\\'").replace(/"/g, '&quot;')}')">
                    🧠 Analyze Sentiment
                </button>
            </div>
        </div>
    `).join('');
}

// ============== AI SENTIMENT ANALYSIS =======async function analyzeSentiment(feedbackId, comment) {
    const sentimentBadge = document.getElementById(`sentiment-${feedbackId}`);
    sentimentBadge.style.display = 'inline-block';
    sentimentBadge.className = 'badge badge-info';
    sentimentBadge.innerHTML = '<span class="loading-spinner" style="width: 12px; height: 12px;"></span> Analyzing...';
    
    try {
        const prompt = `Analyze the sentiment of this customer feedback and categorize it.

Feedback: "${comment}"

Provide:
1. Sentiment: Positive, Negative, Neutral, or Mixed
2. Emotional Tone: (e.g., Happy, Frustrated, Concerned, Satisfied)
3. Key Topics: List main topics mentioned
4. Urgency Level: Low, Medium, High
5. Action Required: Yes/No

Respond in JSON format: {"sentiment": "...", "tone": "...", "topics": ["..."], "urgency": "...", "actionRequired": true/false}`;

        const response = await callGroqAPI(prompt);
        
        // Parse JSON response
        let analysis;
        try {
            analysis = JSON.parse(response);
        } catch {
            // If not valid JSON, extract sentiment from text
            analysis = {
                sentiment: response.includes('Positive') ? 'Positive' : 
                          response.includes('Negative') ? 'Negative' : 'Neutral',
                tone: 'Unknown',
                urgency: 'Low'
            };
        }
        
        // Color code based on sentiment
        let badgeClass = 'badge-info';
        if (analysis.sentiment === 'Positive') badgeClass = 'badge-success';
        else if (analysis.sentiment === 'Negative') badgeClass = 'badge-danger';
        else if (analysis.sentiment === 'Mixed') badgeClass = 'badge-warning';
        
        sentimentBadge.className = `badge ${badgeClass}`;
        sentimentBadge.innerHTML = `${analysis.sentiment} | ${analysis.tone || 'N/A'} | Urgency: ${analysis.urgency || 'Low'}`;
        
        // Save analysis
        saveSentimentAnalysis(feedbackId, analysis);
        
    } catch (error) {
        console.error('Error analyzing sentiment:', error);
        sentimentBadge.className = 'badge badge-danger';
        sentimentBadge.textContent = 'Analysis Failed';
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
                { role: 'system', content: 'You are a sentiment analysis AI assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500
        })
    });

    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '{}';
}

function saveSentimentAnalysis(feedbackId, analysis) {
    const analyses = JSON.parse(localStorage.getItem('swasthya_sentiment_analyses') || '{}');
    analyses[feedbackId] = { ...analysis, analyzedAt: new Date().toISOString() };
    localStorage.setItem('swasthya_sentiment_analyses', JSON.stringify(analyses));
}
