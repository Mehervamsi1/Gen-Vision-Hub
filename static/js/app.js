// GenVision Hub - Main JavaScript Application

class GenVisionHub {
    constructor() {
        this.selectedModels = new Set();
        this.promptHistory = [];
        this.isGenerating = false;
        
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.loadHistory();
        this.updateGenerateButtonState();
    }

    bindEventListeners() {
        // Model selection checkboxes
        document.querySelectorAll('.model-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleModelSelection(e.target.value, e.target.checked);
            });
        });

        // Prompt input
        const promptInput = document.getElementById('promptInput');
        promptInput.addEventListener('input', (e) => {
            this.handlePromptInput(e.target.value);
        });

        // Generate button
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateVideos();
        });

        // Enter key in prompt input
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generateVideos();
            }
        });
    }

    handleModelSelection(modelId, isSelected) {
        if (isSelected) {
            this.selectedModels.add(modelId);
        } else {
            this.selectedModels.delete(modelId);
        }
        
        this.updateGenerateButtonState();
        this.updateDropdownButton();
    }

    handlePromptInput(prompt) {
        const charCount = document.getElementById('charCount');
        charCount.textContent = prompt.length;
        
        // Update character count color
        if (prompt.length > 450) {
            charCount.style.color = 'var(--danger-color)';
        } else if (prompt.length > 350) {
            charCount.style.color = 'var(--warning-color)';
        } else {
            charCount.style.color = 'var(--secondary-color)';
        }
        
        this.updateGenerateButtonState();
    }

    updateGenerateButtonState() {
        const generateBtn = document.getElementById('generateBtn');
        const prompt = document.getElementById('promptInput').value.trim();
        
        const isValid = prompt.length > 0 && this.selectedModels.size > 0 && !this.isGenerating;
        
        generateBtn.disabled = !isValid;
        
        if (this.isGenerating) {
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
        } else {
            generateBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generate Videos';
        }
    }

    updateDropdownButton() {
        const dropdownButton = document.getElementById('modelDropdown');
        const selectedCount = this.selectedModels.size;
        
        if (selectedCount === 0) {
            dropdownButton.innerHTML = '<i class="fas fa-cogs me-2"></i>Select Models';
            dropdownButton.className = 'btn btn-outline-light dropdown-toggle';
        } else {
            dropdownButton.innerHTML = `<i class="fas fa-cogs me-2"></i>Models (${selectedCount})`;
            dropdownButton.className = 'btn btn-light dropdown-toggle';
        }
    }

    async generateVideos() {
        if (this.isGenerating || this.selectedModels.size === 0) return;

        const prompt = document.getElementById('promptInput').value.trim();
        if (!prompt) {
            this.showError('Please enter a prompt');
            return;
        }

        this.isGenerating = true;
        this.updateGenerateButtonState();
        
        // Show loading state
        this.showLoading();
        this.hideResults();

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    models: Array.from(this.selectedModels)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate videos');
            }

            this.displayResults(data.results);
            this.loadHistory(); // Refresh history
            this.showSuccessMessage(data.message);

        } catch (error) {
            console.error('Error generating videos:', error);
            this.showError(error.message || 'Failed to generate videos. Please try again.');
        } finally {
            this.isGenerating = false;
            this.updateGenerateButtonState();
            this.hideLoading();
        }
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('d-none');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('d-none');
    }

    showResults() {
        document.getElementById('resultsSection').classList.remove('d-none');
    }

    hideResults() {
        document.getElementById('resultsSection').classList.add('d-none');
    }

    displayResults(results) {
        const videoGrid = document.getElementById('videoGrid');
        videoGrid.innerHTML = '';

        results.forEach((result, index) => {
            const videoItem = this.createVideoItem(result, index);
            videoGrid.appendChild(videoItem);
        });

        this.showResults();
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }

    createVideoItem(result, index) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 mb-4';

        col.innerHTML = `
            <div class="video-item fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="video-container">
                    <video controls preload="metadata">
                        <source src="${result.video_url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div class="video-info">
                    <div class="video-title">${result.model_name}</div>
                    <div class="video-meta">
                        <small><i class="fas fa-clock me-1"></i>${result.generation_time}</small>
                        <small><i class="fas fa-heart me-1"></i>${result.likes} likes</small>
                    </div>
                    <div class="video-actions">
                        <button class="btn btn-outline-primary btn-sm" onclick="app.downloadVideo('${result.video_url}', '${result.model_name}')">
                            <i class="fas fa-download me-1"></i>Download
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="app.likeVideo('${result.model_id}')">
                            <i class="fas fa-heart me-1"></i>Like
                        </button>
                    </div>
                </div>
            </div>
        `;

        return col;
    }

    async downloadVideo(videoUrl, modelName) {
        try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${modelName}-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showSuccessMessage('Video download started');
        } catch (error) {
            console.error('Error downloading video:', error);
            this.showError('Failed to download video');
        }
    }

    async likeVideo(modelId) {
        try {
            const response = await fetch('/api/like', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ video_id: modelId })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to like video');
            }

            this.showSuccessMessage('Video liked!');
        } catch (error) {
            console.error('Error liking video:', error);
            this.showError('Failed to like video');
        }
    }

    async loadHistory() {
        try {
            const response = await fetch('/api/history');
            const data = await response.json();
            
            this.promptHistory = data.history;
            this.displayHistory();
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    displayHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.promptHistory.length === 0) {
            historyList.innerHTML = '<p class="text-muted small">No recent prompts</p>';
            return;
        }

        historyList.innerHTML = this.promptHistory.map(item => {
            const date = new Date(item.timestamp).toLocaleString();
            const modelsText = item.models.join(', ');
            
            return `
                <div class="history-item slide-in">
                    <div class="history-prompt">${this.truncateText(item.prompt, 60)}</div>
                    <div class="history-meta">
                        <div class="history-models">
                            ${item.models.map(model => `<span class="badge bg-primary">${model}</span>`).join('')}
                        </div>
                        <small>${this.formatDate(date)}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 24 * 7) return `${Math.floor(diffInHours / 24)}d ago`;
        
        return date.toLocaleDateString();
    }

    showError(message) {
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        document.getElementById('errorMessage').textContent = message;
        errorModal.show();
    }

    showSuccessMessage(message) {
        // Create and show a toast notification
        const toast = this.createToast(message, 'success');
        document.body.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toast);
        });
    }

    createToast(message, type = 'info') {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';

        const iconClass = type === 'success' ? 'fas fa-check-circle text-success' : 'fas fa-info-circle text-info';
        
        toastContainer.innerHTML = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="${iconClass} me-2"></i>
                    <strong class="me-auto">GenVision Hub</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        return toastContainer;
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GenVisionHub();
});

// Global utility functions
window.app = app;
