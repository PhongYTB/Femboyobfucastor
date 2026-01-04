// Configuration
const CONFIG = {
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    ALLOWED_EXTENSIONS: ['.lua', '.txt'],
    API_ENDPOINT: '/api/obfuscate',
    VERSION: 'FemboyObfucator ULTRA v5.0'
};

// DOM Elements
const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const filePreview = document.getElementById('file-preview');
const obfuscateBtn = document.getElementById('obfuscate-btn');
const downloadSection = document.getElementById('download-section');
const downloadLink = document.getElementById('download-link');
const processing = document.getElementById('processing');
const statusIndicator = document.getElementById('status-indicator');
const progressBar = document.getElementById('progress-bar');
const layerProgress = document.getElementById('layer-progress');
const protectionProgress = document.getElementById('protection-progress');

// Application State
class AppState {
    constructor() {
        this.currentFile = null;
        this.isProcessing = false;
        this.uploadedFile = null;
        this.obfuscationResult = null;
    }
    
    reset() {
        this.currentFile = null;
        this.isProcessing = false;
        this.uploadedFile = null;
        this.obfuscationResult = null;
    }
}

const appState = new AppState();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    setupEventListeners();
    updateStatus('ready', 'Ready to obfuscate');
});

// Drag and Drop
function initializeDragAndDrop() {
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Event Listeners
function setupEventListeners() {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
    
    obfuscateBtn.addEventListener('click', startObfuscation);
    
    // Download button
    downloadLink.addEventListener('click', (e) => {
        if (!appState.obfuscationResult) {
            e.preventDefault();
            alert('No file to download');
        }
    });
}

// File Handling
async function handleFile(file) {
    try {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            showError(validation.message);
            return;
        }
        
        // Read file
        const content = await readFileContent(file);
        
        // Update UI
        updateFilePreview(file, content);
        appState.currentFile = file;
        appState.uploadedFile = {
            name: file.name,
            size: file.size,
            content: content,
            type: file.type
        };
        
        obfuscateBtn.disabled = false;
        updateStatus('ready', `Loaded: ${formatFileSize(file.size)}`);
        
    } catch (error) {
        console.error('Error handling file:', error);
        showError('Failed to read file');
    }
}

function validateFile(file) {
    // Check size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        return {
            valid: false,
            message: `File too large (max ${formatFileSize(CONFIG.MAX_FILE_SIZE)})`
        };
    }
    
    // Check extension
    const ext = '.' + file.name.toLowerCase().split('.').pop();
    if (!CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
        return {
            valid: false,
            message: 'Only .lua and .txt files are allowed'
        };
    }
    
    return { valid: true };
}

function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

// Obfuscation Process
async function startObfuscation() {
    if (!appState.currentFile || appState.isProcessing) {
        return;
    }
    
    try {
        appState.isProcessing = true;
        obfuscateBtn.disabled = true;
        
        // Show processing UI
        showProcessing();
        
        // Simulate layer progress
        await simulateObfuscationProgress();
        
        // Send to API
        const formData = new FormData();
        formData.append('file', appState.currentFile);
        
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Obfuscation failed');
        }
        
        // Get the obfuscated file
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Store result
        appState.obfuscationResult = {
            url: url,
            blob: blob,
            size: blob.size,
            originalSize: appState.currentFile.size,
            layers: response.headers.get('X-Layers-Applied') || '24',
            protections: response.headers.get('X-Protections-Applied') || '18',
            encryptionKey: response.headers.get('X-Encryption-Key-ID') || 'N/A'
        };
        
        // Show download section
        showDownloadSection();
        
        updateStatus('success', 'Obfuscation complete!');
        
    } catch (error) {
        console.error('Obfuscation error:', error);
        showError(`Obfuscation failed: ${error.message}`);
        updateStatus('error', 'Failed');
    } finally {
        appState.isProcessing = false;
    }
}

// UI Updates
function updateFilePreview(file, content) {
    const previewLines = content.split('\n').slice(0, 10).join('\n');
    const lineCount = content.split('\n').length;
    
    filePreview.innerHTML = `
        <div class="file-preview-content">
            <div class="file-header">
                <i class="fas fa-file-code"></i>
                <div>
                    <h4>${file.name}</h4>
                    <p class="file-meta">
                        ${formatFileSize(file.size)} • ${lineCount} lines
                    </p>
                </div>
            </div>
            <div class="code-preview">
                <pre><code>${escapeHtml(previewLines)}</code></pre>
                ${lineCount > 10 ? '<div class="preview-overlay">... more content ...</div>' : ''}
            </div>
        </div>
    `;
}

function showProcessing() {
    processing.style.display = 'block';
    downloadSection.style.display = 'none';
    
    // Reset progress
    progressBar.style.width = '0%';
    layerProgress.textContent = '0/24';
    protectionProgress.textContent = '0/18';
}

async function simulateObfuscationProgress() {
    // Simulate 24 layers
    for (let i = 1; i <= 24; i++) {
        await sleep(50 + Math.random() * 100);
        const percent = (i / 24) * 50; // First half for layers
        progressBar.style.width = `${percent}%`;
        layerProgress.textContent = `${i}/24`;
        
        // Update layer name
        const layerNames = [
            'String Encryption', 'Constant Encryption', 'Control Flow Flattening',
            'Variable Renaming', 'Dead Code Injection', 'Opcode Obfuscation',
            'Virtualization Layer 1', 'Virtualization Layer 2', 'Metatable Overloading',
            'Instruction Reordering', 'API Hooking', 'Runtime Code Generation',
            'Multi-Key Crypto', 'Instruction Overlap', 'Quantum VM',
            'Time-Based Decryption', 'Hardware Binding', 'Neural Network',
            'Blockchain Verification', 'Homomorphic Encryption', 'Quantum-Resistant Crypto',
            'Self-Mutating Code', 'Multi-Stage Packing', 'Integrity Checksum'
        ];
        
        document.getElementById('current-layer').textContent = 
            i <= layerNames.length ? layerNames[i-1] : `Layer ${i}`;
    }
    
    // Simulate 18 protections
    for (let i = 1; i <= 18; i++) {
        await sleep(30 + Math.random() * 80);
        const percent = 50 + (i / 18) * 50; // Second half for protections
        progressBar.style.width = `${percent}%`;
        protectionProgress.textContent = `${i}/18`;
        
        // Update protection name
        const protectionNames = [
            'Multi-Threaded Monitoring', 'Memory Checksumming', 'Debugger Detection',
            'Sandbox Detection', 'Timing Attack Resistance', 'Distributed Checksums',
            'Cross Validation', 'Blockchain Anchoring', 'Hardware Tokens',
            'Behavioral Analysis', 'ML Detection', 'Environment Fingerprinting',
            'Resource Monitoring', 'Gradual Degradation', 'False Data Injection',
            'Legal Notices', 'Silent Reporting', 'Self-Destruct Systems'
        ];
        
        document.getElementById('current-protection').textContent = 
            i <= protectionNames.length ? protectionNames[i-1] : `Protection ${i}`;
    }
    
    // Final binary steganography
    document.getElementById('current-layer').textContent = 'Binary Steganography';
    await sleep(200);
    progressBar.style.width = '100%';
}

function showDownloadSection() {
    processing.style.display = 'none';
    downloadSection.style.display = 'block';
    
    // Update download info
    const result = appState.obfuscationResult;
    document.getElementById('original-size').textContent = formatFileSize(result.originalSize);
    document.getElementById('obfuscated-size').textContent = formatFileSize(result.size);
    document.getElementById('compression-ratio').textContent = 
        `${((result.size / result.originalSize) * 100).toFixed(1)}%`;
    document.getElementById('layers-applied').textContent = result.layers;
    document.getElementById('protections-applied').textContent = result.protections;
    
    // Setup download link
    downloadLink.href = result.url;
    downloadLink.download = `obfuscated_${appState.currentFile.name}`;
    
    // Update security badges
    updateSecurityBadges(result);
}

function updateSecurityBadges(result) {
    const badges = document.querySelectorAll('.security-badge');
    badges.forEach(badge => badge.classList.add('active'));
}

function updateStatus(state, message) {
    statusIndicator.className = `status status-${state}`;
    statusIndicator.querySelector('.status-text').textContent = message;
    
    // Update indicator dot
    const dot = statusIndicator.querySelector('.status-dot');
    dot.className = `status-dot status-dot-${state}`;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button class="error-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
    
    // Close button
    errorDiv.querySelector('.error-close').addEventListener('click', () => {
        errorDiv.remove();
    });
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Analytics (optional)
function trackObfuscation(action, data = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            ...data,
            app_version: CONFIG.VERSION
        });
    }
}

// Export for debugging
window.FemboyObfucator = {
    version: CONFIG.VERSION,
    state: appState,
    utils: {
        formatFileSize,
        validateFile: (file) => validateFile(file).valid
    }
};
