/**
 * SwasthyaBhandhu - Authentication Module
 * Handles login and registration for all user roles
 * 
 * NOTE: This is STATIC implementation using localStorage.
 * In production, replace with proper backend API calls.
 */

// Tab switching
document.addEventListener('DOMContentLoaded', () => {
    const authTabs = document.querySelectorAll('.auth-tab');
    const formContainers = document.querySelectorAll('.auth-form-container');

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            // Remove active class from all tabs and containers
            authTabs.forEach(t => t.classList.remove('active'));
            formContainers.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab
            tab.classList.add('active');

            // Show corresponding form
            const targetForm = document.getElementById(`${targetTab}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });

    // Check if already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        redirectToRolePage(currentUser.role);
    }
});

/**
 * Handle login form submission
 */
function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;

    // Validate inputs
    if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return false;
    }

    if (!validateEmail(email)) {
        showAlert('Please enter a valid email address', 'error');
        return false;
    }

    // Attempt login
    const result = login(email, password);

    if (result.success) {
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect to appropriate page based on role
        setTimeout(() => {
            redirectToRolePage(result.user.role);
        }, 1000);
    } else {
        showAlert(result.message || 'Login failed. Please check your credentials.', 'error');
    }

    return false;
}

/**
 * Handle registration form submission
 */
function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    
    // Get common fields
    const userData = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        password: form.password.value,
        role: form.role.value
    };

    const confirmPassword = form.confirmPassword.value;

    // Validation
    if (!userData.name || !userData.email || !userData.phone || !userData.password || !userData.role) {
        showAlert('Please fill in all required fields', 'error');
        return false;
    }

    if (!validateEmail(userData.email)) {
        showAlert('Please enter a valid email address', 'error');
        return false;
    }

    if (!validatePhone(userData.phone)) {
        showAlert('Please enter a valid phone number', 'error');
        return false;
    }

    if (userData.password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return false;
    }

    if (userData.password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return false;
    }

    // Add role-specific fields
    switch (userData.role) {
        case 'doctor':
            userData.specialization = form.specialization.value.trim();
            if (!userData.specialization) {
                showAlert('Please enter your specialization', 'error');
                return false;
            }
            break;
        
        case 'patient':
            userData.age = parseInt(form.age.value);
            userData.bloodGroup = form.bloodGroup.value;
            if (!userData.age || userData.age < 1) {
                showAlert('Please enter a valid age', 'error');
                return false;
            }
            break;
        
        case 'pharmacist':
            userData.licenseNo = form.licenseNo.value.trim();
            if (!userData.licenseNo) {
                showAlert('Please enter your license number', 'error');
                return false;
            }
            break;
    }

    // Attempt registration
    const result = register(userData);

    if (result.success) {
        showAlert('Registration successful! You can now login.', 'success');
        
        // Switch to login tab and pre-fill email
        setTimeout(() => {
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('login-email').value = userData.email;
        }, 1500);
        
        // Reset form
        form.reset();
    } else {
        showAlert(result.message || 'Registration failed. Please try again.', 'error');
    }

    return false;
}

/**
 * Handle role change to show/hide role-specific fields
 */
function handleRoleChange(role) {
    // Hide all role-specific fields
    document.querySelectorAll('.role-specific-fields').forEach(field => {
        field.style.display = 'none';
        // Make fields not required
        field.querySelectorAll('input, select').forEach(input => {
            input.removeAttribute('required');
        });
    });

    // Show selected role fields
    if (role) {
        const roleFields = document.getElementById(`${role}-fields`);
        if (roleFields) {
            roleFields.style.display = 'block';
            // Make fields required
            roleFields.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
                if (input.id !== 'blood-group') { // Blood group is optional
                    input.setAttribute('required', 'required');
                }
            });
        }
    }
}

/**
 * Fill demo credentials into login form
 */
function fillCredentials(email, password, cardEl) {
    // Fill the form fields
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    
    // Add visual feedback - highlight selected card
    const demoCards = document.querySelectorAll('.demo-card');
    demoCards.forEach(card => {
        card.classList.remove('selected');
        card.style.borderColor = '';
    });
    
    // Find and highlight the clicked card (if provided)
    if (cardEl) {
        cardEl.classList.add('selected');
    }
    
    // Show success message
    showAlert('Demo credentials filled! Click Login to continue.', 'success');
    
    // Focus on login button
    setTimeout(() => {
        const loginBtn = document.querySelector('#loginForm button[type="submit"]');
        if (loginBtn) {
            loginBtn.focus();
        }
    }, 100);
}

/**
 * Redirect user to their role-specific page
 */
function redirectToRolePage(role) {
    const pages = {
        doctor: 'doctor.html',
        patient: 'patient.html',
        pharmacist: 'pharmacist.html',
        admin: 'admin.html'
    };

    const targetPage = pages[role];
    if (targetPage) {
        window.location.href = targetPage;
    } else {
        showAlert('Invalid user role', 'error');
        logout();
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    alert.style.boxShadow = 'var(--shadow-lg)';
    alert.style.animation = 'slideIn 0.3s ease-out';

    document.body.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Add slide-in animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
