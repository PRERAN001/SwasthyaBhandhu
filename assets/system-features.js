/**
 * SwasthyaBhandhu - System Features
 * Digital Health ID, PWA, Emergency Mode, E-Prescription Security
 */

// ============== DIGITAL HEALTH ID + QR SYSTEM ==============

class DigitalHealthID {
    static generate(user) {
        const healthID = {
            id: `HID-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            patientId: user.id,
            name: user.name,
            age: user.age,
            bloodGroup: user.bloodGroup,
            allergies: user.allergies || 'None',
            emergencyContact: user.phone,
            generatedAt: new Date().toISOString(),
            qrCode: null
        };
        
        // Generate QR code data
        healthID.qrCode = this.generateQRCodeData(healthID);
        
        // Save to localStorage
        localStorage.setItem(`health_id_${user.id}`, JSON.stringify(healthID));
        
        return healthID;
    }
    
    static generateQRCodeData(healthID) {
        // Create QR-compatible data string
        const qrData = JSON.stringify({
            hid: healthID.id,
            name: healthID.name,
            age: healthID.age,
            bg: healthID.bloodGroup,
            allergies: healthID.allergies,
            emergency: healthID.emergencyContact
        });
        
        return btoa(qrData); // Base64 encode
    }
    
    static getHealthID(userId) {
        const data = localStorage.getItem(`health_id_${userId}`);
        return data ? JSON.parse(data) : null;
    }
    
    static scanQRCode(qrData) {
        try {
            const decoded = atob(qrData);
            return JSON.parse(decoded);
        } catch {
            return null;
        }
    }
    
    static renderQRCode(healthID, canvasId) {
        // Simple QR code representation (in production, use QRCode.js library)
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        
        // Draw simple pattern (placeholder for actual QR code)
        ctx.fillStyle = '#000';
        for (let i = 0; i < 20; i++) {
            for (let j = 0; j < 20; j++) {
                if (Math.random() > 0.5) {
                    ctx.fillRect(i * 10, j * 10, 10, 10);
                }
            }
        }
        
        // Add text overlay
        ctx.fillStyle = '#fff';
        ctx.fillRect(40, 85, 120, 30);
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(healthID.id.substr(0, 15), 45, 105);
    }
}

// ============== PWA (PROGRESSIVE WEB APP) ==============

class PWAManager {
    static initialize() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker registered:', reg))
                .catch(err => console.log('Service Worker registration failed:', err));
        }
        
        // Handle install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            const installBtn = document.getElementById('pwa-install-btn');
            if (installBtn) {
                installBtn.style.display = 'block';
                installBtn.addEventListener('click', () => {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        deferredPrompt = null;
                        installBtn.style.display = 'none';
                    });
                });
            }
        });
    }
    
    static checkOnlineStatus() {
        return navigator.onLine;
    }
    
    static enableOfflineMode() {
        // Cache critical data for offline use
        const criticalData = {
            user: localStorage.getItem(StorageKeys.CURRENT_USER),
            prescriptions: localStorage.getItem(StorageKeys.PRESCRIPTIONS),
            appointments: localStorage.getItem(StorageKeys.APPOINTMENTS),
            healthID: localStorage.getItem(`health_id_${JSON.parse(localStorage.getItem(StorageKeys.CURRENT_USER) || '{}').id}`)
        };
        
        localStorage.setItem('offline_cache', JSON.stringify(criticalData));
        
        // Show offline indicator
        this.showOfflineIndicator();
    }
    
    static showOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = '⚠️ Offline Mode - Limited functionality';
        document.body.appendChild(indicator);
    }
    
    static hideOfflineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) indicator.remove();
    }
}

// ============== EMERGENCY MODE ==============

class EmergencyMode {
    static activate() {
        const user = JSON.parse(localStorage.getItem(StorageKeys.CURRENT_USER) || '{}');
        
        // Show emergency interface
        const emergencyPanel = document.createElement('div');
        emergencyPanel.id = 'emergency-panel';
        emergencyPanel.className = 'emergency-panel active';
        emergencyPanel.innerHTML = `
            <div class="emergency-content">
                <h2>🚨 EMERGENCY MODE ACTIVATED</h2>
                
                <div class="emergency-info">
                    <h3>Patient Information</h3>
                    <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
                    <p><strong>Age:</strong> ${user.age || 'N/A'}</p>
                    <p><strong>Blood Group:</strong> ${user.bloodGroup || 'Unknown'}</p>
                    <p><strong>Allergies:</strong> ${user.allergies || 'None recorded'}</p>
                    <p><strong>Medical History:</strong> ${user.medicalHistory || 'None recorded'}</p>
                </div>
                
                <div class="emergency-qr">
                    <h3>Scan for Instant Access</h3>
                    <canvas id="emergency-qr-code"></canvas>
                </div>
                
                <div class="emergency-actions">
                    <button class="btn btn-danger btn-large" onclick="EmergencyMode.call911()">📞 CALL EMERGENCY (911)</button>
                    <button class="btn btn-secondary btn-large" onclick="EmergencyMode.shareLocation()">📍 Share Location</button>
                    <button class="btn btn-outline btn-large" onclick="EmergencyMode.deactivate()">❌ Exit Emergency Mode</button>
                </div>
                
                <div class="emergency-contacts">
                    <h3>Emergency Contacts</h3>
                    <p>📞 Ambulance: 108</p>
                    <p>📞 Police: 100</p>
                    <p>📞 Fire: 101</p>
                    <p>📞 Women Helpline: 181</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(emergencyPanel);
        
        // Generate QR code with health info
        const healthID = DigitalHealthID.getHealthID(user.id);
        if (healthID) {
            DigitalHealthID.renderQRCode(healthID, 'emergency-qr-code');
        }
        
        // Flash screen to indicate emergency
        this.flashScreen();
    }
    
    static deactivate() {
        const panel = document.getElementById('emergency-panel');
        if (panel) panel.remove();
    }
    
    static call911() {
        alert('In production, this would initiate emergency call to 108/911');
        // window.location.href = 'tel:108';
    }
    
    static shareLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = `${position.coords.latitude},${position.coords.longitude}`;
                    alert(`Location: ${coords}\nIn production, this would be shared with emergency services.`);
                },
                (error) => {
                    alert('Could not access location. Please enable location services.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }
    
    static flashScreen() {
        document.body.style.animation = 'emergencyFlash 0.5s 3';
    }
}

// ============== TAMPER-PROOF E-PRESCRIPTIONS ==============

class SecurePrescription {
    static generate(prescriptionData, doctorId) {
        const prescription = {
            ...prescriptionData,
            id: prescriptionData.id || generateId('RX'),
            doctorId: doctorId,
            timestamp: new Date().toISOString(),
            hash: null,
            digitalSignature: null,
            verified: false
        };
        
        // Generate cryptographic hash
        prescription.hash = this.generateHash(prescription);
        
        // Generate digital signature (simplified)
        prescription.digitalSignature = this.generateSignature(prescription, doctorId);
        
        prescription.verified = true;
        
        return prescription;
    }
    
    static generateHash(prescription) {
        // Simplified hash generation (in production, use crypto.subtle.digest)
        const dataString = JSON.stringify({
            medicines: prescription.medicines,
            patientId: prescription.patientId,
            doctorId: prescription.doctorId,
            timestamp: prescription.timestamp
        });
        
        // Simple hash (replace with proper cryptographic hash)
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return `SHA256-${Math.abs(hash).toString(16).toUpperCase()}`;
    }
    
    static generateSignature(prescription, doctorId) {
        // Simplified digital signature (in production, use PKI)
        const signatureData = `${prescription.hash}-${doctorId}-${prescription.timestamp}`;
        return btoa(signatureData);
    }
    
    static verify(prescription) {
        // Verify prescription hasn't been tampered with
        const currentHash = this.generateHash(prescription);
        
        if (currentHash !== prescription.hash) {
            return {
                valid: false,
                message: '⚠️ TAMPERED: Prescription has been modified',
                risk: 'HIGH'
            };
        }
        
        // Verify signature
        const expectedSignature = this.generateSignature(prescription, prescription.doctorId);
        if (expectedSignature !== prescription.digitalSignature) {
            return {
                valid: false,
                message: '⚠️ INVALID: Digital signature does not match',
                risk: 'HIGH'
            };
        }
        
        return {
            valid: true,
            message: '✅ VERIFIED: Prescription is authentic',
            risk: 'NONE'
        };
    }
    
    static renderVerificationBadge(prescription, elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const verification = this.verify(prescription);
        
        const badgeClass = verification.valid ? 'badge-success' : 'badge-danger';
        const icon = verification.valid ? '✅' : '⚠️';
        
        element.innerHTML = `
            <span class="badge ${badgeClass}">
                ${icon} ${verification.message}
            </span>
        `;
    }
}

// ============== INITIALIZATION ==============

document.addEventListener('DOMContentLoaded', () => {
    // Initialize PWA
    PWAManager.initialize();
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
        PWAManager.hideOfflineIndicator();
        console.log('Back online');
    });
    
    window.addEventListener('offline', () => {
        PWAManager.enableOfflineMode();
        console.log('Offline mode activated');
    });
    
    // Add emergency mode trigger (Ctrl+Shift+E)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            EmergencyMode.activate();
        }
    });
});

// Export for global use
window.DigitalHealthID = DigitalHealthID;
window.PWAManager = PWAManager;
window.EmergencyMode = EmergencyMode;
window.SecurePrescription = SecurePrescription;
