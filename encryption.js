// Advanced Data Encryption
class DataEncryption {
    constructor() {
        this.key = CONFIG.BACKUP.ENCRYPTION_KEY || 'auto_backup_default_key';
        this.method = CONFIG.BACKUP.ENCRYPTION_METHOD || 'xor';
    }
    
    async encrypt(data) {
        console.log('🔐 Encrypting data...');
        
        try {
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            
            let encrypted;
            switch (this.method) {
                case 'aes':
                    encrypted = await this.encryptAES(dataStr);
                    break;
                case 'xor':
                default:
                    encrypted = this.encryptXOR(dataStr);
                    break;
            }
            
            return {
                encrypted: encrypted,
                method: this.method,
                keyHash: this.hashString(this.key),
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Encryption failed:', error);
            return this.encryptSimple(data);
        }
    }
    
    async decrypt(encryptedData) {
        try {
            if (!encryptedData.encrypted) {
                return encryptedData;
            }
            
            let decrypted;
            switch (encryptedData.method) {
                case 'aes':
                    decrypted = await this.decryptAES(encryptedData.encrypted);
                    break;
                case 'xor':
                default:
                    decrypted = this.decryptXOR(encryptedData.encrypted);
                    break;
            }
            
            // Try to parse as JSON
            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
            
        } catch (error) {
            console.error('Decryption failed:', error);
            return encryptedData;
        }
    }
    
    encryptXOR(str) {
        let encrypted = '';
        for (let i = 0; i < str.length; i++) {
            encrypted += String.fromCharCode(str.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
        }
        return btoa(encrypted);
    }
    
    decryptXOR(encryptedStr) {
        const encrypted = atob(encryptedStr);
        let decrypted = '';
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length));
        }
        return decrypted;
    }
    
    async encryptAES(str) {
        try {
            // Generate a random key
            const key = await crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256,
                },
                true,
                ["encrypt", "decrypt"]
            );
            
            // Generate IV
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv
                },
                key,
                new TextEncoder().encode(str)
            );
            
            // Export key
            const exportedKey = await crypto.subtle.exportKey("raw", key);
            
            return {
                encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
                iv: btoa(String.fromCharCode(...iv)),
                key: btoa(String.fromCharCode(...new Uint8Array(exportedKey)))
            };
            
        } catch (error) {
            console.warn('AES encryption failed, falling back to XOR:', error);
            return this.encryptXOR(str);
        }
    }
    
    async decryptAES(encryptedData) {
        try {
            // Import key
            const key = await crypto.subtle.importKey(
                "raw",
                new Uint8Array([...atob(encryptedData.key)].map(c => c.charCodeAt(0))),
                { name: "AES-GCM" },
                false,
                ["decrypt"]
            );
            
            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: new Uint8Array([...atob(encryptedData.iv)].map(c => c.charCodeAt(0)))
                },
                key,
                new Uint8Array([...atob(encryptedData.encrypted)].map(c => c.charCodeAt(0)))
            );
            
            return new TextDecoder().decode(decrypted);
            
        } catch (error) {
            console.error('AES decryption failed:', error);
            throw error;
        }
    }
    
    encryptSimple(data) {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        return btoa(encodeURIComponent(dataStr));
    }
    
    decryptSimple(encrypted) {
        try {
            return decodeURIComponent(atob(encrypted));
        } catch {
            return encrypted;
        }
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
    
    generateRandomKey(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < length; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
    
    maskSensitiveData(data, fields = ['password', 'token', 'secret', 'key']) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }
        
        if (Array.isArray(data)) {
            return data.map(item => this.maskSensitiveData(item, fields));
        }
        
        const masked = { ...data };
        
        for (const [key, value] of Object.entries(masked)) {
            const keyLower = key.toLowerCase();
            
            // Check if this field should be masked
            if (fields.some(field => keyLower.includes(field))) {
                if (typeof value === 'string' && value.length > 0) {
                    masked[key] = '•'.repeat(Math.min(value.length, 8));
                } else if (typeof value === 'object' && value !== null) {
                    masked[key] = this.maskSensitiveData(value, fields);
                }
            } else if (typeof value === 'object' && value !== null) {
                masked[key] = this.maskSensitiveData(value, fields);
            }
        }
        
        return masked;
    }
    
    compressData(data) {
        if (!CONFIG.BACKUP.COMPRESS_DATA) {
            return data;
        }
        
        try {
            const dataStr = JSON.stringify(data);
            
            // Simple compression for demo
            // In production, use proper compression libraries
            let compressed = '';
            let count = 1;
            
            for (let i = 0; i < dataStr.length; i++) {
                if (dataStr[i] === dataStr[i + 1]) {
                    count++;
                } else {
                    if (count > 3) {
                        compressed += count + dataStr[i];
                    } else {
                        compressed += dataStr[i].repeat(count);
                    }
                    count = 1;
                }
            }
            
            return {
                compressed: compressed,
                originalSize: dataStr.length,
                compressedSize: compressed.length,
                ratio: ((compressed.length / dataStr.length) * 100).toFixed(1) + '%'
            };
            
        } catch (error) {
            console.warn('Compression failed:', error);
            return data;
        }
    }
    
    decompressData(compressedData) {
        if (!compressedData.compressed) {
            return compressedData;
        }
        
        try {
            let decompressed = '';
            let i = 0;
            
            while (i < compressedData.compressed.length) {
                let count = '';
                
                // Read count
                while (i < compressedData.compressed.length && !isNaN(compressedData.compressed[i])) {
                    count += compressedData.compressed[i];
                    i++;
                }
                
                if (count) {
                    const char = compressedData.compressed[i];
                    decompressed += char.repeat(parseInt(count));
                    i++;
                } else {
                    decompressed += compressedData.compressed[i];
                    i++;
                }
            }
            
            return JSON.parse(decompressed);
            
        } catch (error) {
            console.error('Decompression failed:', error);
            return compressedData;
        }
    }
    
    createChecksum(data) {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        let checksum = 0;
        
        for (let i = 0; i < dataStr.length; i++) {
            checksum = (checksum + dataStr.charCodeAt(i)) % 256;
        }
        
        return checksum.toString(16).padStart(2, '0');
    }
    
    verifyChecksum(data, expectedChecksum) {
        const actualChecksum = this.createChecksum(data);
        return actualChecksum === expectedChecksum;
    }
}

// Create global instance
window.dataEncryption = new DataEncryption();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataEncryption;
}
