// Advanced Device Fingerprinting
class DeviceFingerprint {
    constructor() {
        this.fingerprint = {};
        this.components = {};
    }
    
    async generate() {
        console.log('🆔 Generating device fingerprint...');
        
        try {
            // Collect all fingerprint components
            await this.collectAllComponents();
            
            // Generate unique fingerprint
            this.fingerprint = this.createFingerprint();
            
            console.log('✅ Device fingerprint generated:', this.fingerprint);
            return this.fingerprint;
            
        } catch (error) {
            console.error('Fingerprint generation failed:', error);
            return this.getBasicFingerprint();
        }
    }
    
    async collectAllComponents() {
        // Basic browser info
        this.components.browser = this.getBrowserInfo();
        
        // Screen info
        this.components.screen = this.getScreenInfo();
        
        // Timezone
        this.components.timezone = this.getTimezoneInfo();
        
        // Languages
        this.components.languages = this.getLanguageInfo();
        
        // Hardware
        this.components.hardware = await this.getHardwareInfo();
        
        // WebGL
        this.components.webgl = this.getWebGLInfo();
        
        // Canvas
        this.components.canvas = this.getCanvasFingerprint();
        
        // Audio
        this.components.audio = await this.getAudioFingerprint();
        
        // Fonts
        this.components.fonts = await this.getFontList();
        
        // Plugins
        this.components.plugins = this.getPluginInfo();
        
        // Storage
        this.components.storage = await this.getStorageInfo();
        
        // Connection
        this.components.connection = this.getConnectionInfo();
        
        // Battery
        this.components.battery = await this.getBatteryInfo();
        
        // Media Devices
        this.components.mediaDevices = await this.getMediaDevices();
        
        // Performance
        this.components.performance = this.getPerformanceInfo();
    }
    
    getBrowserInfo() {
        const ua = navigator.userAgent;
        
        return {
            userAgent: ua,
            appVersion: navigator.appVersion,
            platform: navigator.platform,
            vendor: navigator.vendor,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            pdfViewerEnabled: navigator.pdfViewerEnabled || false,
            webdriver: navigator.webdriver || false,
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            deviceMemory: navigator.deviceMemory || 0,
            userAgentData: navigator.userAgentData || null
        };
    }
    
    getScreenInfo() {
        return {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            orientation: screen.orientation?.type || 'unknown',
            orientationAngle: screen.orientation?.angle || 0
        };
    }
    
    getTimezoneInfo() {
        return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
            calendar: Intl.DateTimeFormat().resolvedOptions().calendar,
            numberingSystem: Intl.DateTimeFormat().resolvedOptions().numberingSystem
        };
    }
    
    getLanguageInfo() {
        return {
            language: navigator.language,
            languages: navigator.languages,
            acceptLanguage: navigator.language || 'unknown'
        };
    }
    
    async getHardwareInfo() {
        const info = {
            cores: navigator.hardwareConcurrency || 0,
            memory: navigator.deviceMemory || 0,
            architecture: this.getArchitecture()
        };
        
        // Try to get more hardware info
        try {
            if (navigator.getBattery) {
                const battery = await navigator.getBattery();
                info.battery = {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            }
        } catch (e) { /* Ignore */ }
        
        return info;
    }
    
    getArchitecture() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('win64') || ua.includes('wow64')) return 'x64';
        if (ua.includes('win32')) return 'x86';
        if (ua.includes('arm')) return 'arm';
        if (ua.includes('x86_64') || ua.includes('x64')) return 'x64';
        if (ua.includes('x86')) return 'x86';
        return 'unknown';
    }
    
    getWebGLInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return { supported: false };
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        
        return {
            supported: true,
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            extensions: gl.getSupportedExtensions()
        };
    }
    
    getCanvasFingerprint() {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return { supported: false };
        
        // Draw text
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f00';
        ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = '#fff';
        ctx.fillText('Fingerprint', 2, 2);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, 200, 50).data;
        
        // Create hash from image data
        let hash = 0;
        for (let i = 0; i < imageData.length; i++) {
            hash = ((hash << 5) - hash) + imageData[i];
            hash = hash & hash;
        }
        
        return {
            supported: true,
            hash: Math.abs(hash).toString(36),
            winding: ctx.canvas.winding || 'unknown',
            textMetrics: ctx.measureText('Fingerprint').width
        };
    }
    
    async getAudioFingerprint() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            
            oscillator.connect(analyser);
            analyser.connect(audioContext.destination);
            
            oscillator.start();
            
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            
            oscillator.stop();
            audioContext.close();
            
            // Create hash from audio data
            let hash = 0;
            for (let i = 0; i < dataArray.length; i++) {
                hash = ((hash << 5) - hash) + dataArray[i];
                hash = hash & hash;
            }
            
            return {
                supported: true,
                hash: Math.abs(hash).toString(36),
                sampleRate: audioContext.sampleRate
            };
            
        } catch (error) {
            return { supported: false, error: error.message };
        }
    }
    
    async getFontList() {
        const baseFonts = [
            'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
            'Georgia', 'Impact', 'Times New Roman', 'Trebuchet MS',
            'Verdana', 'Helvetica', 'Tahoma', 'Lucida Console',
            'Microsoft Sans Serif', 'Palatino Linotype', 'Garamond',
            'Bookman', 'Avant Garde', 'Geneva', 'Monaco', 'Andale Mono'
        ];
        
        const availableFonts = [];
        
        // Test each font
        for (const font of baseFonts) {
            if (await this.isFontAvailable(font)) {
                availableFonts.push(font);
            }
        }
        
        return {
            total: availableFonts.length,
            fonts: availableFonts,
            hash: this.hashString(availableFonts.join(','))
        };
    }
    
    async isFontAvailable(font) {
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
    
    getPluginInfo() {
        const plugins = [];
        
        if (navigator.plugins) {
            for (let i = 0; i < navigator.plugins.length; i++) {
                const plugin = navigator.plugins[i];
                plugins.push({
                    name: plugin.name,
                    filename: plugin.filename,
                    description: plugin.description,
                    version: plugin.version
                });
            }
        }
        
        const mimeTypes = [];
        if (navigator.mimeTypes) {
            for (let i = 0; i < navigator.mimeTypes.length; i++) {
                const mimeType = navigator.mimeTypes[i];
                mimeTypes.push({
                    type: mimeType.type,
                    description: mimeType.description,
                    suffixes: mimeType.suffixes
                });
            }
        }
        
        return {
            plugins: plugins,
            mimeTypes: mimeTypes,
            pluginCount: plugins.length,
            mimeTypeCount: mimeTypes.length
        };
    }
    
    async getStorageInfo() {
        const info = {
            localStorage: 'localStorage' in window,
            sessionStorage: 'sessionStorage' in window,
            indexedDB: 'indexedDB' in window,
            webSQL: 'openDatabase' in window,
            cookies: navigator.cookieEnabled
        };
        
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                info.quota = estimate.quota;
                info.usage = estimate.usage;
                info.usageDetails = estimate.usageDetails;
            }
        } catch (e) { /* Ignore */ }
        
        return info;
    }
    
    getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (!connection) return { supported: false };
        
        return {
            supported: true,
            type: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
            downlinkMax: connection.downlinkMax
        };
    }
    
    async getBatteryInfo() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                return {
                    supported: true,
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            }
        } catch (e) { /* Ignore */ }
        
        return { supported: false };
    }
    
    async getMediaDevices() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                const devices = await navigator.mediaDevices.enumerateDevices();
                
                return {
                    supported: true,
                    devices: devices.map(device => ({
                        kind: device.kind,
                        label: device.label || 'unknown',
                        deviceId: device.deviceId.substring(0, 10) + '...'
                    })),
                    deviceCount: devices.length
                };
            }
        } catch (e) { /* Ignore */ }
        
        return { supported: false };
    }
    
    getPerformanceInfo() {
        const perf = performance || window.performance;
        
        if (!perf) return { supported: false };
        
        return {
            supported: true,
            timing: perf.timing ? {
                navigationStart: perf.timing.navigationStart,
                loadEventEnd: perf.timing.loadEventEnd,
                domComplete: perf.timing.domComplete,
                domInteractive: perf.timing.domInteractive
            } : null,
            memory: perf.memory ? {
                totalJSHeapSize: perf.memory.totalJSHeapSize,
                usedJSHeapSize: perf.memory.usedJSHeapSize,
                jsHeapSizeLimit: perf.memory.jsHeapSizeLimit
            } : null,
            navigation: perf.navigation ? {
                type: perf.navigation.type,
                redirectCount: perf.navigation.redirectCount
            } : null
        };
    }
    
    createFingerprint() {
        // Create a unique fingerprint from all components
        const fingerprintData = JSON.stringify(this.components);
        const hash = this.hashString(fingerprintData);
        
        return {
            id: hash,
            components: this.components,
            timestamp: new Date().toISOString(),
            userAgentHash: this.hashString(navigator.userAgent),
            screenHash: this.hashString(`${screen.width}x${screen.height}x${screen.colorDepth}`),
            languageHash: this.hashString(navigator.language),
            timezoneHash: this.hashString(Intl.DateTimeFormat().resolvedOptions().timeZone),
            canvasHash: this.components.canvas.hash,
            webglHash: this.hashString(JSON.stringify(this.components.webgl)),
            fontHash: this.components.fonts.hash
        };
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    
    getBasicFingerprint() {
        const basicData = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            timestamp: new Date().toISOString()
        };
        
        return {
            id: this.hashString(JSON.stringify(basicData)),
            basic: basicData,
            full: false
        };
    }
    
    async getFingerprint() {
        return this.fingerprint.id || await this.generate();
    }
    
    getFingerprintString() {
        return JSON.stringify(this.fingerprint, null, 2);
    }
    
    getFingerprintSummary() {
        return {
            id: this.fingerprint.id,
            timestamp: this.fingerprint.timestamp,
            components: Object.keys(this.components).length,
            userAgent: this.components.browser?.userAgent?.substring(0, 50) + '...'
        };
    }
}

// Create global instance
window.deviceFingerprint = new DeviceFingerprint();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceFingerprint;
}
