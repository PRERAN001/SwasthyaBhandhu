# SwasthyaBhandhu - Quick Start Guide

## 🚀 Getting Started

### 1. Open the Application
Simply open `index.html` in your web browser (Chrome, Firefox, Edge, or Safari).

### 2. Login with Demo Credentials

Click on any of the demo credential cards on the login page:

**Patient Account:**
- Email: `patient@test.com`
- Password: `patient123`

**Doctor Account:**
- Email: `doctor@test.com`
- Password: `doctor123`

**Pharmacist Account:**
- Email: `pharmacist@test.com`
- Password: `pharma123`

**Admin Account:**
- Email: `admin@test.com`
- Password: `admin123`

### 3. Set Up API Keys (Optional but Recommended)

For AI features to work, you need to configure your Groq API key:

1. Visit `setup-keys.html` in your browser
2. Enter your Groq API key (get one free at https://console.groq.com)
3. Optionally customize the ElevenLabs agent ID
4. Click "Save Configuration"

## 🎯 Key Features to Test

### As a Patient:

1. **AI Health Assistant (Voice Agent)**
   - Go to "AI Health Assistant" tab
   - Click "🎙️ Start AI Conversation" button
   - This opens ElevenLabs in a new window
   - Have a voice conversation about your health
   - Return to the app and enter a summary in the text area
   - Click "📋 Generate Health Report" to get an AI-generated report

2. **Symptom Checker**
   - Go to "Symptom Checker" tab
   - Describe your symptoms
   - Get AI-powered analysis and recommendations

3. **Schedule Appointment**
   - Go to "Appointments" tab
   - Click "Schedule New"
   - Fill in the form and submit

4. **View Prescriptions**
   - Go to "E-Prescriptions" tab
   - Click "🛡️ Safety Check" on any prescription
   - Get AI-powered drug interaction analysis

5. **Submit Feedback**
   - Go to "Feedback" tab
   - Rate your experience and submit comments

### As a Doctor:

1. **Video Consultation**
   - Go to "Consultation" tab
   - Click "Start Consultation"
   - Use voice recording for notes
   - End call and save notes

2. **Manage Appointments**
   - View upcoming appointments
   - Add new appointments
   - Update appointment status

3. **View Patient Records**
   - Browse patient information
   - View medical history

### As a Pharmacist:

1. **Manage Inventory**
   - Add new medicines
   - Update stock levels
   - Track expiry dates

2. **Process Prescriptions**
   - View patient prescriptions
   - Create orders

3. **View Analytics**
   - Check low stock items
   - Monitor expiring medicines

### As an Admin:

1. **User Management**
   - View all users
   - Add new users
   - Manage user roles

2. **System Analytics**
   - View platform statistics
   - Monitor system health

## 🎤 About the Voice Agent

The ElevenLabs voice agent integration works as follows:

1. **Why External Link?**
   - ElevenLabs doesn't allow iframe embedding for security reasons
   - Opening in a new window provides the best user experience
   - Users can have natural voice conversations

2. **How to Use:**
   - Click the "Start AI Conversation" button
   - A new window opens with the ElevenLabs voice interface
   - Grant microphone permissions when prompted
   - Have your conversation about health concerns
   - Return to the app and summarize the conversation
   - Generate a comprehensive health report

3. **Benefits:**
   - Natural voice interaction
   - No typing required
   - Accessible for all users
   - Professional AI health assistant

## 🔧 Troubleshooting

### AI Features Not Working?
- Make sure you've set up your Groq API key in `setup-keys.html`
- Check browser console for any error messages
- Verify your API key is valid

### Voice Agent Not Opening?
- Check if pop-ups are blocked in your browser
- Allow pop-ups for this site
- Try clicking the button again

### Video Consultation Issues?
- Grant camera and microphone permissions when prompted
- Check if another app is using your camera
- Try refreshing the page

### Data Not Saving?
- This app uses localStorage (browser storage)
- Data is saved locally on your device
- Clearing browser data will reset everything

## 📱 Install as PWA

You can install SwasthyaBhandhu as a Progressive Web App:

1. Look for the "📥 Install App" button
2. Click it and follow the prompts
3. The app will be installed on your device
4. Access it like a native app

## 🌐 Browser Recommendations

- **Best Experience:** Chrome or Edge (latest version)
- **Also Works:** Firefox, Safari
- **Mobile:** Works on all modern mobile browsers

## 💡 Tips

1. **Demo Data:** The app comes with sample data for testing
2. **Multiple Tabs:** You can open multiple user types in different browser tabs
3. **Offline Mode:** Once installed as PWA, basic features work offline
4. **Mobile Friendly:** Fully responsive design works on phones and tablets

## 🆘 Need Help?

- Check `TEST-RESULTS.md` for detailed feature verification
- Review `IMPLEMENTATION-SUMMARY.txt` for technical details
- All features have been tested and verified to work correctly

## ✨ Enjoy Using SwasthyaBhandhu!

All features are working perfectly. The voice agent solution using an external link is the optimal approach given ElevenLabs' security policies. Have a great experience exploring the platform!
