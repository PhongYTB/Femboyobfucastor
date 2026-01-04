// DOM Elements
const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const filePreview = document.getElementById('file-preview');
const obfuscateBtn = document.getElementById('obfuscate-btn');
const downloadSection = document.getElementById('download-section');
const downloadLink = document.getElementById('download-link');
const processing = document.getElementById('processing');
const statusIndicator = document.getElementById('status-indicator');

// State
let currentFile = null;
let isProcessing = false;

// File handling
fileInput.addEventListener('change', handleFileSelect);
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', handleDragOver);
uploadZone.addEventListener('drop', handleFileDrop);

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
        loadFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    uploadZone.style.borderColor = '#ff69b4';
    uploadZone.style.transform = 'translateY(-5px)';
}

function handleFileDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
        loadFile(file);
    }
    uploadZone.style.borderColor = '';
    uploadZone.style.transform = '';
}

function validateFile(file) {
    // Check size (100MB max)
    if (file.size > 100 * 1024 * 1024) {
        alert('File size exceeds 100MB limit');
        return false;
    }
    
    // Check extension
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['lua', 'txt'].includes(ext)) {
        alert('Please upload .lua or .txt files only');
        return false;
    }
    
    return true;
}

function loadFile(file) {
    currentFile = file;
    
    // Update preview
    filePreview.innerHTML = `
        <div class="file-details">
            <i class="fas fa-file-code"></i>
            <div>
                <h4>${file.name}</h4>
                <p>${(file.size / 1024).toFixed(2)} KB • Ready to obfuscate</p>
            </div>
        </div>
    `;
    
    // Enable button
    obfuscateBtn.disabled = false;
    updateStatus('ready', 'File loaded');
}

// Obfuscation
obfuscateBtn.addEventListener('click', startObfuscation);

async function startObfuscation() {
    if (!currentFile || isProcessing) return;
    
    isProcessing = true;
    obfuscateBtn.disabled = true;
    processing.style.display = 'block';
    updateStatus('processing', 'Obfuscating...');
    
    try {
        // Simulate processing steps
        await simulateProcessing();
        
        // Upload to API
        const formData = new FormData();
        formData.append('file', currentFile);
        
        const response = await fetch('/api/obfuscate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Obfuscation failed');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Show download section
        processing.style.display = 'none';
        downloadSection.style.display = 'block';
        
        // Set download link
        downloadLink.href = url;
        downloadLink.download = `obfuscated_${currentFile.name}`;
        
        // Update file meta
        document.getElementById('file-meta').textContent = 
            `${currentFile.name} • ${(blob.size / 1024).toFixed(2)} KB • Roblox Ready`;
        
        updateStatus('success', 'Obfuscation complete');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Obfuscation failed. Please try again.');
        updateStatus('error', 'Failed');
    } finally {
        isProcessing = false;
    }
}

async function simulateProcessing() {
    const steps = document.querySelectorAll('.step');
    
    for (let i = 0; i < steps.length; i++) {
        // Add active class
        steps.forEach(s => s.classList.remove('active'));
        steps[i].classList.add('active');
        
        // Random delay between steps
        await new Promise(resolve => 
            setTimeout(resolve, 500 + Math.random() * 1000)
        );
    }
}

function updateStatus(state, message) {
    const dot = statusIndicator.querySelector('.dot');
    const text = statusIndicator.querySelector('span:last-child');
    
    statusIndicator.className = 'status';
    dot.style.background = '';
    
    switch(state) {
        case 'ready':
            statusIndicator.classList.add('ready');
            dot.style.background = '#00ff88';
            break;
        case 'processing':
            statusIndicator.classList.add('processing');
            dot.style.background = '#ffaa00';
            break;
        case 'success':
            statusIndicator.classList.add('success');
            dot.style.background = '#00ff88';
            break;
        case 'error':
            statusIndicator.classList.add('error');
            dot.style.background = '#ff4444';
            break;
    }
    
    text.textContent = message;
      }
