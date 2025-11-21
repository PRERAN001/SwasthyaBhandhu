/**
 * SwasthyaBhandhu - Configuration
 * Environment variables and API keys
 * 
 * IMPORTANT: Do not commit actual API keys to Git
 * Set these as environment variables in production
 */

const CONFIG = {
    // API Keys (will be loaded from environment or set manually)
    GROQ_API_KEY: '',
    ELEVENLABS_AGENT_ID: '',
    
    // API Endpoints
    GROQ_API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    
    // AI Model Configuration
    AI_MODEL: 'llama-3.3-70b-versatile',
    AI_TEMPERATURE: 0.7,
    AI_MAX_TOKENS: 2048,
    
    // Initialize from environment or prompt user
    init: function() {
        // For client-side apps, you can prompt user to enter keys
        // or load from a separate config file not committed to git
        
        // Check localStorage first (for demo/development)
        const storedGroqKey = localStorage.getItem('groq_api_key');
        const storedElevenLabsId = localStorage.getItem('elevenlabs_agent_id');
        
        if (storedGroqKey) {
            this.GROQ_API_KEY = storedGroqKey;
        }
        
        if (storedElevenLabsId) {
            this.ELEVENLABS_AGENT_ID = storedElevenLabsId;
        }
        
        return this;
    },
    
    // Set API key and save to localStorage
    setGroqApiKey: function(key) {
        this.GROQ_API_KEY = key;
        localStorage.setItem('groq_api_key', key);
    },
    
    setElevenLabsAgentId: function(agentId) {
        this.ELEVENLABS_AGENT_ID = agentId;
        localStorage.setItem('elevenlabs_agent_id', agentId);
    },
    
    // Get ElevenLabs URL
    getElevenLabsUrl: function() {
        let agentId = this.ELEVENLABS_AGENT_ID || 'agent_8301kagt7x3mfx7t515njgbvzrx7';
        
        // If full URL was provided, extract agent ID
        if (agentId.includes('elevenlabs.io')) {
            const match = agentId.match(/agent_id=([^&]+)/);
            if (match) {
                agentId = match[1];
            }
        }
        
        return `https://elevenlabs.io/app/talk-to?agent_id=${agentId}`;
    }
};

// Initialize on load
CONFIG.init();

// Export for use in other files
window.CONFIG = CONFIG;
