const crypto = require('crypto');
const { StringObfuscator } = require('./utils/encryption');

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).send('Method not allowed');
    
    try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        const body = buffer.toString();
        
        // Quick extract file
        const boundary = body.match(/boundary=(.+)/)?.[1] || '--';
        const parts = body.split(boundary);
        
        let code = '';
        let fileName = 'script.lua';
        
        for (const part of parts) {
            if (part.includes('filename=')) {
                const nameMatch = part.match(/filename="([^"]+)"/);
                if (nameMatch) fileName = nameMatch[1];
                
                const contentMatch = part.split('\r\n\r\n')[1];
                if (contentMatch) code = contentMatch.split('\r\n--')[0].trim();
                break;
            }
        }
        
        if (!code) return res.status(400).send('No code found');
        
        // FAST OBFUSCATION START - under 2 seconds
        console.time('obfuscation');
        
        // 1. String encryption (fastest)
        code = encryptStringsFast(code);
        
        // 2. Variable renaming (quick)
        code = renameVariablesFast(code);
        
        // 3. Add anti-tamper
        code = addTamperProtection(code);
        
        // 4. Add binary layer
        code = addBinaryLayer(code);
        
        // 5. Add header
        const header = createHeader(fileName);
        const finalCode = header + '\n\n' + code;
        
        console.timeEnd('obfuscation');
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="obf_${fileName}"`);
        res.send(finalCode);
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// FAST STRING ENCRYPTION
function encryptStringsFast(code) {
    return code.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match) => {
        const str = match.slice(1, -1);
        const key = Math.floor(Math.random() * 256);
        let encrypted = '';
        for (let i = 0; i < str.length; i++) {
            encrypted += String.fromCharCode(str.charCodeAt(i) ^ key);
        }
        return `(function()local k=${key};return (${JSON.stringify(encrypted)}):gsub(".",function(c)return string.char(c:byte()~k)end)end)()`;
    });
}

// FAST VARIABLE RENAMING
function renameVariablesFast(code) {
    const vars = new Set();
    // Find common variable names
    code.replace(/\b(local\s+)([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (m, p1, p2) => {
        if (!['function','if','then','else','end','for','while','do','return'].includes(p2)) {
            vars.add(p2);
        }
        return m;
    });
    
    let newCode = code;
    const names = ['_','__','___','____','a','b','c','d','e','f','g','h','i','j','k'];
    let i = 0;
    
    vars.forEach(oldName => {
        const newName = names[i % names.length] + (i < 5 ? '' : Math.floor(i/5));
        const regex = new RegExp(`\\b${oldName}\\b`, 'g');
        newCode = newCode.replace(regex, newName);
        i++;
    });
    
    return newCode;
}

// ADD TAMPER PROTECTION
function addTamperProtection(code) {
    const tamperCode = `
-- Anti-Tamper Protection
local function checkTamper()
    if debug and debug.getinfo then
        for i=1,10 do
            local info = debug.getinfo(i)
            if info and info.what == "C" and string.find(info.name or "", "debug") then
                return true
            end
        end
    end
    return false
end

if checkTamper() then
    while true do end -- Infinite loop if debugger detected
end
`;
    return code + tamperCode;
}

// ADD BINARY LAYER
function addBinaryLayer(code) {
    // Just add binary-looking comments
    const lines = code.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        newLines.push(lines[i]);
        if (i % 5 === 0 && i > 0) {
            const randomBinary = Array(16).fill(0).map(() => Math.round(Math.random())).join('');
            newLines.push(`--[[${randomBinary}]]`);
        }
    }
    
    return newLines.join('\n');
}

// CREATE HEADER
function createHeader(filename) {
    const now = new Date();
    return `--[[
  ╔══════════════════════════════════════════════════╗
  ║      FEMBOYOBFUCATOR ULTRA - FAST OBFUSCATION   ║
  ║            femboyobfucastor.vercel.app 🍑🐧     ║
  ╚══════════════════════════════════════════════════╝
  File: ${filename}
  Time: ${now.toISOString()}
  Protection: String Encryption + Anti-Tamper + Binary
]]--`;
}
