// utils/encryption.js - Simple and fast
class StringObfuscator {
    static encrypt(code) {
        // Simple XOR encryption for speed
        const lines = code.split('\n');
        const result = [];
        
        for (const line of lines) {
            if (line.trim().startsWith('--')) {
                result.push(line);
                continue;
            }
            
            // Find strings in line
            let newLine = line;
            const stringRegex = /(["'])(?:\\.|(?!\1).)*\1/g;
            let match;
            
            while ((match = stringRegex.exec(line)) !== null) {
                const str = match[0];
                const encrypted = this.xorEncrypt(str);
                newLine = newLine.replace(str, encrypted);
            }
            
            result.push(newLine);
        }
        
        return result.join('\n');
    }
    
    static xorEncrypt(str) {
        const key = Math.floor(Math.random() * 255) + 1;
        const inner = str.slice(1, -1);
        let encrypted = '';
        
        for (let i = 0; i < inner.length; i++) {
            encrypted += String.fromCharCode(inner.charCodeAt(i) ^ key);
        }
        
        return `loadstring((function(k)return(string.char(${Array.from({length: encrypted.length}, (_, i) => 
            `${encrypted.charCodeAt(i)}~k`).join(',')}))end)(${key}))()`;
    }
}

module.exports = { StringObfuscator };
