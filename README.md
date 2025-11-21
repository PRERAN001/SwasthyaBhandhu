# SwasthyaBhandhu - Healthcare Management Platform

## 📋 Project Overview

SwasthyaBhandhu is a **comprehensive, AI-powered healthcare management platform** built with vanilla HTML, CSS, and JavaScript. This production-ready MVP provides a polished, professional interface for four user roles with advanced AI features, offline support, and emergency capabilities.

**🌍 Multilingual Support:** Every page includes Google Translate integration
**🤖 AI-Powered:** Groq AI integration for intelligent health analysis
**📱 PWA:** Installable as a mobile/desktop app with offline mode
**🚨 Emergency Ready:** Instant emergency mode with health ID
**🛡️ Secure:** Tamper-proof e-prescriptions with digital signatures

---

## ✨ Features by Role

### 🩺 Doctor Dashboard
- **Profile Management:** Update personal and professional information
- **Appointments:** View, schedule, and manage patient appointments
- **Live Consultation:** Start video consultations with patients
- **🎤 AI Voice Notes:** Record voice and auto-generate structured medical summaries
- **Patient Records:** Access and search patient information
- **Consultation History:** View past video consultation recordings
- **Messaging:** Secure communication with patients
- **Analytics:** Track consultations, appointments, and patient metrics

### 🧑‍⚕️ Patient Dashboard
- **Profile Management:** Manage personal and medical information
- **🤖 AI Health Assistant:** Talk to ElevenLabs AI + generate health reports with Groq
- **🧠 AI Symptom Checker:** Advanced symptom analysis with condition predictions
- **🛡️ Prescription Safety:** AI-powered drug interaction and allergy checker
- **Appointment Scheduling:** Book appointments with doctors
- **E-Prescriptions:** View, download, and verify prescriptions
- **Consultation History:** Access past video consultation recordings
- **Feedback & Reports:** Submit feedback and ratings
- **Document Uploads:** Upload and manage medical documents
- **🆔 Digital Health ID:** Generate QR-coded health ID for emergencies
- **Secure Messaging:** Communicate with doctors
- **Health Analytics:** Track appointments and health trends

### 💊 Pharmacist Dashboard
- **Profile Management:** Update pharmacist credentials
- **Medicine Inventory:** Full CRUD operations with expiry tracking
- **Prescriptions:** View and fulfill patient prescriptions with verification
- **Orders:** Create and manage medicine orders
- **Feedback:** View customer reviews
- **Analytics:** Track inventory, low stock, and expiring medicines

### ⚙️ Admin Dashboard
- **Profile Management:** Admin account settings
- **User Management:** Edit, activate/deactivate users, role management
- **📈 Advanced Analytics:** User growth charts and platform metrics
- **🧠 Sentiment Analysis:** AI-powered feedback sentiment classification
- **Activity Log:** Monitor system activity
- **Statistics:** Platform-wide metrics and analytics
- **Feedback Management:** View and analyze user feedback with AI insights

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- (Optional) A local web server for optimal performance

### Installation & Running

#### Option 1: Direct File Opening
1. Clone or download this repository
2. Navigate to the project folder
3. Open `index.html` in your web browser

#### Option 2: Using a Local Server (Recommended)

**Using Python:**
```bash
# Python 3
cd path/to/newwwww
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

**Using Node.js (http-server):**
```bash
# Install http-server globally
npm install -g http-server

# Run from project directory
cd path/to/newwwww
http-server -p 8000

# Then open http://localhost:8000 in your browser
```

**Using VS Code Live Server Extension:**
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

---

## 🔑 Demo Credentials

Use these credentials to login and explore different roles:

| Role | Email | Password |
|------|-------|----------|
| **Doctor** | doctor@test.com | doctor123 |
| **Patient** | patient@test.com | patient123 |
| **Pharmacist** | pharmacist@test.com | pharma123 |
| **Admin** | admin@test.com | admin123 |

*Additional demo accounts are available for each role - check the login page for quick-select demo credentials.*

---

## 📹 Video Consultation Feature

### Implementation Details

The video consultation feature is implemented in `assets/video-consultation.js` and supports two modes:

#### 1. **Simulation Mode (Default)**
- Uses your local webcam for the local video feed
- Displays a simulated remote video (placeholder or video file)
- Perfect for demo purposes without requiring signaling server
- Shows all consultation controls (mute, camera toggle, end call)

#### 2. **WebRTC Mode (Optional)**
- Real peer-to-peer video calling capability
- Requires a signaling server for connection establishment
- Uses STUN servers for NAT traversal
- Falls back to simulation mode if camera access is denied

### Where Video Consultation is Used

1. **Doctor Dashboard → Consultation Tab:**
   - Start live video consultations
   - Toggle microphone and camera
   - Save consultation notes

2. **Doctor Dashboard → Consultation History Tab:**
   - View past consultation recordings
   - Play recorded sessions

3. **Patient Dashboard → Consultation History Tab:**
   - Access past video consultations
   - View consultation recordings

### Video File Integration

The provided video file should be placed at:
```
assets/sample-consultation.mp4
```

This video is used for:
- Simulated remote participant video during live calls
- Playback of recorded consultations in history

**Note:** If the video file is not found, a professional placeholder with icons will be displayed instead.

### Setting Up WebRTC Mode (Advanced)

To enable real WebRTC video calls, you would need to:

1. Set up a signaling server (Socket.io example):
```javascript
// Simple Node.js signaling server (signaling-server.js)
const io = require('socket.io')(3000, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    socket.on('message', (data) => {
        socket.broadcast.emit('message', data);
    });
});
```

2. Run the signaling server:
```bash
npm install socket.io
node signaling-server.js
```

3. Update the video consultation initialization in doctor.js:
```javascript
videoConsultation = new VideoConsultation({ 
    mode: 'webrtc',
    signalingServer: io('http://localhost:3000')
});
```

---

## 📁 Project Structure

```
newwwww/
├── index.html              # Authentication/Login page
├── auth.css               # Authentication page styles
├── auth.js                # Authentication logic
├── doctor.html            # Doctor dashboard
├── doctor.css             # Doctor dashboard styles
├── doctor.js              # Doctor dashboard logic
├── patient.html           # Patient dashboard
├── patient.css            # Patient dashboard styles
├── patient.js             # Patient dashboard logic
├── pharmacist.html        # Pharmacist dashboard
├── pharmacist.css         # Pharmacist dashboard styles
├── pharmacist.js          # Pharmacist dashboard logic
├── admin.html             # Admin dashboard
├── admin.css              # Admin dashboard styles
├── admin.js               # Admin dashboard logic
├── assets/
│   ├── common.css         # Shared styles for all pages
│   ├── common.js          # Shared utilities and functions
│   ├── video-consultation.js  # Video consultation module
│   └── sample-consultation.mp4  # (Optional) Sample video file
└── README.md              # This file
```

---

## 🗄️ Data Management

### Static Data Storage

This application uses **localStorage** to simulate a backend database. All data is stored client-side in your browser.

**Storage Keys:**
- `swasthya_users` - User accounts
- `swasthya_current_user` - Currently logged-in user
- `swasthya_appointments` - Appointments data
- `swasthya_messages` - Messages
- `swasthya_prescriptions` - Prescriptions
- `swasthya_inventory` - Medicine inventory
- `swasthya_consultations` - Video consultation records
- `swasthya_feedbacks` - User feedback
- `swasthya_documents` - Uploaded documents metadata
- `swasthya_orders` - Pharmacy orders

### Default Data

The application initializes with sample data including:
- Demo accounts for all roles
- Sample medicine inventory
- Example appointments
- Demo prescriptions

### Resetting Data

To reset all data to defaults:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Clear localStorage for this site
4. Refresh the page

---

## 🌐 Google Translate Integration

Every page includes Google Translate functionality:

- **Location:** Top-right corner of the header
- **Supported Languages:** English, Hindi, Bengali, Telugu, Tamil, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu
- **Usage:** Select your preferred language from the dropdown

The translate widget is automatically initialized on page load via the `initializeGoogleTranslate()` function in `common.js`.

---

## 🎨 Design & Responsiveness

### Design Principles
- **Clean & Professional:** Simple, modern interface
- **Accessible:** Semantic HTML and ARIA attributes where appropriate
- **Responsive:** Mobile-friendly layout (works on phones, tablets, desktops)
- **Consistent:** Shared design system across all pages

### Color Scheme
- **Primary:** Blue (#2563eb)
- **Secondary:** Green (#10b981)
- **Danger:** Red (#ef4444)
- **Warning:** Orange (#f59e0b)

### Browser Compatibility
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ⚠️ Internet Explorer (not supported)

---

## 🔧 Making it Dynamic

This is a **static MVP** with simulated backend functionality. To make it production-ready:

### 1. Backend API Development
Replace localStorage calls with API endpoints:

```javascript
// Current (Static):
const users = JSON.parse(localStorage.getItem('swasthya_users'));

// Future (Dynamic):
const users = await fetch('/api/users').then(res => res.json());
```

### 2. Database Integration
- Replace localStorage with a proper database (PostgreSQL, MongoDB, etc.)
- Implement user authentication with JWT/sessions
- Store files in cloud storage (AWS S3, Google Cloud Storage)

### 3. Video Consultation
- Integrate professional video service (Twilio, Agora, Vonage)
- Or deploy your own WebRTC signaling server
- Implement recording and storage for consultations

### 4. Security Enhancements
- Add HTTPS/SSL
- Implement proper authentication and authorization
- Add CSRF protection
- Sanitize all user inputs
- Implement rate limiting

### 5. Additional Features
- Email notifications
- SMS alerts
- Payment processing
- Advanced analytics with charts
- File upload to server
- Real-time messaging (WebSocket)

---

## 📝 Code Quality & Testing

### Code Organization
- **Separation of Concerns:** Separate HTML, CSS, and JS files per page
- **Reusable Components:** Common styles and utilities shared across pages
- **Comments:** Code is well-commented explaining static vs dynamic parts

### Static vs Dynamic Markers

Throughout the code, you'll find comments like:
```javascript
// NOTE: This is STATIC implementation using localStorage.
// In production, replace with API calls to backend server.
```

These markers indicate where you need to integrate backend APIs.

### Future Testing

The code structure supports unit testing. Example test stubs:

```javascript
// tests/auth.test.js
describe('Authentication', () => {
    test('should login with valid credentials', () => {
        const result = login('doctor@test.com', 'doctor123');
        expect(result.success).toBe(true);
    });
});
```

---

## 🐛 Known Limitations

Since this is a static MVP:

1. **No Data Persistence Across Devices:** Data is stored in browser localStorage
2. **No Real Authentication:** Passwords are stored in plain text locally
3. **No Backend Validation:** All validation is client-side only
4. **Simulated Video Calls:** Video consultation uses simulation mode by default
5. **No Real File Uploads:** Documents are stored as metadata only
6. **No Email/SMS:** Notifications are in-app only

---

## 🤝 Contributing & Next Steps

### Immediate Next Steps
1. Replace localStorage with backend API
2. Implement proper authentication system
3. Set up database schema
4. Deploy video consultation server
5. Implement file upload to cloud storage

### Future Enhancements
- Mobile apps (React Native, Flutter)
- AI-powered symptom checker
- Telemedicine insurance integration
- Multi-language UI (not just translate)
- Advanced analytics dashboard
- Payment gateway integration

---

## 📞 Support

For questions or issues:
- Review the code comments for implementation details
- Check browser console for error messages
- Ensure localStorage is enabled in your browser
- Try resetting localStorage if data seems corrupted

---

## 📄 License

This is an MVP project for demonstration purposes.

---

## 🙏 Acknowledgments

- Google Translate API for multilingual support
- WebRTC for video consultation capabilities
- Modern web standards for responsive design

---

**Built with ❤️ for SwasthyaBhandhu**

*Last Updated: November 2025*
