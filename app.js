// AI Hiring Management System - JavaScript Application

class HiringManagementSystem {
    constructor() {
        this.currentSection = 'dashboard';
        this.isDarkTheme = false;
        this.data = {
            jobs: [
                {
                    id: 1,
                    title: "Senior Full Stack Developer",
                    description: "We are looking for a Senior Full Stack Developer with expertise in React, Node.js, and cloud platforms. You will work on building scalable web applications and leading technical decisions.",
                    skills: ["React", "Node.js", "Python", "AWS", "Docker", "MongoDB"],
                    experience_level: "Senior", 
                    status: "Active",
                    created_date: "2025-08-20T00:00:00",
                    applications_count: 23,
                    department: "Engineering",
                    location: "San Francisco, CA",
                    salary_range: "$120,000 - $160,000"
                },
                {
                    id: 2,
                    title: "Data Scientist",
                    description: "Join our AI team to build machine learning models and extract insights from large datasets. Work with cutting-edge ML technologies.",
                    skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics", "Data Visualization"],
                    experience_level: "Mid-Level",
                    status: "Active",
                    created_date: "2025-08-18T00:00:00", 
                    applications_count: 31,
                    department: "Data Science",
                    location: "Remote",
                    salary_range: "$90,000 - $130,000"
                },
                {
                    id: 3,
                    title: "DevOps Engineer", 
                    description: "Manage our cloud infrastructure and CI/CD pipelines for scalable applications. Help build robust deployment systems.",
                    skills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Terraform", "Linux"],
                    experience_level: "Senior",
                    status: "Active",
                    created_date: "2025-08-15T00:00:00",
                    applications_count: 18,
                    department: "Engineering", 
                    location: "New York, NY",
                    salary_range: "$110,000 - $150,000"
                },
                {
                    id: 4,
                    title: "Frontend Developer",
                    description: "Create beautiful and responsive user interfaces using modern JavaScript frameworks.",
                    skills: ["JavaScript", "React", "Vue.js", "CSS", "HTML", "TypeScript"],
                    experience_level: "Mid-Level",
                    status: "Active",
                    created_date: "2025-08-10T00:00:00",
                    applications_count: 15,
                    department: "Engineering",
                    location: "Austin, TX", 
                    salary_range: "$80,000 - $110,000"
                }
            ],
            candidates: [
                {
                    id: 1,
                    name: "Yash",
                    email: "yash@gmail.com",
                    phone: "+1-234-567-8901",
                    skills: ["Python", "Java", "JavaScript", "TypeScript", "React", "Angular", "Node.js", "AWS", "Docker"],
                    experience: "10+ years",
                    education: "Bachelor of Science in Computer Science",
                    location: "Chennai, Tamil Nadu, India",
                    status: "Applied",
                    applied_jobs: [1],
                    created_date: "2025-09-01T00:00:00",
                    match_scores: [{"job_id": 1, "score": 92.5}],
                    confidence_scores: {"overall": 0.95}
                },
                {
                    id: 2, 
                    name: "John Doe",
                    email: "john.doe@email.com",
                    phone: "(555) 123-4567",
                    skills: ["React", "Node.js", "JavaScript", "MongoDB", "Git"],
                    experience: "5+ years",
                    education: "Bachelor of Computer Science",
                    location: "San Francisco, CA",
                    status: "Interview Scheduled",
                    applied_jobs: [1],
                    created_date: "2025-08-28T00:00:00",
                    match_scores: [{"job_id": 1, "score": 78.3}],
                    confidence_scores: {"overall": 0.88}
                },
                {
                    id: 3,
                    name: "Jane Smith", 
                    email: "jane.smith@gmail.com",
                    phone: "(555) 987-6543",
                    skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics", "Pandas"],
                    experience: "6+ years",
                    education: "Master of Science in Data Science",
                    location: "New York, NY",
                    status: "Applied",
                    applied_jobs: [2],
                    created_date: "2025-08-25T00:00:00",
                    match_scores: [{"job_id": 2, "score": 95.2}],
                    confidence_scores: {"overall": 0.92}
                },
                {
                    id: 4,
                    name: "Mike Johnson",
                    email: "mike.johnson@email.com", 
                    phone: "(555) 456-7890",
                    skills: ["AWS", "Docker", "Kubernetes", "Linux", "Python", "Jenkins"],
                    experience: "8+ years",
                    education: "Bachelor of Engineering",
                    location: "Seattle, WA",
                    status: "Applied",
                    applied_jobs: [3],
                    created_date: "2025-08-22T00:00:00",
                    match_scores: [{"job_id": 3, "score": 89.7}],
                    confidence_scores: {"overall": 0.85}
                },
                {
                    id: 5,
                    name: "Sarah Wilson",
                    email: "sarah.wilson@gmail.com",
                    phone: "(555) 234-5678",
                    skills: ["JavaScript", "React", "Vue.js", "CSS", "HTML", "TypeScript"],
                    experience: "4+ years", 
                    education: "Bachelor of Computer Science",
                    location: "Austin, TX",
                    status: "Applied",
                    applied_jobs: [4],
                    created_date: "2025-08-20T00:00:00",
                    match_scores: [{"job_id": 4, "score": 91.4}],
                    confidence_scores: {"overall": 0.90}
                }
            ],
            interviews: [
                {
                    id: 1,
                    candidate_id: 2,
                    job_id: 1,
                    candidate_name: "John Doe", 
                    job_title: "Senior Full Stack Developer",
                    interviewer: "Sarah Wilson",
                    datetime: "2025-09-08T14:00:00",
                    interview_type: "Technical",
                    status: "Scheduled",
                    duration: 60,
                    location: "Virtual",
                    meeting_link: "https://meet.google.com/xyz-demo-link",
                    created_date: "2025-09-05T00:00:00"
                },
                {
                    id: 2,
                    candidate_id: 3,
                    job_id: 2,
                    candidate_name: "Jane Smith",
                    job_title: "Data Scientist",
                    interviewer: "Mike Johnson", 
                    datetime: "2025-09-10T11:00:00",
                    interview_type: "Technical",
                    status: "Scheduled",
                    duration: 90,
                    location: "Virtual",
                    meeting_link: "https://meet.google.com/abc-demo-link",
                    created_date: "2025-09-04T00:00:00"
                }
            ],
            interviewers: [
                {"name": "John Smith", "role": "Senior Engineering Manager", "specialties": ["System Design", "Leadership"]},
                {"name": "Sarah Wilson", "role": "Principal Engineer", "specialties": ["Frontend", "React", "JavaScript"]},
                {"name": "Mike Johnson", "role": "Data Science Lead", "specialties": ["Machine Learning", "Python", "Statistics"]},
                {"name": "Lisa Chen", "role": "DevOps Manager", "specialties": ["AWS", "Kubernetes", "CI/CD"]}
            ],
            integration_status: {
                google_calendar: {"status": "Connected", "last_sync": "2025-09-05T12:30:00"},
                linkedin_api: {"status": "Ready", "note": "Requires partner approval"},
                email_notifications: {"status": "Configured", "provider": "Gmail API"},
                database: {"status": "Connected", "type": "SQLite", "backup_enabled": true},
                file_processing: {"status": "Ready", "supported_formats": ["PDF", "DOCX", "DOC"]}
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDashboard();
        this.detectThemePreference();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Resume upload
        const uploadArea = document.getElementById('uploadArea');
        const resumeFile = document.getElementById('resumeFile');
        
        uploadArea.addEventListener('click', () => resumeFile.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processResumeFile(files[0]);
            }
        });

        resumeFile.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processResumeFile(e.target.files[0]);
            }
        });

        // Interview scheduling
        document.getElementById('scheduleInterviewBtn').addEventListener('click', () => {
            this.showInterviewForm();
        });

        document.getElementById('cancelSchedule').addEventListener('click', () => {
            this.hideInterviewForm();
        });

        document.getElementById('scheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.scheduleInterview();
        });

        // Modal close events - Fixed to handle modal properly
        document.getElementById('closeJobModal').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeModal();
        });

        // Close modal when clicking outside of modal content
        document.getElementById('jobModal').addEventListener('click', (e) => {
            if (e.target.id === 'jobModal') {
                this.closeModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterCandidates(e.target.value);
        });
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        // Render section-specific content
        switch(section) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'jobs':
                this.renderJobs();
                break;
            case 'candidates':
                this.renderCandidates();
                break;
            case 'interviews':
                this.renderInterviews();
                break;
            case 'analytics':
                this.renderAnalytics();
                break;
        }
    }

    detectThemePreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            this.isDarkTheme = true;
            document.documentElement.setAttribute('data-color-scheme', 'dark');
            document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.documentElement.setAttribute('data-color-scheme', this.isDarkTheme ? 'dark' : 'light');
        document.getElementById('themeToggle').innerHTML = this.isDarkTheme ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }

    renderDashboard() {
        this.renderRecentActivity();
        this.renderIntegrationStatus();
    }

    renderRecentActivity() {
        const activityContainer = document.getElementById('recentActivity');
        const activities = [
            { type: 'new-candidate', text: 'Yash applied for Senior Full Stack Developer', time: '2 hours ago', icon: 'user-plus' },
            { type: 'interview-scheduled', text: 'Interview scheduled with John Doe', time: '4 hours ago', icon: 'calendar-check' },
            { type: 'job-posted', text: 'DevOps Engineer position posted', time: '1 day ago', icon: 'briefcase' },
            { type: 'new-candidate', text: 'Jane Smith applied for Data Scientist', time: '2 days ago', icon: 'user-plus' }
        ];

        activityContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.text}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    renderIntegrationStatus() {
        const statusContainer = document.getElementById('integrationStatus');
        const integrations = [
            { name: 'Google Calendar', status: 'Connected', icon: 'calendar', class: 'status-connected' },
            { name: 'LinkedIn API', status: 'Ready', icon: 'linkedin', class: 'status-ready' },
            { name: 'Email Notifications', status: 'Configured', icon: 'envelope', class: 'status-configured' },
            { name: 'Database', status: 'Connected', icon: 'database', class: 'status-connected' }
        ];

        statusContainer.innerHTML = integrations.map(integration => `
            <div class="status-item">
                <div class="status-icon ${integration.class}">
                    <i class="fas fa-${integration.icon}"></i>
                </div>
                <div class="status-content">
                    <p>${integration.name}</p>
                    <span class="status-note">${integration.status}</span>
                </div>
            </div>
        `).join('');
    }

    renderJobs() {
        const jobsGrid = document.getElementById('jobsGrid');
        jobsGrid.innerHTML = this.data.jobs.map(job => `
            <div class="job-card" onclick="hiringSystem.showJobDetails(${job.id})">
                <div class="job-header">
                    <div>
                        <h3 class="job-title">${job.title}</h3>
                        <span class="job-department">${job.department}</span>
                    </div>
                </div>
                <div class="job-details">
                    <div class="job-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${job.location}</span>
                    </div>
                    <div class="job-detail">
                        <i class="fas fa-briefcase"></i>
                        <span>${job.experience_level}</span>
                    </div>
                    <div class="job-detail">
                        <i class="fas fa-dollar-sign"></i>
                        <span>${job.salary_range}</span>
                    </div>
                </div>
                <div class="job-skills">
                    <div class="skills-list">
                        ${job.skills.slice(0, 4).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        ${job.skills.length > 4 ? `<span class="skill-tag">+${job.skills.length - 4} more</span>` : ''}
                    </div>
                </div>
                <div class="job-footer">
                    <span class="applications-count">
                        <strong>${job.applications_count}</strong> applications
                    </span>
                    <span class="status status--success">${job.status}</span>
                </div>
            </div>
        `).join('');
    }

    showJobDetails(jobId) {
        const job = this.data.jobs.find(j => j.id === jobId);
        if (!job) return;

        document.getElementById('modalJobTitle').textContent = job.title;
        document.getElementById('jobModalBody').innerHTML = `
            <div class="mb-16">
                <h4>Department: ${job.department}</h4>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Experience Level:</strong> ${job.experience_level}</p>
                <p><strong>Salary Range:</strong> ${job.salary_range}</p>
            </div>
            <div class="mb-16">
                <h4>Job Description</h4>
                <p>${job.description}</p>
            </div>
            <div class="mb-16">
                <h4>Required Skills</h4>
                <div class="skills-list">
                    ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            <div class="mb-16">
                <h4>Applications</h4>
                <p><strong>${job.applications_count}</strong> candidates have applied for this position</p>
            </div>
        `;
        
        document.getElementById('jobModal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('jobModal').classList.add('hidden');
    }

    renderCandidates() {
        const candidatesTable = document.getElementById('candidatesTable');
        candidatesTable.innerHTML = `
            <div class="table-header">
                <div>Candidate</div>
                <div>Experience</div>
                <div>Skills</div>
                <div>Match Score</div>
                <div>Status</div>
                <div>Applied Date</div>
            </div>
            ${this.data.candidates.map(candidate => this.renderCandidateRow(candidate)).join('')}
        `;
    }

    renderCandidateRow(candidate) {
        const matchScore = candidate.match_scores[0]?.score || 0;
        const scoreClass = matchScore >= 90 ? 'excellent' : matchScore >= 80 ? 'good' : 'fair';
        const appliedDate = new Date(candidate.created_date).toLocaleDateString();

        return `
            <div class="table-row">
                <div class="candidate-info">
                    <div class="candidate-name">${candidate.name}</div>
                    <div class="candidate-email">${candidate.email}</div>
                </div>
                <div>${candidate.experience}</div>
                <div>
                    <div class="skills-list">
                        ${candidate.skills.slice(0, 3).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        ${candidate.skills.length > 3 ? `<span class="skill-tag">+${candidate.skills.length - 3}</span>` : ''}
                    </div>
                </div>
                <div>
                    <span class="match-score ${scoreClass}">${matchScore.toFixed(1)}%</span>
                </div>
                <div>
                    <span class="status status--${candidate.status === 'Applied' ? 'info' : 'success'}">${candidate.status}</span>
                </div>
                <div>${appliedDate}</div>
            </div>
        `;
    }

    filterCandidates(status) {
        const filteredCandidates = status ? 
            this.data.candidates.filter(candidate => candidate.status === status) : 
            this.data.candidates;
        
        const candidatesTable = document.getElementById('candidatesTable');
        candidatesTable.innerHTML = `
            <div class="table-header">
                <div>Candidate</div>
                <div>Experience</div>
                <div>Skills</div>
                <div>Match Score</div>
                <div>Status</div>
                <div>Applied Date</div>
            </div>
            ${filteredCandidates.map(candidate => this.renderCandidateRow(candidate)).join('')}
        `;
    }

    processResumeFile(file) {
        if (!file) return;
        
        // Hide upload area, show processing
        document.getElementById('uploadArea').classList.add('hidden');
        document.getElementById('processingAnimation').classList.remove('hidden');
        
        // Simulate processing with progress bar
        let progress = 0;
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.getElementById('progressText');
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.showExtractionResults(file);
                }, 1000);
            }
        }, 200);
    }

    showExtractionResults(file) {
        document.getElementById('processingAnimation').classList.add('hidden');
        document.getElementById('extractionResults').classList.remove('hidden');
        
        // Simulate extracted data
        const extractedData = {
            name: { value: "Alex Johnson", confidence: 0.98 },
            email: { value: "alex.johnson@email.com", confidence: 0.95 },
            phone: { value: "(555) 123-4567", confidence: 0.92 },
            skills: { value: ["JavaScript", "React", "Node.js", "Python", "AWS", "Docker"], confidence: 0.88 },
            experience: { value: "5+ years", confidence: 0.85 },
            education: { value: "Master of Computer Science", confidence: 0.90 }
        };
        
        const resultsContent = document.getElementById('resultsContent');
        resultsContent.innerHTML = Object.entries(extractedData).map(([key, data]) => `
            <div class="result-field">
                <div class="result-label">
                    <strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong>
                    <span class="confidence-score">${Math.round(data.confidence * 100)}%</span>
                </div>
                <div class="result-value">
                    ${Array.isArray(data.value) ? 
                        `<div class="skills-list">${data.value.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}</div>` : 
                        data.value
                    }
                </div>
            </div>
        `).join('');
    }

    renderInterviews() {
        this.populateInterviewSelects();
        this.renderInterviewsList();
    }

    populateInterviewSelects() {
        const candidateSelect = document.getElementById('candidateSelect');
        const jobSelect = document.getElementById('jobSelect');
        const interviewerSelect = document.getElementById('interviewerSelect');
        
        candidateSelect.innerHTML = '<option value="">Select Candidate</option>' +
            this.data.candidates.map(candidate => 
                `<option value="${candidate.id}">${candidate.name} - ${candidate.email}</option>`
            ).join('');
        
        jobSelect.innerHTML = '<option value="">Select Job</option>' +
            this.data.jobs.map(job => 
                `<option value="${job.id}">${job.title}</option>`
            ).join('');
        
        interviewerSelect.innerHTML = '<option value="">Select Interviewer</option>' +
            this.data.interviewers.map(interviewer => 
                `<option value="${interviewer.name}">${interviewer.name} - ${interviewer.role}</option>`
            ).join('');
    }

    renderInterviewsList() {
        const interviewsList = document.getElementById('interviewsList');
        interviewsList.innerHTML = this.data.interviews.map(interview => `
            <div class="interview-item">
                <div class="interview-header">
                    <div>
                        <div class="interview-candidate">${interview.candidate_name}</div>
                        <div class="interview-job">${interview.job_title}</div>
                    </div>
                    <span class="interview-status">${interview.status}</span>
                </div>
                <div class="interview-details">
                    <div class="interview-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${new Date(interview.datetime).toLocaleDateString()}</span>
                    </div>
                    <div class="interview-detail">
                        <i class="fas fa-clock"></i>
                        <span>${new Date(interview.datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div class="interview-detail">
                        <i class="fas fa-user"></i>
                        <span>${interview.interviewer}</span>
                    </div>
                    <div class="interview-detail">
                        <i class="fas fa-video"></i>
                        <a href="${interview.meeting_link}" target="_blank">Join Meeting</a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showInterviewForm() {
        document.getElementById('interviewForm').classList.remove('hidden');
    }

    hideInterviewForm() {
        document.getElementById('interviewForm').classList.add('hidden');
        document.getElementById('scheduleForm').reset();
    }

    scheduleInterview() {
        const form = document.getElementById('scheduleForm');
        const formData = new FormData(form);
        
        const candidateId = document.getElementById('candidateSelect').value;
        const jobId = document.getElementById('jobSelect').value;
        const interviewer = document.getElementById('interviewerSelect').value;
        const datetime = document.getElementById('interviewDateTime').value;
        const duration = document.getElementById('interviewDuration').value;
        
        if (!candidateId || !jobId || !interviewer || !datetime) {
            alert('Please fill all required fields');
            return;
        }
        
        const candidate = this.data.candidates.find(c => c.id == candidateId);
        const job = this.data.jobs.find(j => j.id == jobId);
        
        // Create new interview
        const newInterview = {
            id: this.data.interviews.length + 1,
            candidate_id: parseInt(candidateId),
            job_id: parseInt(jobId),
            candidate_name: candidate.name,
            job_title: job.title,
            interviewer: interviewer,
            datetime: datetime,
            interview_type: "Technical",
            status: "Scheduled",
            duration: parseInt(duration),
            location: "Virtual",
            meeting_link: `https://meet.google.com/demo-${Math.random().toString(36).substr(2, 9)}`,
            created_date: new Date().toISOString()
        };
        
        this.data.interviews.push(newInterview);
        
        // Update candidate status
        candidate.status = "Interview Scheduled";
        
        // Refresh the interviews list
        this.renderInterviewsList();
        this.hideInterviewForm();
        
        // Show success message
        alert(`Interview scheduled successfully!\nMeeting link: ${newInterview.meeting_link}`);
    }

    renderAnalytics() {
        setTimeout(() => {
            this.createPipelineChart();
            this.createSkillsChart();
            this.createDepartmentChart();
            this.createMatchScoreChart();
        }, 100);
    }

    createPipelineChart() {
        const ctx = document.getElementById('pipelineChart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Applications', 'Screening', 'Interview', 'Offer', 'Hired'],
                datasets: [{
                    label: 'Candidates',
                    data: [87, 65, 32, 18, 12],
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createSkillsChart() {
        const ctx = document.getElementById('skillsChart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['JavaScript', 'React', 'Python', 'AWS', 'Node.js', 'Docker'],
                datasets: [{
                    data: [25, 20, 18, 15, 12, 10],
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createDepartmentChart() {
        const ctx = document.getElementById('departmentChart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Engineering', 'Data Science', 'Product', 'Design', 'Marketing'],
                datasets: [{
                    label: 'Open Positions',
                    data: [12, 8, 5, 3, 4],
                    backgroundColor: '#1FB8CD'
                }, {
                    label: 'Filled Positions',
                    data: [8, 5, 3, 2, 3],
                    backgroundColor: '#FFC185'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createMatchScoreChart() {
        const ctx = document.getElementById('matchScoreChart');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['90-100%', '80-89%', '70-79%', '60-69%', '50-59%', 'Below 50%'],
                datasets: [{
                    label: 'Number of Candidates',
                    data: [15, 25, 18, 12, 8, 5],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hiringSystem = new HiringManagementSystem();
});