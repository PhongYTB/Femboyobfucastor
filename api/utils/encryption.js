const crypto = require('crypto');

class StringObfuscator {
    static encryptStrings(code) {
        // Find all strings in code
        const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
        
        return code.replace(stringRegex, (match) => {
            // Convert string to hex with random encoding
            const hex = Buffer.from(match.slice(1, -1)).toString('hex');
            const randomKey = crypto.randomBytes(4).toString('hex');
            
            // Create encoded string
            return `(function() local k="${randomKey}"; return string.char(` +
                   hex.split('').map((c, i) => 
                       `0x${(c.charCodeAt(0) ^ randomKey.charCodeAt(i % randomKey.length)).toString(16)}`
                   ).join(',') +
                   `) end)()`;
        });
    }
    
    static encryptAdvanced(code, key) {
        // AES-256 encryption for sensitive strings
        const cipher = crypto.createCipheriv('aes-256-gcm', 
            Buffer.from(key, 'hex').slice(0, 32),
            crypto.randomBytes(16)
        );
        
        let encrypted = cipher.update(code, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encrypted,
            iv: cipher.getAuthTag().toString('hex'),
            tag: cipher.getAuthTag().toString('hex')
        };
    }
}

class ControlFlowFlattener {
    static flatten(code) {
        // Split code into basic blocks
        const lines = code.split('\n');
        const blocks = [];
        let currentBlock = [];
        
        for (const line of lines) {
            if (line.trim().endsWith(' then') || 
                line.trim().startsWith('else') ||
                line.trim().startsWith('end') ||
                line.trim().startsWith('function')) {
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock);
                    currentBlock = [];
                }
            }
            currentBlock.push(line);
        }
        if (currentBlock.length > 0) blocks.push(currentBlock);
        
        // Create state machine
        let flattened = 'local state = 1\n';
        flattened += 'while true do\n';
        flattened += '    if state == 0 then break end\n';
        
        for (let i = 0; i < blocks.length; i++) {
            flattened += `    if state == ${i + 1} then\n`;
            flattened += '        ' + blocks[i].join('\n        ') + '\n';
            
            // Add opaque predicates
            const nextState = i < blocks.length - 1 ? i + 2 : 0;
            const randomCond = crypto.randomBytes(4).readUInt32LE() % 100;
            
            flattened += `        if ${randomCond} + ${100 - randomCond} == 100 then\n`;
            flattened += `            state = ${nextState}\n`;
            flattened += '        else\n';
            flattened += `            state = ${nextState}\n`; // Same state, but obfuscated
            flattened += '        end\n';
            flattened += '    end\n';
        }
        
        flattened += 'end\n';
        return flattened;
    }
}

class BinarySteganography {
    static apply(code, options = {}) {
        if (options.encodeAsBinary) {
            // Convert to binary representation
            const binaryLines = [];
            const lines = code.split('\n');
            
            for (const line of lines) {
                if (line.trim().startsWith('--')) {
                    binaryLines.push(line); // Keep comments
                } else {
                    // Convert line to binary with noise
                    const binary = this.lineToBinary(line, options.addNoise);
                    binaryLines.push(binary);
                }
            }
            
            return binaryLines.join('\n');
        }
        return code;
    }
    
    static lineToBinary(line, addNoise = true) {
        let binary = '';
        for (let i = 0; i < line.length; i++) {
            const charCode = line.charCodeAt(i);
            let binaryChar = charCode.toString(2).padStart(8, '0');
            
            if (addNoise && Math.random() > 0.7) {
                // Add random binary noise
                const noisePos = Math.floor(Math.random() * 8);
                const bitArray = binaryChar.split('');
                bitArray[noisePos] = bitArray[noisePos] === '0' ? '1' : '0';
                binaryChar = bitArray.join('');
            }
            
            binary += binaryChar + ' ';
        }
        
        // Wrap in comment that looks like binary data
        return `--[[BINARY:${binary.trim()}]] -- ${line}`;
    }
    
    static createBinaryLayer(code) {
        // Create layer that looks like pure binary
        const binaryOutput = [];
        
        // Add binary header
        binaryOutput.push('--[[0100100001000101010011000100110001001111]]');
        binaryOutput.push('--[[0110010001100101011000010110010000100000]]');
        binaryOutput.push('--[[0110001001111001010011010100000101010010]]');
        
        // Encode actual code in binary comments
        const chunks = this.chunkString(code, 40);
        chunks.forEach(chunk => {
            let binaryChunk = '';
            for (let i = 0; i < chunk.length; i++) {
                binaryChunk += chunk.charCodeAt(i).toString(2).padStart(8, '0');
            }
            binaryOutput.push(`--[[${binaryChunk}]]`);
        });
        
        return binaryOutput.join('\n');
    }
    
    static chunkString(str, size) {
        const chunks = [];
        for (let i = 0; i < str.length; i += size) {
            chunks.push(str.substring(i, i + size));
        }
        return chunks;
    }
}

class ConstantEncryptor {
    static encryptConstants(code) {
        // Replace numbers with obfuscated expressions
        return code.replace(/\b\d+\b/g, (match) => {
            const num = parseInt(match);
            
            // Generate random mathematical expression that equals the number
            const a = Math.floor(Math.random() * 1000);
            const b = num - a;
            const c = Math.floor(Math.random() * 100);
            const d = Math.floor(Math.random() * 100);
            
            const expressions = [
                `${a} + ${b}`,
                `${a + b + c} - ${c}`,
                `(${a} * ${Math.floor(num/a)}) + ${num % a}`,
                `bit32.bxor(${num ^ 255}, 255)`,
                `string.len(string.rep("X", ${num}))`
            ];
            
            return expressions[Math.floor(Math.random() * expressions.length)];
        });
    }
}

class VariableRenamer {
    static renameVariables(code) {
        const variables = new Set();
        
        // Find all variable names (simplified regex)
        const varRegex = /\b(local\s+|\b)([a-zA-Z_][a-zA-Z0-9_]*)\b(?=\s*[=,])/g;
        
        // First pass: collect variables
        let match;
        while ((match = varRegex.exec(code)) !== null) {
            if (match[2] && !['function', 'if', 'then', 'else', 'end', 'for', 'while', 'do', 'return'].includes(match[2])) {
                variables.add(match[2]);
            }
        }
        
        // Generate confusing names
        const confusingNames = [
            'o0O0', 'O0o0', 'l1I1', 'I1l1', 'vVv', 'VvV',
            'xyz', 'abc', 'tmp', 'var', 'val', 'obj',
            'a1', 'b2', 'c3', 'd4', 'e5', 'f6'
        ];
        
        const nameMap = new Map();
        Array.from(variables).forEach((varName, i) => {
            const newName = confusingNames[i % confusingNames.length] + 
                           Math.floor(Math.random() * 1000);
            nameMap.set(varName, newName);
        });
        
        // Replace variable names
        let renamed = code;
        nameMap.forEach((newName, oldName) => {
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            renamed = renamed.replace(regex, newName);
        });
        
        return renamed;
    }
}

module.exports = {
    StringObfuscator,
    ControlFlowFlattener,
    BinarySteganography,
    ConstantEncryptor,
    VariableRenamer
};
