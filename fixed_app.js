
// Enhanced AI Hiring Management System - FIXED INTEGRATION VERSION
// Real API integration with backend FastAPI server

// API Configuration
const API_CONFIG = {
    BASE_URL: window.location.origin, // Use same origin as frontend
    ENDPOINTS: {
        health: '/health',
        candidates: '/api/candidates',
        jobs: '/api/jobs', 
        interviews: '/api/interviews',
        uploadResume: '/api/resumes/upload',
        skillMatch: '/api/skill-match',
        dashboard: '/api/analytics/dashboard'
    }
};

// Global state for application data
let appState = {
    jobs: [],
    candidates: [],
    interviews: [],
    interviewers: [
        {"name": "John Smith", "role": "Senior Engineering Manager", "specialties": ["System Design", "Leadership"]},
        {"name": "Sarah Wilson", "role": "Principal Engineer", "specialties": ["Frontend", "React", "JavaScript"]},
        {"name": "Mike Johnson", "role": "Data Science Lead", "specialties": ["Machine Learning", "Python", "Statistics"]},
        {"name": "Lisa Chen", "role": "DevOps Manager", "specialties": ["AWS", "Kubernetes", "CI/CD"]}
    ],
    loading: false,
    error: null
};

// Navigation state
let currentView = 'dashboard';
let currentMonth = new Date();
let editingJob = null;
let selectedSkills = [];

// API Helper Functions
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            console.log(`Making API request to: ${url}`, config);

            const response = await fetch(url, config);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
                }
                throw new Error(errorData.detail || `Request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('API response received:', data);
            return data;

        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            showNotification(`API Error: ${error.message}`, 'error');
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async uploadFile(endpoint, formData) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                method: 'POST',
                body: formData // Don't set Content-Type for FormData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Upload failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('File upload failed:', error);
            showNotification(`Upload Error: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Initialize API client
const api = new APIClient();

// Application initialization
async function initializeApp() {
    try {
        showLoading('Initializing application...');

        // Check API health
        const health = await api.get(API_CONFIG.ENDPOINTS.health);
        console.log('API Health Check:', health);

        // Load initial data
        await loadAllData();

        hideLoading();
        showNotification('Application initialized successfully', 'success');

        // Initialize current view
        showView('dashboard');

    } catch (error) {
        hideLoading();
        console.error('App initialization failed:', error);
        showNotification('Failed to connect to backend. Using offline mode.', 'error');

        // Initialize with empty data for offline mode
        appState = { ...appState, jobs: [], candidates: [], interviews: [] };
        showView('dashboard');
    }
}

// Data loading functions
async function loadAllData() {
    try {
        // Load jobs
        const jobsResponse = await api.get(API_CONFIG.ENDPOINTS.jobs);
        appState.jobs = jobsResponse.jobs || [];

        // Load candidates  
        const candidatesResponse = await api.get(API_CONFIG.ENDPOINTS.candidates);
        appState.candidates = candidatesResponse.candidates || [];

        // Load interviews
        const interviewsResponse = await api.get(API_CONFIG.ENDPOINTS.interviews);
        appState.interviews = interviewsResponse.interviews || [];

        console.log('Data loaded successfully:', {
            jobs: appState.jobs.length,
            candidates: appState.candidates.length,
            interviews: appState.interviews.length
        });

        // Update UI
        updateDashboard();
        updateJobsList();
        updateCandidatesList();
        updateInterviewsList();

    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
}

// Resume upload with real API integration
async function uploadResume(files, jobId = null) {
    if (!files || files.length === 0) {
        showNotification('Please select a file to upload', 'error');
        return;
    }

    const file = files[0];

    // Validate file
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
        showNotification('Only PDF, DOC, and DOCX files are supported', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
        showNotification('File size too large. Maximum 10MB allowed.', 'error');
        return;
    }

    try {
        showProcessingStatus('Uploading and parsing resume...', 'processing');
        updateProgressBar(10);

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        if (jobId) {
            formData.append('job_id', jobId);
        }

        updateProgressBar(30);

        // Upload to backend
        const response = await api.uploadFile(API_CONFIG.ENDPOINTS.uploadResume, formData);

        updateProgressBar(80);

        if (response.success) {
            // Add candidate to local state
            appState.candidates.unshift(response.candidate);

            // Refresh candidates list
            updateCandidatesList();

            updateProgressBar(100);
            showProcessingStatus('Resume uploaded and parsed successfully!', 'success');

            showNotification(`Resume uploaded successfully! Candidate: ${response.candidate.name}`, 'success');

            // Switch to candidates view to show the new candidate
            showView('candidates');

        } else {
            throw new Error('Upload failed: ' + response.message);
        }

    } catch (error) {
        console.error('Resume upload error:', error);
        showProcessingStatus('Upload failed: ' + error.message, 'error');
        updateProgressBar(0);
    } finally {
        // Reset progress after 3 seconds
        setTimeout(() => {
            updateProgressBar(0);
            hideProcessingStatus();
        }, 3000);
    }
}

// Dashboard functionality with real API data
async function updateDashboard() {
    try {
        const analytics = await api.get(API_CONFIG.ENDPOINTS.dashboard);

        // Update dashboard metrics
        updateDashboardMetrics(analytics);
        updateRecentActivity(analytics.recent_activity || []);
        updatePipelineStats(analytics.pipeline_stats || {});

    } catch (error) {
        console.error('Error updating dashboard:', error);
        // Update with local data as fallback
        updateDashboardMetricsLocal();
    }
}

function updateDashboardMetrics(analytics) {
    const metricsMap = [
        { id: 'active-jobs-count', value: analytics.total_jobs || 0 },
        { id: 'candidates-count', value: analytics.total_candidates || 0 },
        { id: 'interviews-count', value: analytics.total_interviews || 0 },
        { id: 'avg-match-score', value: (analytics.success_metrics?.avg_match_score || 0) + '%' }
    ];

    metricsMap.forEach(metric => {
        const element = document.getElementById(metric.id);
        if (element) {
            element.textContent = metric.value;
        }
    });
}

function updateDashboardMetricsLocal() {
    // Fallback to local state
    updateDashboardMetrics({
        total_jobs: appState.jobs.length,
        total_candidates: appState.candidates.length,
        total_interviews: appState.interviews.length,
        success_metrics: { avg_match_score: 75 }
    });
}

function updateRecentActivity(activities) {
    const activityList = document.getElementById('recent-activity-list');
    if (!activityList) return;

    if (activities.length === 0) {
        activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
        return;
    }

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i data-lucide="${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <p class="activity-message">${activity.message}</p>
                <span class="activity-time">${formatTimeAgo(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function getActivityIcon(type) {
    const iconMap = {
        'candidate_applied': 'user-plus',
        'interview_scheduled': 'calendar',
        'status_updated': 'edit',
        'job_created': 'briefcase'
    };
    return iconMap[type] || 'activity';
}

// Job management with API integration
async function createJob() {
    const form = document.getElementById('job-form');
    if (!form) return;

    const formData = new FormData(form);
    const jobData = {
        title: formData.get('title'),
        description: formData.get('description'),
        skills: selectedSkills,
        experience_level: formData.get('experience_level'),
        department: formData.get('department'),
        location: formData.get('location'),
        salary_range: formData.get('salary_range')
    };

    // Validation
    if (!jobData.title || !jobData.description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        showLoading('Creating job...');

        const response = await api.post(API_CONFIG.ENDPOINTS.jobs, jobData);

        if (response.success) {
            appState.jobs.unshift(response.job);
            updateJobsList();
            form.reset();
            selectedSkills = [];
            updateSelectedSkills();
            showNotification('Job created successfully!', 'success');
            showView('jobs');
        }

    } catch (error) {
        console.error('Job creation error:', error);
    } finally {
        hideLoading();
    }
}

// Interview scheduling with API integration  
async function scheduleInterview() {
    const form = document.getElementById('interview-form');
    if (!form) return;

    const formData = new FormData(form);
    const interviewData = {
        candidate_id: parseInt(formData.get('candidate_id')),
        job_id: parseInt(formData.get('job_id')),
        interviewer: formData.get('interviewer'),
        datetime: formData.get('datetime'),
        interview_type: formData.get('interview_type'),
        duration: parseInt(formData.get('duration')) || 60,
        location: formData.get('location') || 'Virtual',
        notes: formData.get('notes') || ''
    };

    // Validation
    if (!interviewData.candidate_id || !interviewData.job_id || !interviewData.interviewer || !interviewData.datetime) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    try {
        showLoading('Scheduling interview...');

        const response = await api.post(API_CONFIG.ENDPOINTS.interviews, interviewData);

        if (response.success) {
            appState.interviews.unshift(response.interview);
            updateInterviewsList();
            updateCalendar();
            form.reset();
            showNotification('Interview scheduled successfully!', 'success');
        }

    } catch (error) {
        console.error('Interview scheduling error:', error);
    } finally {
        hideLoading();
    }
}

// Skill matching with API integration
async function calculateSkillMatch(candidateId, jobId) {
    try {
        const response = await api.post(API_CONFIG.ENDPOINTS.skillMatch, {
            candidate_id: candidateId,
            job_id: jobId
        });

        if (response.success) {
            const match = response.match_result;
            console.log('Skill match calculated:', match);

            // Update candidate with match score
            const candidate = appState.candidates.find(c => c.id === candidateId);
            if (candidate) {
                if (!candidate.match_scores) candidate.match_scores = [];

                // Remove existing score for this job
                candidate.match_scores = candidate.match_scores.filter(ms => ms.job_id !== jobId);

                // Add new score
                candidate.match_scores.push({
                    job_id: jobId,
                    score: match.score,
                    matched_skills: match.matched_skills,
                    missing_skills: match.missing_skills,
                    calculated_date: new Date().toISOString()
                });

                updateCandidatesList();
            }

            return match;
        }

    } catch (error) {
        console.error('Skill match calculation error:', error);
        return null;
    }
}

// UI Update Functions with Real Data
function updateJobsList() {
    const container = document.getElementById('jobs-list');
    if (!container) return;

    if (appState.jobs.length === 0) {
        container.innerHTML = '<p class="empty-state">No jobs posted yet. Create your first job posting!</p>';
        return;
    }

    container.innerHTML = appState.jobs.map(job => `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-header">
                <h3 class="job-title">${job.title}</h3>
                <span class="job-status status-${job.status.toLowerCase()}">${job.status}</span>
            </div>
            <p class="job-description">${job.description.substring(0, 150)}...</p>
            <div class="job-details">
                <span class="detail-item">
                    <i data-lucide="map-pin"></i>
                    ${job.location || 'Not specified'}
                </span>
                <span class="detail-item">
                    <i data-lucide="building"></i>
                    ${job.department || 'Not specified'}
                </span>
                <span class="detail-item">
                    <i data-lucide="users"></i>
                    ${job.applications_count || 0} applications
                </span>
            </div>
            <div class="job-skills">
                ${(job.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="job-actions">
                <button class="btn btn-secondary" onclick="viewJobApplications(${job.id})">
                    <i data-lucide="users"></i>
                    View Applications
                </button>
                <button class="btn btn-primary" onclick="editJob(${job.id})">
                    <i data-lucide="edit"></i>
                    Edit
                </button>
            </div>
        </div>
    `).join('');

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function updateCandidatesList() {
    const container = document.getElementById('candidates-list');
    if (!container) return;

    if (appState.candidates.length === 0) {
        container.innerHTML = '<p class="empty-state">No candidates yet. Upload resumes to get started!</p>';
        return;
    }

    container.innerHTML = appState.candidates.map(candidate => {
        const topMatchScore = getTopMatchScore(candidate);

        return `
            <div class="candidate-card" data-candidate-id="${candidate.id}">
                <div class="candidate-header">
                    <div class="candidate-info">
                        <h3 class="candidate-name">${candidate.name}</h3>
                        <span class="candidate-status status-${candidate.status.toLowerCase().replace(' ', '-')}">${candidate.status}</span>
                    </div>
                    ${topMatchScore ? `<div class="match-score">${Math.round(topMatchScore)}% match</div>` : ''}
                </div>
                <div class="candidate-details">
                    <p><strong>Email:</strong> ${candidate.email || 'Not provided'}</p>
                    <p><strong>Phone:</strong> ${candidate.phone || 'Not provided'}</p>
                    <p><strong>Experience:</strong> ${candidate.experience || 'Not specified'}</p>
                    ${candidate.location ? `<p><strong>Location:</strong> ${candidate.location}</p>` : ''}
                </div>
                <div class="candidate-skills">
                    ${(candidate.skills || []).slice(0, 5).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    ${(candidate.skills || []).length > 5 ? `<span class="skill-more">+${candidate.skills.length - 5} more</span>` : ''}
                </div>
                <div class="candidate-actions">
                    <button class="btn btn-secondary" onclick="viewCandidate(${candidate.id})">
                        <i data-lucide="eye"></i>
                        View Details
                    </button>
                    <button class="btn btn-primary" onclick="scheduleInterviewForCandidate(${candidate.id})">
                        <i data-lucide="calendar-plus"></i>
                        Schedule Interview
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function getTopMatchScore(candidate) {
    if (!candidate.match_scores || candidate.match_scores.length === 0) {
        return null;
    }
    return Math.max(...candidate.match_scores.map(ms => ms.score || 0));
}

// Calendar integration
function updateCalendar() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Update month/year display
    const monthYearElement = document.getElementById('current-month-year');
    if (monthYearElement) {
        monthYearElement.textContent = currentMonth.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
    }

    let calendarHTML = '';

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day empty"></div>';
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];

        // Find interviews for this day
        const dayInterviews = appState.interviews.filter(interview => {
            const interviewDate = new Date(interview.datetime).toISOString().split('T')[0];
            return interviewDate === dateStr;
        });

        const isToday = dateStr === new Date().toISOString().split('T')[0];

        calendarHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                <span class="day-number">${day}</span>
                ${dayInterviews.map(interview => `
                    <div class="interview-event" onclick="viewInterview(${interview.id})">
                        <span class="interview-time">${new Date(interview.datetime).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}</span>
                        <span class="interview-candidate">${interview.candidate_name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    calendarGrid.innerHTML = calendarHTML;
}

// Navigation functions (keeping existing UI logic)
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected view
    const selectedView = document.getElementById(viewName);
    if (selectedView) {
        selectedView.classList.add('active');
    }

    // Add active class to nav item
    const navItem = document.querySelector(`[onclick="showView('${viewName}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }

    currentView = viewName;

    // Load view-specific data
    switch(viewName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'jobs':
            updateJobsList();
            break;
        case 'candidates':
            updateCandidatesList();
            break;
        case 'interviews':
            updateCalendar();
            updateInterviewsList();
            break;
    }
}

// Utility functions for UI
function showLoading(message = 'Loading...') {
    appState.loading = true;
    // Add loading indicator to UI
    const loadingIndicator = document.getElementById('loading-indicator') || createLoadingIndicator();
    loadingIndicator.style.display = 'block';
    loadingIndicator.textContent = message;
}

function hideLoading() {
    appState.loading = false;
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

function createLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'loading-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 9999;
        display: none;
    `;
    document.body.appendChild(indicator);
    return indicator;
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6b7280'};
    `;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Processing status functions (keeping existing implementation)
function showProcessingStatus(message, type = 'info') {
    const statusEl = document.getElementById('processing-status');
    if (!statusEl) return;

    const icons = {
        'processing': 'loader',
        'success': 'check-circle',
        'error': 'x-circle',
        'info': 'info'
    };

    statusEl.innerHTML = `
        <div class="status-content status-${type}">
            <i data-lucide="${icons[type]}"></i>
            <span>${message}</span>
        </div>
    `;
    statusEl.style.display = 'block';

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function hideProcessingStatus() {
    const statusEl = document.getElementById('processing-status');
    if (statusEl) {
        statusEl.style.display = 'none';
    }
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('upload-progress');
    if (progressBar) {
        const progressFill = progressBar.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        progressBar.style.display = percentage > 0 ? 'block' : 'none';
    }
}

// Utility functions
function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown time';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    return 'Just now';
}

// File handling for resume uploads
function handleFileSelect(event) {
    const files = event.target.files;
    const jobSelect = document.getElementById('job-select');
    const selectedJobId = jobSelect ? jobSelect.value : null;

    if (files && files.length > 0) {
        uploadResume(files, selectedJobId);
    }
}

// Skills management
function addSkill() {
    const input = document.getElementById('skill-input');
    if (!input) return;

    const skill = input.value.trim();
    if (skill && !selectedSkills.includes(skill)) {
        selectedSkills.push(skill);
        updateSelectedSkills();
        input.value = '';
    }
}

function removeSkill(skill) {
    selectedSkills = selectedSkills.filter(s => s !== skill);
    updateSelectedSkills();
}

function updateSelectedSkills() {
    const container = document.getElementById('selected-skills');
    if (!container) return;

    container.innerHTML = selectedSkills.map(skill => `
        <span class="skill-tag">
            ${skill}
            <button onclick="removeSkill('${skill}')" class="skill-remove">×</button>
        </span>
    `).join('');
}

// Calendar navigation
function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateCalendar();
}

// Modal and form handling
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Interview list update
function updateInterviewsList() {
    const container = document.getElementById('interviews-list');
    if (!container) return;

    if (appState.interviews.length === 0) {
        container.innerHTML = '<p class="empty-state">No interviews scheduled yet.</p>';
        return;
    }

    container.innerHTML = appState.interviews.map(interview => `
        <div class="interview-card">
            <div class="interview-header">
                <h4>${interview.candidate_name}</h4>
                <span class="interview-status status-${interview.status.toLowerCase().replace(' ', '-')}">${interview.status}</span>
            </div>
            <p class="interview-job">Position: ${interview.job_title}</p>
            <div class="interview-details">
                <span class="detail-item">
                    <i data-lucide="calendar"></i>
                    ${new Date(interview.datetime).toLocaleDateString()}
                </span>
                <span class="detail-item">
                    <i data-lucide="clock"></i>
                    ${new Date(interview.datetime).toLocaleTimeString()}
                </span>
                <span class="detail-item">
                    <i data-lucide="user"></i>
                    ${interview.interviewer}
                </span>
            </div>
            ${interview.meeting_link ? `
                <div class="interview-actions">
                    <a href="${interview.meeting_link}" target="_blank" class="btn btn-primary btn-sm">
                        <i data-lucide="video"></i>
                        Join Meeting
                    </a>
                </div>
            ` : ''}
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Event listeners and initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing application...');

    // Initialize the application
    initializeApp();

    // Set up file upload handling
    const fileInput = document.getElementById('resume-upload');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Set up form submissions
    const jobForm = document.getElementById('job-form');
    if (jobForm) {
        jobForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createJob();
        });
    }

    const interviewForm = document.getElementById('interview-form');
    if (interviewForm) {
        interviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            scheduleInterview();
        });
    }

    // Set up skill input
    const skillInput = document.getElementById('skill-input');
    if (skillInput) {
        skillInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
            }
        });
    }

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    console.log('Application initialization complete');
});

// Error handling
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('An unexpected error occurred', 'error');
});

window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
    showNotification('An error occurred in the application', 'error');
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        APIClient, 
        appState, 
        api, 
        initializeApp, 
        loadAllData,
        uploadResume,
        createJob,
        scheduleInterview
    };
}
