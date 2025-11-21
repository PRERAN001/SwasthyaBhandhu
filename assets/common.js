/**
 * SwasthyaBhandhu - Common JavaScript Utilities
 * This file contains shared functionality used across all pages
 */

// ============== STATIC DATA STORAGE ==============
// Note: This uses localStorage to persist data across sessions
// In a production environment, this would be replaced with API calls

const StorageKeys = {
    USERS: 'swasthya_users',
    CURRENT_USER: 'swasthya_current_user',
    APPOINTMENTS: 'swasthya_appointments',
    MESSAGES: 'swasthya_messages',
    PRESCRIPTIONS: 'swasthya_prescriptions',
    INVENTORY: 'swasthya_inventory',
    CONSULTATIONS: 'swasthya_consultations'
};

// Initialize default data if not exists
function initializeDefaultData() {
    if (!localStorage.getItem(StorageKeys.USERS)) {
        const defaultUsers = [
            // Doctors
            {
                id: 'D001',
                email: 'doctor@test.com',
                password: 'doctor123',
                role: 'doctor',
                name: 'Dr. Rajesh Kumar',
                specialization: 'Cardiologist',
                phone: '+91-9876543210',
                active: true
            },
            {
                id: 'D002',
                email: 'doctor2@test.com',
                password: 'doctor123',
                role: 'doctor',
                name: 'Dr. Priya Sharma',
                specialization: 'Pediatrician',
                phone: '+91-9876543211',
                active: true
            },
            // Patients
            {
                id: 'P001',
                email: 'patient@test.com',
                password: 'patient123',
                role: 'patient',
                name: 'Amit Patel',
                age: 35,
                phone: '+91-9876543220',
                bloodGroup: 'O+',
                active: true
            },
            {
                id: 'P002',
                email: 'patient2@test.com',
                password: 'patient123',
                role: 'patient',
                name: 'Sneha Gupta',
                age: 28,
                phone: '+91-9876543221',
                bloodGroup: 'A+',
                active: true
            },
            // Pharmacists
            {
                id: 'PH001',
                email: 'pharmacist@test.com',
                password: 'pharma123',
                role: 'pharmacist',
                name: 'Suresh Reddy',
                licenseNo: 'PH-2023-001',
                phone: '+91-9876543230',
                active: true
            },
            // Admin
            {
                id: 'A001',
                email: 'admin@test.com',
                password: 'admin123',
                role: 'admin',
                name: 'Admin User',
                phone: '+91-9876543240',
                active: true
            }
        ];
        localStorage.setItem(StorageKeys.USERS, JSON.stringify(defaultUsers));
    }

    // Initialize other data stores
    if (!localStorage.getItem(StorageKeys.APPOINTMENTS)) {
        localStorage.setItem(StorageKeys.APPOINTMENTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(StorageKeys.MESSAGES)) {
        localStorage.setItem(StorageKeys.MESSAGES, JSON.stringify([]));
    }
    if (!localStorage.getItem(StorageKeys.PRESCRIPTIONS)) {
        localStorage.setItem(StorageKeys.PRESCRIPTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(StorageKeys.INVENTORY)) {
        const defaultInventory = [
            { id: 'M001', name: 'Paracetamol 500mg', stock: 500, price: 10, expiry: '2026-12-31' },
            { id: 'M002', name: 'Amoxicillin 250mg', stock: 300, price: 50, expiry: '2026-06-30' },
            { id: 'M003', name: 'Ibuprofen 400mg', stock: 250, price: 15, expiry: '2025-12-31' }
        ];
        localStorage.setItem(StorageKeys.INVENTORY, JSON.stringify(defaultInventory));
    }
    if (!localStorage.getItem(StorageKeys.CONSULTATIONS)) {
        localStorage.setItem(StorageKeys.CONSULTATIONS, JSON.stringify([]));
    }
}

// ============== AUTHENTICATION ==============

function login(email, password) {
    const users = JSON.parse(localStorage.getItem(StorageKeys.USERS) || '[]');
    const user = users.find(u => u.email === email && u.password === password && u.active);
    
    if (user) {
        // Store current user without password
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify(userWithoutPassword));
        return { success: true, user: userWithoutPassword };
    }
    
    return { success: false, message: 'Invalid email or password' };
}

function register(userData) {
    const users = JSON.parse(localStorage.getItem(StorageKeys.USERS) || '[]');
    
    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Generate ID
    const rolePrefix = {
        doctor: 'D',
        patient: 'P',
        pharmacist: 'PH',
        admin: 'A'
    };
    const prefix = rolePrefix[userData.role] || 'U';
    const count = users.filter(u => u.role === userData.role).length + 1;
    const id = `${prefix}${String(count).padStart(3, '0')}`;
    
    const newUser = {
        id,
        ...userData,
        active: true
    };
    
    users.push(newUser);
    localStorage.setItem(StorageKeys.USERS, JSON.stringify(users));
    
    return { success: true, message: 'Registration successful' };
}

function logout() {
    localStorage.removeItem(StorageKeys.CURRENT_USER);
    window.location.href = 'index.html';
}

function getCurrentUser() {
    const userStr = localStorage.getItem(StorageKeys.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
}

function requireAuth(allowedRoles = []) {
    const user = getCurrentUser();
    
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        alert('Unauthorized access');
        logout();
        return null;
    }
    
    return user;
}

// ============== TAB MANAGEMENT ==============

function initializeTabs(tabsContainerId) {
    const tabsContainer = document.getElementById(tabsContainerId);
    if (!tabsContainer) return;
    
    const headers = tabsContainer.querySelectorAll('.tab-header');
    const contents = tabsContainer.querySelectorAll('.tab-content');
    
    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            // Remove active class from all
            headers.forEach(h => h.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            header.classList.add('active');
            contents[index].classList.add('active');
        });
    });
}

// ============== MODAL MANAGEMENT ==============

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ============== GOOGLE TRANSLATE ==============

function initializeGoogleTranslate() {
    // Add Google Translate script
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
    
    // Initialize callback
    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,hi,bn,te,ta,mr,gu,kn,ml,pa,ur',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };
}

// ============== UTILITY FUNCTIONS ==============

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTime(dateString) {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

function generateId(prefix = 'ID') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============== DATA HELPERS ==============

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function getAllUsers() {
    return JSON.parse(localStorage.getItem(StorageKeys.USERS) || '[]');
}

function updateUser(userId, updates) {
    const users = getAllUsers();
    const index = users.findIndex(u => u.id === userId);
    
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        saveData(StorageKeys.USERS, users);
        return true;
    }
    
    return false;
}

// ============== FORM VALIDATION ==============

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[+]?[\d\s-()]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const errors = [];
    
    Object.keys(rules).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        const rule = rules[fieldName];
        
        if (!field) return;
        
        const value = field.value.trim();
        
        if (rule.required && !value) {
            isValid = false;
            errors.push(`${rule.label || fieldName} is required`);
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
        
        if (rule.email && value && !validateEmail(value)) {
            isValid = false;
            errors.push(`${rule.label || fieldName} must be a valid email`);
        }
        
        if (rule.phone && value && !validatePhone(value)) {
            isValid = false;
            errors.push(`${rule.label || fieldName} must be a valid phone number`);
        }
        
        if (rule.minLength && value.length < rule.minLength) {
            isValid = false;
            errors.push(`${rule.label || fieldName} must be at least ${rule.minLength} characters`);
        }
    });
    
    if (!isValid && errors.length > 0) {
        showAlert(errors[0], 'error');
    }
    
    return isValid;
}

// ============== INITIALIZATION ==============

document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultData();
    initializeGoogleTranslate();
});
