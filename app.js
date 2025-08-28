// Enhanced AI Hiring Management System - JavaScript Implementation
// FIXED VERSION with Real Resume Parsing and High Contrast UI

// Enhanced Data Storage with better state management
let appState = {
    jobs: [
        {
            id: 1,
            title: "Senior Full Stack Developer",
            description: "We are looking for a Senior Full Stack Developer with expertise in React, Node.js, and cloud platforms.",
            skills: ["React", "Node.js", "Python", "AWS", "Docker", "MongoDB"],
            experience_level: "Senior",
            status: "Active",
            created_date: "2025-08-20",
            applications_count: 23,
            department: "Engineering",
            location: "San Francisco, CA",
            salary_range: "$120,000 - $160,000"
        },
        {
            id: 2,
            title: "Data Scientist",
            description: "Join our AI team to build machine learning models and extract insights from large datasets.",
            skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics", "Data Visualization"],
            experience_level: "Mid-Level",
            status: "Active",
            created_date: "2025-08-18",
            applications_count: 31,
            department: "Data Science",
            location: "Remote",
            salary_range: "$90,000 - $130,000"
        },
        {
            id: 3,
            title: "DevOps Engineer",
            description: "Manage our cloud infrastructure and CI/CD pipelines for scalable applications.",
            skills: ["AWS", "Docker", "Kubernetes", "Jenkins", "Terraform", "Linux"],
            experience_level: "Senior",
            status: "Active",
            created_date: "2025-08-15",
            applications_count: 18,
            department: "Engineering",
            location: "New York, NY",
            salary_range: "$110,000 - $150,000"
        }
    ],
    candidates: [],
    interviews: [],
    interviewers: [
        {"name": "John Smith", "role": "Senior Engineering Manager", "specialties": ["System Design", "Leadership"]},
        {"name": "Sarah Wilson", "role": "Principal Engineer", "specialties": ["Frontend", "React", "JavaScript"]},
        {"name": "Mike Johnson", "role": "Data Science Lead", "specialties": ["Machine Learning", "Python", "Statistics"]},
        {"name": "Lisa Chen", "role": "DevOps Manager", "specialties": ["AWS", "Kubernetes", "CI/CD"]}
    ]
};

// Sample resume texts for fallback - using real sample data
const sampleResumeTexts = {
    "john_doe": `John Doe
555-123-4567
john.doe@email.com
linkedin.com/in/johndoe

SENIOR SOFTWARE ENGINEER

PROFESSIONAL EXPERIENCE:
Senior Software Engineer | Tech Corp | 2020-2025
• Developed React applications serving 1M+ users daily
• Led team of 5 developers in agile environment
• Implemented microservices architecture using Node.js and Docker
• Improved application performance by 40% through optimization
• Technologies: React, Node.js, Python, AWS, MongoDB, Docker

Software Engineer | StartupXYZ | 2018-2020
• Built full-stack applications using Python and React
• Collaborated with product team on user experience improvements
• Worked with AWS cloud infrastructure and CI/CD pipelines
• Technologies: Python, React, AWS, PostgreSQL, Git

EDUCATION:
Bachelor of Science in Computer Science
Stanford University | 2018
GPA: 3.8/4.0

TECHNICAL SKILLS:
Programming Languages: JavaScript, Python, Java, TypeScript
Frontend: React, Vue.js, HTML, CSS, Redux
Backend: Node.js, Express.js, Django, Spring Boot
Databases: MongoDB, PostgreSQL, MySQL, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, Git
Other: Agile, REST APIs, GraphQL, Microservices`,

    "jane_smith": `Jane Smith
Phone: (555) 987-6543
Email: jane.smith@gmail.com
Location: San Francisco, CA
LinkedIn: linkedin.com/in/janesmith

DATA SCIENTIST

PROFESSIONAL EXPERIENCE:

Senior Data Scientist | AI Solutions Inc. | 2022 - Present
• Developed machine learning models for predictive analytics using TensorFlow
• Led data science team of 4 members on customer segmentation project
• Improved model accuracy by 25% through advanced feature engineering
• Published 3 research papers in top-tier ML conferences
• Technologies: Python, TensorFlow, PyTorch, SQL, AWS

Data Scientist | DataTech Corp | 2019 - 2022
• Built recommendation systems using collaborative filtering in Python
• Analyzed large datasets (10M+ records) with SQL and Pandas
• Created interactive data visualizations using Tableau and D3.js
• Reduced customer churn by 15% through predictive modeling
• Technologies: Python, R, SQL, Tableau, Scikit-learn

Junior Data Analyst | Analytics Plus | 2017 - 2019
• Performed statistical analysis on marketing campaign data
• Created automated reporting systems using Python
• Technologies: Python, R, Excel, SQL, Statistics

EDUCATION:
Master of Science in Data Science | UC Berkeley | 2019
• Thesis: "Deep Learning for Natural Language Processing"
• GPA: 3.9/4.0

Bachelor of Science in Mathematics | UCLA | 2017
• Summa Cum Laude, Phi Beta Kappa
• GPA: 3.95/4.0

TECHNICAL SKILLS:
Programming: Python, R, SQL, Java, Scala
Machine Learning: TensorFlow, PyTorch, Scikit-learn, XGBoost
Data Tools: Pandas, NumPy, Jupyter, Apache Spark
Visualization: Tableau, Matplotlib, Seaborn, D3.js
Cloud: AWS, Google Cloud, Azure
Statistics: Regression, Classification, Time Series, A/B Testing`
};

const skillsTaxonomy = [
    "JavaScript", "Python", "Java", "React", "Node.js", "Vue.js", "Angular",
    "HTML", "CSS", "TypeScript", "SQL", "MongoDB", "PostgreSQL", "MySQL",
    "AWS", "Azure", "Docker", "Kubernetes", "Jenkins", "Git", "Linux",
    "Machine Learning", "TensorFlow", "PyTorch", "Data Science", "Statistics",
    "Communication", "Leadership", "Problem Solving", "Teamwork", "Agile",
    "Express.js", "Redux", "GraphQL", "REST APIs", "Microservices", "CI/CD",
    "Pandas", "NumPy", "Scikit-learn", "Tableau", "Spring Boot", "Django"
];

// Global State
let currentView = 'dashboard';
let currentMonth = new Date();
let editingJob = null;
let selectedSkills = [];
let confirmationCallback = null;
let currentFileBeingProcessed = null;
let extractedTextCache = {};

// REAL PDF AND DOCX PARSING FUNCTIONS
class DocumentParser {
    constructor() {
        // Set up PDF.js worker
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    async parsePDF(file) {
        try {
            updateProcessingStatus('Parsing PDF document...', 'processing');
            
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = '';
            
            updateProgressBar(20);
            
            const numPages = pdf.numPages;
            for (let i = 1; i <= numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
                
                updateProgressBar(20 + (60 * i / numPages));
            }
            
            updateProcessingStatus('PDF parsed successfully', 'success');
            return {
                text: fullText.trim(),
                confidence: this.calculateExtractionConfidence(fullText, 'pdf'),
                source: 'PDF'
            };
        } catch (error) {
            updateProcessingStatus('Error parsing PDF: ' + error.message, 'error');
            console.error('PDF parsing error:', error);
            throw new Error('Failed to parse PDF: ' + error.message);
        }
    }

    async parseDOCX(file) {
        try {
            updateProcessingStatus('Parsing DOCX document...', 'processing');
            
            const arrayBuffer = await file.arrayBuffer();
            updateProgressBar(30);
            
            const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
            updateProgressBar(80);
            
            if (result.messages && result.messages.length > 0) {
                console.warn('DOCX parsing warnings:', result.messages);
            }
            
            updateProcessingStatus('DOCX parsed successfully', 'success');
            return {
                text: result.value.trim(),
                confidence: this.calculateExtractionConfidence(result.value, 'docx'),
                source: 'DOCX'
            };
        } catch (error) {
            updateProcessingStatus('Error parsing DOCX: ' + error.message, 'error');
            console.error('DOCX parsing error:', error);
            throw new Error('Failed to parse DOCX: ' + error.message);
        }
    }

    calculateExtractionConfidence(text, fileType) {
        let confidence = 70; // Base confidence
        
        // Length check
        if (text.length > 1000) confidence += 10;
        if (text.length > 2000) confidence += 5;
        
        // Content quality checks
        const hasEmail = /@[\w\.-]+\.\w+/.test(text);
        const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
        const hasName = /^[A-Z][a-z]+\s+[A-Z][a-z]+/m.test(text);
        const hasSkills = skillsTaxonomy.some(skill => 
            text.toLowerCase().includes(skill.toLowerCase())
        );
        
        if (hasEmail) confidence += 5;
        if (hasPhone) confidence += 5;
        if (hasName) confidence += 5;
        if (hasSkills) confidence += 10;
        
        // File type bonus
        if (fileType === 'docx') confidence += 5; // DOCX usually more reliable
        
        return Math.min(95, confidence); // Cap at 95%
    }

    extractPersonalInfo(text) {
        const info = {
            name: '',
            email: '',
            phone: '',
            location: '',
            confidence: {}
        };

        // Extract name using more specific patterns for actual human names
        // Look for patterns like "Name: Yash" or "John Smith" or single names
        const namePatterns = [
            // Look for "Name: Yash" pattern with line terminator
            /Name:\s*([A-Za-z]+(?:\s+[A-Za-z']+){0,2})(?:\r?\n|$)/i,
            // Look for "Name: Yash" pattern without line terminator
            /Name:\s*([A-Za-z]+(?:\s+[A-Za-z']+){0,2})/i,
            // First name only after Name: or at beginning of line
            /^\s*(?:Name:\s*)?([A-Z][a-z]+)\s*(?:\r?\n|$)/m,
            // First name + Last name at beginning of line
            /^\s*([A-Z][a-z]+(?:\s+[A-Z][a-z']+){1,2})\s*(?:\r?\n|$)/m,
            // First name + Middle initial + Last name
            /^\s*([A-Z][a-z]+\s+[A-Z]\.?\s+[A-Z][a-z]+)\s*(?:\r?\n|$)/m,
            // Any capitalized name-like pattern (less strict)
            /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})(?:\r?\n|$)/
        ];
        
        // Try each pattern in order of reliability
        let nameFound = false;
        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match) {
                const potentialName = match[1].trim();
                
                // Check if the potential name contains any role keywords
                const roleKeywords = ["resume", "cv", "developer", "engineer", "software", "professional", 
                                     "profile", "application", "candidate", "job", "position", "senior", "junior"];
                
                const containsRoleKeyword = roleKeywords.some(keyword => 
                    potentialName.toLowerCase().includes(keyword.toLowerCase()));
                
                if (!containsRoleKeyword) {
                    info.name = potentialName;
                    info.confidence.name = pattern === namePatterns[0] ? 98 : 
                                         pattern === namePatterns[1] ? 95 : 
                                         pattern === namePatterns[2] ? 90 : 
                                         pattern === namePatterns[3] ? 85 : 
                                         pattern === namePatterns[4] ? 80 : 
                                         pattern === namePatterns[5] ? 75 : 70;
                    nameFound = true;
                    break;
                }
            }
        }
        
        // Look for contact information section with name
        if (!nameFound) {
            // Match contact information section with Name: format
            const contactSectionMatch = text.match(/Contact\s+Information[\s\S]*?Name:\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i);
            if (contactSectionMatch) {
                info.name = contactSectionMatch[1].trim();
                info.confidence.name = 90;
                nameFound = true;
            }
            
            // Match bullet point format: • Name: Yash
            const bulletNameMatch = text.match(/[•\*]\s*Name:\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,2})(?:\r?\n|$)/i);
            if (!nameFound && bulletNameMatch) {
                info.name = bulletNameMatch[1].trim();
                info.confidence.name = 95;
                nameFound = true;
            }
            
            // Match direct bullet point format: • Yash
            const directBulletMatch = text.match(/[•\*]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})(?:\r?\n|$)/i);
            if (!nameFound && directBulletMatch) {
                const potentialName = directBulletMatch[1].trim();
                // Check if it's not a role keyword
                const roleKeywords = ["resume", "cv", "developer", "engineer", "software", "professional", 
                                     "profile", "application", "candidate", "job", "position", "senior", "junior",
                                     "email", "phone", "location", "linkedin", "github", "portfolio", "contact"];
                
                const containsRoleKeyword = roleKeywords.some(keyword => 
                    potentialName.toLowerCase().includes(keyword.toLowerCase()));
                
                if (!containsRoleKeyword) {
                    info.name = potentialName;
                    info.confidence.name = 90;
                    nameFound = true;
                }
            }
        }
        
        // If no valid name found, use a default
        if (!nameFound) {
            info.name = "John Doe";
            info.confidence.name = 30;
        }

        // Extract email
        const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
            info.email = emailMatch[1].toLowerCase();
            info.confidence.email = 95;
        }

        // Extract phone number
        const phoneMatches = [
            /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
            /(\+1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/,
            /(Phone:?\s*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}))/i
        ];
        
        for (const pattern of phoneMatches) {
            const match = text.match(pattern);
            if (match) {
                info.phone = match[1] || match[2];
                info.confidence.phone = 85;
                break;
            }
        }

        // Extract location
        const locationPatterns = [
            /Location:\s*([A-Za-z\s,]+)$/m,
            /([A-Za-z\s]+,\s*[A-Z]{2})\s*$/m,
            /([A-Za-z\s]+,\s*California|New York|Texas|Florida)/i
        ];
        
        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) {
                info.location = match[1].trim();
                info.confidence.location = 75;
                break;
            }
        }

        return info;
    }

    extractSkills(text) {
        const foundSkills = [];
        const lowerText = text.toLowerCase();
        
        skillsTaxonomy.forEach(skill => {
            const skillLower = skill.toLowerCase();
            if (lowerText.includes(skillLower)) {
                // Check if it's a proper skill mention (not just substring)
                const regex = new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(text)) {
                    foundSkills.push(skill);
                }
            }
        });
        
        return [...new Set(foundSkills)]; // Remove duplicates
    }

    extractExperience(text) {
        // Extract years of experience
        const expPatterns = [
            /(\d+)\+?\s*years?\s+(?:of\s+)?experience/i,
            /(\d+)\+?\s*yrs?\s+(?:of\s+)?experience/i,
            /experience:\s*(\d+)\+?\s*years?/i
        ];
        
        for (const pattern of expPatterns) {
            const match = text.match(pattern);
            if (match) {
                return `${match[1]} years`;
            }
        }
        
        // Try to infer from work history
        const workSections = text.match(/(?:EXPERIENCE|WORK HISTORY|PROFESSIONAL EXPERIENCE)([\s\S]*?)(?:EDUCATION|SKILLS|$)/i);
        if (workSections) {
            const years = workSections[1].match(/20\d{2}/g);
            if (years && years.length >= 2) {
                const startYear = Math.min(...years.map(y => parseInt(y)));
                const endYear = Math.max(...years.map(y => parseInt(y)));
                const experience = Math.max(1, endYear - startYear);
                return `${experience}+ years`;
            }
        }
        
        return 'Not specified';
    }

    extractEducation(text) {
        const educationPatterns = [
            /(Bachelor|Master|PhD|BS|MS|BA|MA|B\.S\.|M\.S\.|B\.A\.|M\.A\.)[\s\S]*?(?=\n\s*\n|\n[A-Z]|$)/gi,
            /EDUCATION:([\s\S]*?)(?:\n\s*\n|$)/i
        ];
        
        for (const pattern of educationPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                return matches[0].trim().substring(0, 100) + '...';
            }
        }
        
        return 'Not specified';
    }
}

// Initialize document parser
const documentParser = new DocumentParser();

// ENHANCED UI UPDATE FUNCTIONS
function updateProcessingStatus(message, type = 'info') {
    const statusEl = document.getElementById('processing-status');
    if (!statusEl) return;
    
    const icons = {
        'processing': 'loader',
        'success': 'check-circle',
        'error': 'x-circle',
        'info': 'info'
    };
    
    statusEl.innerHTML = `
        <div class="status-indicator">
            <i data-lucide="${icons[type]}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add animation for processing state
    if (type === 'processing') {
        statusEl.querySelector('i').style.animation = 'spin 1s linear infinite';
    }
    
    lucide.createIcons();
}

function updateProgressBar(percentage) {
    const progressEl = document.getElementById('upload-progress');
    const fillEl = document.getElementById('progress-fill');
    const textEl = document.getElementById('progress-text');
    
    if (progressEl && fillEl && textEl) {
        progressEl.style.display = 'block';
        fillEl.style.width = `${percentage}%`;
        textEl.textContent = `Processing... ${Math.round(percentage)}%`;
        
        if (percentage >= 100) {
            setTimeout(() => {
                progressEl.style.display = 'none';
            }, 1000);
        }
    }
}

// Database Operations with enhanced validation
const DB = {
    saveJob: (jobData) => {
        try {
            if (!jobData.title || !jobData.description || !jobData.skills.length) {
                throw new Error('Missing required job fields');
            }

            if (jobData.id) {
                const index = appState.jobs.findIndex(j => j.id === jobData.id);
                if (index !== -1) {
                    appState.jobs[index] = { ...appState.jobs[index], ...jobData };
                    showToast('Job updated successfully!', 'success');
                    return appState.jobs[index];
                } else {
                    throw new Error('Job not found for update');
                }
            } else {
                const newJob = {
                    ...jobData,
                    id: generateId(),
                    status: 'Active',
                    created_date: new Date().toISOString().split('T')[0],
                    applications_count: 0
                };
                appState.jobs.push(newJob);
                showToast('Job created successfully!', 'success');
                return newJob;
            }
        } catch (error) {
            showToast(`Error saving job: ${error.message}`, 'error');
            throw error;
        }
    },

    getJobs: (filters = {}) => {
        let filteredJobs = [...appState.jobs];
        
        if (filters.status) {
            filteredJobs = filteredJobs.filter(job => job.status === filters.status);
        }
        
        if (filters.department) {
            filteredJobs = filteredJobs.filter(job => 
                job.department && job.department.toLowerCase().includes(filters.department.toLowerCase())
            );
        }
        
        return filteredJobs;
    },

    deleteJob: (jobId) => {
        try {
            const index = appState.jobs.findIndex(j => j.id === jobId);
            if (index !== -1) {
                appState.jobs.splice(index, 1);
                showToast('Job deleted successfully', 'success');
                return true;
            } else {
                throw new Error('Job not found');
            }
        } catch (error) {
            showToast(`Error deleting job: ${error.message}`, 'error');
            return false;
        }
    },

    // ENHANCED Candidate operations with real data processing
    saveCandidate: (candidateData) => {
        try {
            if (!candidateData.name || !candidateData.email) {
                throw new Error('Name and email are required');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(candidateData.email)) {
                throw new Error('Invalid email format');
            }

            const existingCandidate = appState.candidates.find(c => 
                c.email === candidateData.email && c.id !== candidateData.id
            );
            if (existingCandidate) {
                throw new Error('Candidate with this email already exists');
            }

            if (candidateData.id) {
                const index = appState.candidates.findIndex(c => c.id === candidateData.id);
                if (index !== -1) {
                    appState.candidates[index] = { ...appState.candidates[index], ...candidateData };
                    showToast('Candidate updated successfully!', 'success');
                    
                    if (currentView === 'candidates') {
                        setTimeout(loadCandidates, 100);
                    }
                    
                    return appState.candidates[index];
                } else {
                    throw new Error('Candidate not found for update');
                }
            } else {
                const newCandidate = {
                    ...candidateData,
                    id: generateId(),
                    status: candidateData.status || 'Applied',
                    created_date: new Date().toISOString().split('T')[0],
                    applied_jobs: candidateData.applied_jobs || [],
                    match_scores: candidateData.match_scores || [],
                    extraction_confidence: candidateData.extraction_confidence || {}
                };

                // Calculate match scores for all jobs
                appState.jobs.forEach(job => {
                    const score = calculateMatchScore(newCandidate.skills, job.skills);
                    newCandidate.match_scores.push({
                        job_id: job.id,
                        score: score
                    });
                });

                appState.candidates.push(newCandidate);
                showToast('Candidate saved successfully from real document data! 🎉', 'success');
                
                if (currentView === 'candidates') {
                    setTimeout(loadCandidates, 100);
                }
                
                return newCandidate;
            }
        } catch (error) {
            showToast(`Error saving candidate: ${error.message}`, 'error');
            console.error('Candidate save error:', error);
            throw error;
        }
    },

    getCandidates: (filters = {}) => {
        let filteredCandidates = [...appState.candidates];
        
        if (filters.status) {
            filteredCandidates = filteredCandidates.filter(candidate => 
                candidate.status === filters.status
            );
        }
        
        if (filters.jobId) {
            filteredCandidates = filteredCandidates.filter(candidate => 
                candidate.applied_jobs.includes(parseInt(filters.jobId))
            );
        }
        
        if (filters.skills && filters.skills.length) {
            filteredCandidates = filteredCandidates.filter(candidate => 
                filters.skills.some(skill => candidate.skills.includes(skill))
            );
        }
        
        return filteredCandidates;
    },

    updateCandidateStatus: (candidateId, newStatus) => {
        try {
            const candidate = appState.candidates.find(c => c.id === candidateId);
            if (!candidate) {
                throw new Error('Candidate not found');
            }
            
            candidate.status = newStatus;
            showToast(`Candidate status updated to ${newStatus}`, 'success');
            
            if (currentView === 'candidates') {
                setTimeout(loadCandidates, 100);
            }
            
            return candidate;
        } catch (error) {
            showToast(`Error updating candidate status: ${error.message}`, 'error');
            throw error;
        }
    },

    // Interview operations
    saveInterview: (interviewData) => {
        try {
            if (!interviewData.candidate_id || !interviewData.job_id || !interviewData.datetime) {
                throw new Error('Missing required interview fields');
            }

            const candidate = appState.candidates.find(c => c.id === interviewData.candidate_id);
            const job = appState.jobs.find(j => j.id === interviewData.job_id);
            
            if (!candidate || !job) {
                throw new Error('Invalid candidate or job selected');
            }

            const newInterview = {
                ...interviewData,
                id: generateId(),
                candidate_name: candidate.name,
                job_title: job.title,
                status: 'Scheduled',
                meeting_link: `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`
            };

            appState.interviews.push(newInterview);
            
            DB.updateCandidateStatus(candidate.id, 'Interview Scheduled');
            
            showToast('Interview scheduled successfully!', 'success');
            return newInterview;
        } catch (error) {
            showToast(`Error scheduling interview: ${error.message}`, 'error');
            throw error;
        }
    },

    getInterviews: (filters = {}) => {
        let filteredInterviews = [...appState.interviews];
        
        if (filters.status) {
            filteredInterviews = filteredInterviews.filter(interview => 
                interview.status === filters.status
            );
        }
        
        if (filters.date) {
            filteredInterviews = filteredInterviews.filter(interview => {
                const interviewDate = new Date(interview.datetime).toDateString();
                return interviewDate === filters.date;
            });
        }
        
        return filteredInterviews;
    }
};

// Utility Functions
function generateId() {
    return Date.now() + Math.random();
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

function calculateMatchScore(candidateSkills, jobSkills) {
    if (!candidateSkills || !jobSkills || !candidateSkills.length || !jobSkills.length) {
        return 0;
    }
    
    const matchedSkills = candidateSkills.filter(skill => 
        jobSkills.some(jobSkill => 
            jobSkill.toLowerCase() === skill.toLowerCase()
        )
    );
    
    const score = (matchedSkills.length / jobSkills.length) * 100;
    return Math.round(score);
}

// Enhanced Toast System
function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i data-lucide="${icons[type] || 'info'}" style="width: 20px; height: 20px;"></i>
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
    
    toast.addEventListener('click', () => {
        toast.remove();
    });
}

// Navigation System
function switchView(viewName) {
    console.log('Switching to view:', viewName);
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewName);
    if (targetView) {
        targetView.classList.add('active');
        currentView = viewName;
        loadViewContent(viewName);
    }
}

// Content Loading System
function loadViewContent(viewName) {
    switch(viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'jobs':
            loadJobs();
            break;
        case 'candidates':
            loadCandidates();
            break;
        case 'resume-upload':
            loadResumeUpload();
            break;
        case 'interviews':
            loadInterviews();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Dashboard Functions
function loadDashboard() {
    updateDashboardMetrics();
    setTimeout(() => {
        renderPipelineChart();
        renderRecentApplications();
    }, 100);
}

function updateDashboardMetrics() {
    const jobs = DB.getJobs({ status: 'Active' });
    const candidates = DB.getCandidates();
    const interviews = DB.getInterviews({ status: 'Scheduled' });
    
    const totalJobsEl = document.getElementById('total-jobs');
    const totalCandidatesEl = document.getElementById('total-candidates');
    const scheduledInterviewsEl = document.getElementById('scheduled-interviews');
    const avgMatchScoreEl = document.getElementById('avg-match-score');
    
    if (totalJobsEl) totalJobsEl.textContent = jobs.length;
    if (totalCandidatesEl) totalCandidatesEl.textContent = candidates.length;
    if (scheduledInterviewsEl) scheduledInterviewsEl.textContent = interviews.length;
    
    const allScores = candidates.flatMap(c => c.match_scores.map(s => s.score));
    const avgScore = allScores.length ? 
        Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    
    if (avgMatchScoreEl) avgMatchScoreEl.textContent = avgScore + '%';
}

function renderPipelineChart() {
    const ctx = document.getElementById('pipelineChart');
    if (!ctx) return;
    
    const candidates = DB.getCandidates();
    const statusCounts = candidates.reduce((acc, candidate) => {
        const status = candidate.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    
    if (labels.length === 0) {
        labels.push('No Data');
        data.push(1);
    }
    
    new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
                borderColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

function renderRecentApplications() {
    const container = document.getElementById('recent-applications');
    if (!container) return;
    
    const candidates = DB.getCandidates()
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 8);
    
    if (candidates.length === 0) {
        container.innerHTML = '<div class="empty-state">No recent applications</div>';
        return;
    }
    
    container.innerHTML = candidates.map(candidate => {
        const job = appState.jobs.find(j => candidate.applied_jobs.includes(j.id));
        const matchScore = candidate.match_scores.find(s => s.job_id === job?.id)?.score || 0;
        
        return `
            <div class="recent-application-item">
                <div class="candidate-avatar" style="width: 40px; height: 40px; font-size: 14px;">
                    ${getInitials(candidate.name)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text-high-contrast);">
                        ${candidate.name}
                    </div>
                    <div style="font-size: 12px; color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${job?.title || 'Multiple Positions'}
                    </div>
                </div>
                <div class="match-score" style="font-size: 12px; flex-shrink: 0;">
                    ${matchScore}%
                </div>
            </div>
        `;
    }).join('');
}

// Job Management Functions
function loadJobs() {
    renderJobsGrid();
    populateSkillsSelector();
}

function renderJobsGrid() {
    const container = document.getElementById('jobs-grid');
    if (!container) return;
    
    const jobs = DB.getJobs();
    
    if (jobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="briefcase" style="width: 64px; height: 64px; margin-bottom: 16px; color: var(--color-primary-pink);"></i>
                <h3>No jobs posted yet</h3>
                <p>Create your first job posting to get started</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    container.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-card-title">${job.title}</div>
            <div class="job-card-meta">
                <span><i data-lucide="calendar"></i> ${formatDate(job.created_date)}</span>
                <span><i data-lucide="users"></i> ${job.applications_count} applications</span>
                <span><i data-lucide="briefcase"></i> ${job.experience_level}</span>
                ${job.location ? `<span><i data-lucide="map-pin"></i> ${job.location}</span>` : ''}
            </div>
            <div class="job-card-description">${job.description}</div>
            <div class="job-card-skills">
                ${job.skills.slice(0, 6).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                ${job.skills.length > 6 ? `<span class="skill-tag">+${job.skills.length - 6} more</span>` : ''}
            </div>
            <div class="job-card-actions">
                <button class="btn-secondary" onclick="editJob(${job.id})">
                    <i data-lucide="edit"></i> Edit
                </button>
                <button class="btn-secondary" onclick="viewJobApplications(${job.id})">
                    <i data-lucide="eye"></i> Applications
                </button>
                <button class="btn-secondary" onclick="confirmDeleteJob(${job.id})" style="color: #ef4444;">
                    <i data-lucide="trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function populateSkillsSelector() {
    const container = document.getElementById('skills-selector');
    if (!container) return;
    
    container.innerHTML = skillsTaxonomy.map(skill => `
        <span class="skill-option ${selectedSkills.includes(skill) ? 'selected' : ''}" 
              onclick="toggleSkill('${skill}')">${skill}</span>
    `).join('');
}

function toggleSkill(skill) {
    if (selectedSkills.includes(skill)) {
        selectedSkills = selectedSkills.filter(s => s !== skill);
    } else {
        selectedSkills.push(skill);
    }
    populateSkillsSelector();
}

function showJobForm() {
    editingJob = null;
    selectedSkills = [];
    document.getElementById('job-modal-title').textContent = 'Create New Job';
    document.getElementById('job-form').reset();
    populateSkillsSelector();
    document.getElementById('job-modal').classList.remove('hidden');
}

function editJob(jobId) {
    editingJob = appState.jobs.find(j => j.id === jobId);
    if (!editingJob) return;
    
    selectedSkills = [...editingJob.skills];
    
    document.getElementById('job-modal-title').textContent = 'Edit Job';
    const form = document.getElementById('job-form');
    form.title.value = editingJob.title;
    form.description.value = editingJob.description;
    form.experience_level.value = editingJob.experience_level;
    form.department.value = editingJob.department || '';
    form.location.value = editingJob.location || '';
    
    populateSkillsSelector();
    document.getElementById('job-modal').classList.remove('hidden');
}

function hideJobForm() {
    document.getElementById('job-modal').classList.add('hidden');
    editingJob = null;
    selectedSkills = [];
}

function confirmDeleteJob(jobId) {
    const job = appState.jobs.find(j => j.id === jobId);
    if (!job) return;
    
    showConfirmationModal(
        'Delete Job',
        `Are you sure you want to delete "${job.title}"? This action cannot be undone.`,
        () => {
            DB.deleteJob(jobId);
            renderJobsGrid();
        }
    );
}

function viewJobApplications(jobId) {
    switchView('candidates');
    setTimeout(() => {
        const jobFilter = document.getElementById('job-filter');
        if (jobFilter) {
            jobFilter.value = jobId;
            filterCandidates();
        }
    }, 200);
}

// ENHANCED Candidate Management - FIXED CONTRAST
function loadCandidates() {
    renderCandidatesGrid();
    populateJobFilters();
}

function renderCandidatesGrid(filteredCandidates = null) {
    const container = document.getElementById('candidates-grid');
    if (!container) return;
    
    const candidates = filteredCandidates || DB.getCandidates();
    
    if (candidates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="users" style="width: 64px; height: 64px; margin-bottom: 16px; color: var(--color-primary-pink);"></i>
                <h3>No candidates found</h3>
                <p>Upload resumes or adjust filters to see candidates</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    container.innerHTML = candidates.map(candidate => {
        const appliedJobs = appState.jobs.filter(j => candidate.applied_jobs.includes(j.id));
        const bestMatch = candidate.match_scores.length ? 
            Math.max(...candidate.match_scores.map(s => s.score)) : 0;
        
        return `
            <div class="candidate-card" onclick="showCandidateDetails(${candidate.id})">
                <div class="candidate-header">
                    <div class="candidate-avatar">${getInitials(candidate.name)}</div>
                    <div class="candidate-info">
                        <h3 style="color: var(--color-candidate-name) !important;">${candidate.name}</h3>
                        <div class="candidate-contact">${candidate.email}</div>
                        <div style="font-size: 12px; color: var(--color-text-high-contrast); margin-top: 4px; font-weight: 500;">
                            ${candidate.experience || 'Experience not specified'}
                        </div>
                        ${candidate.extraction_confidence ? `
                            <div style="font-size: 11px; color: var(--color-primary-blue); margin-top: 2px; font-weight: 600;">
                                📄 Parsed from ${candidate.source_document || 'document'}
                            </div>
                        ` : ''}
                    </div>
                    <div class="match-score">${bestMatch}%</div>
                </div>
                <div class="candidate-skills">
                    ${candidate.skills.slice(0, 5).map(skill => 
                        `<span class="skill-tag">${skill}</span>`
                    ).join('')}
                    ${candidate.skills.length > 5 ? `<span class="skill-tag">+${candidate.skills.length - 5}</span>` : ''}
                </div>
                <div class="candidate-footer">
                    <span class="status-badge ${candidate.status.toLowerCase().replace(/\s+/g, '-')}">${candidate.status}</span>
                    <div style="font-size: 12px; color: var(--color-text-high-contrast); font-weight: 500;">
                        Applied: ${formatDate(candidate.created_date)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

function populateJobFilters() {
    const jobFilter = document.getElementById('job-filter');
    if (jobFilter) {
        const jobs = DB.getJobs();
        jobFilter.innerHTML = '<option value="">All Jobs</option>' + 
            jobs.map(job => `<option value="${job.id}">${job.title}</option>`).join('');
    }
    
    // ENHANCED CANDIDATE SELECT - HIGH CONTRAST
    const candidateSelect = document.getElementById('candidate-select');
    if (candidateSelect) {
        const candidates = DB.getCandidates();
        candidateSelect.innerHTML = '<option value="">Select Candidate</option>' + 
            candidates.map(candidate => `<option value="${candidate.id}" style="color: var(--color-text-high-contrast) !important; background: var(--color-bg-high-contrast) !important; font-weight: bold;">${candidate.name} - ${candidate.email}</option>`).join('');
    }
    
    const jobSelect = document.getElementById('job-select');
    if (jobSelect) {
        const jobs = DB.getJobs();
        jobSelect.innerHTML = '<option value="">Select Job</option>' + 
            jobs.map(job => `<option value="${job.id}">${job.title}</option>`).join('');
    }
}

function filterCandidates() {
    const jobFilter = document.getElementById('job-filter');
    const statusFilter = document.getElementById('status-filter');
    
    if (!jobFilter || !statusFilter) return;
    
    const filters = {};
    
    if (jobFilter.value) {
        filters.jobId = parseInt(jobFilter.value);
    }
    
    if (statusFilter.value) {
        filters.status = statusFilter.value;
    }
    
    const filteredCandidates = DB.getCandidates(filters);
    renderCandidatesGrid(filteredCandidates);
}

function refreshCandidatesList() {
    showToast('Refreshing candidates list...', 'info', 1000);
    setTimeout(() => {
        loadCandidates();
        showToast('Candidates list refreshed!', 'success');
    }, 500);
}

function showCandidateDetails(candidateId) {
    const candidate = appState.candidates.find(c => c.id === candidateId);
    if (!candidate) return;
    
    const appliedJobs = appState.jobs.filter(j => candidate.applied_jobs.includes(j.id));
    
    document.getElementById('candidate-modal-title').textContent = candidate.name;
    document.getElementById('candidate-details').innerHTML = `
        <div class="candidate-detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
                <h4 style="margin-bottom: 16px; color: var(--color-text-high-contrast);">Contact Information</h4>
                <div style="background: var(--color-bg-high-contrast); padding: 16px; border-radius: 12px; margin-bottom: 20px; color: var(--color-text-high-contrast);">
                    <p style="margin: 8px 0;"><strong>Email:</strong> ${candidate.email}</p>
                    <p style="margin: 8px 0;"><strong>Phone:</strong> ${candidate.phone || 'Not provided'}</p>
                    <p style="margin: 8px 0;"><strong>Experience:</strong> ${candidate.experience || 'Not specified'}</p>
                    <p style="margin: 8px 0;"><strong>Location:</strong> ${candidate.location || 'Not specified'}</p>
                    ${candidate.education ? `<p style="margin: 8px 0;"><strong>Education:</strong> ${candidate.education}</p>` : ''}
                    ${candidate.extraction_confidence ? `
                        <div style="margin-top: 12px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                            <strong style="color: var(--color-primary-blue);">Document Extraction:</strong><br>
                            <small>Source: ${candidate.source_document || 'Unknown'}</small><br>
                            <small>Confidence: ${JSON.stringify(candidate.extraction_confidence)}</small>
                        </div>
                    ` : ''}
                </div>
                
                <h4 style="margin-bottom: 16px; color: var(--color-text-high-contrast);">Status Management</h4>
                <select class="form-control" onchange="DB.updateCandidateStatus(${candidate.id}, this.value)" style="margin-bottom: 20px;">
                    <option value="Applied" ${candidate.status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Screening" ${candidate.status === 'Screening' ? 'selected' : ''}>Screening</option>
                    <option value="Interview Scheduled" ${candidate.status === 'Interview Scheduled' ? 'selected' : ''}>Interview Scheduled</option>
                    <option value="Offer" ${candidate.status === 'Offer' ? 'selected' : ''}>Offer</option>
                    <option value="Rejected" ${candidate.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
                
                <div style="display: flex; gap: 12px;">
                    <button class="btn-primary" onclick="scheduleInterviewForCandidate(${candidate.id})">
                        <i data-lucide="calendar"></i> Schedule Interview
                    </button>
                    <button class="btn-secondary" onclick="editCandidateInfo(${candidate.id})">
                        <i data-lucide="edit"></i> Edit Info
                    </button>
                </div>
            </div>
            <div>
                <h4 style="margin-bottom: 16px; color: var(--color-text-high-contrast);">Skills & Expertise</h4>
                <div class="candidate-skills" style="margin-bottom: 20px;">
                    ${candidate.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
                
                <h4 style="margin-bottom: 16px; color: var(--color-text-high-contrast);">Job Applications & Match Scores</h4>
                ${appliedJobs.length ? appliedJobs.map(job => {
                    const matchScore = candidate.match_scores.find(s => s.job_id === job.id)?.score || 0;
                    return `
                        <div style="margin-bottom: 12px; padding: 16px; background: var(--color-bg-high-contrast); border-radius: 12px; color: var(--color-text-high-contrast);">
                            <div style="font-weight: 500; margin-bottom: 8px;">${job.title}</div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-size: 12px; color: var(--color-text-secondary);">
                                    ${job.department || 'Unknown Department'}
                                </div>
                                <div class="match-score" style="font-size: 12px;">
                                    ${matchScore}% Match
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') : '<p style="color: var(--color-text-secondary);">No applications yet</p>'}
            </div>
        </div>
    `;
    
    document.getElementById('candidate-modal').classList.remove('hidden');
    lucide.createIcons();
}

function hideCandidateModal() {
    document.getElementById('candidate-modal').classList.add('hidden');
}

function scheduleInterviewForCandidate(candidateId) {
    hideCandidateModal();
    switchView('interviews');
    setTimeout(() => {
        const candidateSelect = document.getElementById('candidate-select');
        if (candidateSelect) {
            candidateSelect.value = candidateId;
        }
        showScheduleModal();
    }, 300);
}

// ENHANCED Resume Upload Functions - REAL PARSING
function loadResumeUpload() {
    setupFileUpload();
    updateProcessingStatus('Ready to process documents', 'success');
}

function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    if (!uploadArea || !fileInput) return;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight(e) {
        uploadArea.classList.remove('dragover');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files));
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFileUpload(files);
    }
}

function handleFileUpload(files) {
    const resultsContainer = document.getElementById('upload-results');
    if (!resultsContainer) return;
    
    // Hide processing tips
    const tips = document.getElementById('processing-tips');
    if (tips) tips.style.display = 'none';
    
    // Filter for only PDF and Word documents
    const validFiles = Array.from(files).filter(file => {
        const fileName = file.name.toLowerCase();
        const isValid = fileName.endsWith('.pdf') || fileName.endsWith('.docx') || fileName.endsWith('.doc');
        
        if (!isValid) {
            showToast(`File ${file.name} is not supported. Only PDF and Word documents are allowed.`, 'error');
        }
        
        return isValid;
    });
    
    if (validFiles.length === 0) {
        updateProcessingStatus('No valid files to process. Please upload PDF or Word documents.', 'error');
        return;
    }
    
    showToast(`Processing ${validFiles.length} file(s)...`, 'info');
    updateProcessingStatus(`Processing ${validFiles.length} document(s)...`, 'processing');
    
    validFiles.forEach((file, index) => {
        setTimeout(() => {
            processRealResume(file, resultsContainer);
        }, index * 1000);
    });
}

// REAL RESUME PROCESSING FUNCTION
async function processRealResume(file, container) {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'upload-result';
    loadingDiv.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div>
                <div style="font-weight: 500; margin-bottom: 4px;">Processing ${file.name}</div>
                <div style="font-size: 12px; color: var(--color-text-secondary);">
                    Extracting text from document...
                </div>
            </div>
        </div>
    `;
    container.appendChild(loadingDiv);
    
    try {
        updateProgressBar(10);
        
        let extractedData;
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.pdf')) {
            extractedData = await documentParser.parsePDF(file);
        } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
            extractedData = await documentParser.parseDOCX(file);
        } else {
            throw new Error('Unsupported file format. Please upload PDF or DOCX files.');
        }
        
        updateProgressBar(90);
        
        // Store extracted text for preview
        const tempId = 'temp_' + generateId();
        extractedTextCache[tempId] = {
            text: extractedData.text,
            confidence: extractedData.confidence,
            filename: file.name,
            source: extractedData.source
        };
        
        // Extract information from real text
        const personalInfo = documentParser.extractPersonalInfo(extractedData.text);
        const skills = documentParser.extractSkills(extractedData.text);
        const experience = documentParser.extractExperience(extractedData.text);
        const education = documentParser.extractEducation(extractedData.text);
        
        updateProgressBar(100);
        
        // Create parsed candidate data
        const parsedData = {
            id: tempId,
            name: personalInfo.name || 'Name not detected',
            email: personalInfo.email || 'Email not detected',
            phone: personalInfo.phone || 'Phone not detected',
            location: personalInfo.location || 'Location not detected',
            experience: experience,
            education: education,
            skills: skills.length ? skills : ['No skills detected'],
            filename: file.name,
            extractionConfidence: extractedData.confidence,
            personalInfoConfidence: personalInfo.confidence,
            source_document: extractedData.source
        };
        
        // Render the results
        loadingDiv.innerHTML = `
            <h3 style="color: var(--color-text-high-contrast);">
                <i data-lucide="check-circle"></i> 
                Document Processed: ${parsedData.name}
            </h3>
            <div style="margin-bottom: 16px; padding: 12px; background: rgba(34, 197, 94, 0.1); border: 2px solid rgba(34, 197, 94, 0.4); border-radius: 8px; color: var(--color-text-high-contrast);">
                <strong>Overall Extraction Confidence:</strong> ${extractedData.confidence}% - ${extractedData.confidence >= 85 ? 'High' : extractedData.confidence >= 70 ? 'Medium' : 'Low'} quality extraction<br>
                <small>Source: ${extractedData.source} document</small>
            </div>
            <div class="parsed-info">
                <div class="info-field">
                    <label>Full Name</label>
                    <div class="value" style="color: var(--color-text-high-contrast); font-weight: bold;">
                        ${parsedData.name}
                        ${personalInfo.confidence.name ? `<span style="font-size: 10px; color: var(--color-primary-blue);"> (${personalInfo.confidence.name}%)</span>` : ''}
                    </div>
                </div>
                <div class="info-field">
                    <label>Email Address</label>
                    <div class="value" style="color: var(--color-text-high-contrast); font-weight: bold;">
                        ${parsedData.email}
                        ${personalInfo.confidence.email ? `<span style="font-size: 10px; color: var(--color-primary-blue);"> (${personalInfo.confidence.email}%)</span>` : ''}
                    </div>
                </div>
                <div class="info-field">
                    <label>Phone Number</label>
                    <div class="value" style="color: var(--color-text-high-contrast); font-weight: bold;">
                        ${parsedData.phone}
                        ${personalInfo.confidence.phone ? `<span style="font-size: 10px; color: var(--color-primary-blue);"> (${personalInfo.confidence.phone}%)</span>` : ''}
                    </div>
                </div>
                <div class="info-field">
                    <label>Experience Level</label>
                    <div class="value" style="color: var(--color-text-high-contrast); font-weight: bold;">${parsedData.experience}</div>
                </div>
                <div class="info-field">
                    <label>Location</label>
                    <div class="value" style="color: var(--color-text-high-contrast); font-weight: bold;">
                        ${parsedData.location}
                        ${personalInfo.confidence.location ? `<span style="font-size: 10px; color: var(--color-primary-blue);"> (${personalInfo.confidence.location}%)</span>` : ''}
                    </div>
                </div>
                <div class="info-field">
                    <label>Education</label>
                    <div class="value" style="color: var(--color-text-high-contrast); font-weight: bold;">${parsedData.education}</div>
                </div>
            </div>
            <div class="info-field" style="grid-column: 1 / -1; margin-top: 16px;">
                <label>Skills Detected (${parsedData.skills.length})</label>
                <div class="candidate-skills" style="margin-top: 8px;">
                    ${parsedData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            <div style="margin-top: 24px;">
                <h4 style="margin-bottom: 12px; color: var(--color-text-high-contrast);">Job Match Analysis</h4>
                <div id="job-matches-${parsedData.id}"></div>
            </div>
            <div style="margin-top: 24px; display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="btn-primary" onclick="saveParsedCandidate('${parsedData.id}')">
                    <i data-lucide="save"></i> Save as Candidate
                </button>
                <button class="btn-secondary" onclick="showTextPreview('${parsedData.id}')">
                    <i data-lucide="eye"></i> View Extracted Text
                </button>
                <button class="btn-secondary" onclick="showDetailedMatching('${parsedData.id}')">
                    <i data-lucide="target"></i> Detailed Matching
                </button>
            </div>
        `;
        
        // Store parsed data temporarily
        window.parsedCandidates = window.parsedCandidates || {};
        window.parsedCandidates[parsedData.id] = parsedData;
        
        // Show job matches
        showJobMatchesForCandidate(parsedData);
        
        lucide.createIcons();
        updateProcessingStatus(`Successfully processed ${parsedData.name}'s resume`, 'success');
        showToast(`Real data extracted from ${parsedData.name}'s resume! 🎉`, 'success');
        
    } catch (error) {
        console.error('Resume processing error:', error);
        loadingDiv.innerHTML = `
            <h3 style="color: #ef4444;">
                <i data-lucide="x-circle"></i> 
                Error Processing Resume
            </h3>
            <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border: 2px solid rgba(239, 68, 68, 0.4); border-radius: 8px; color: var(--color-text-high-contrast);">
                <strong>Error:</strong> ${error.message}<br>
                <small>Please ensure the file is a valid PDF or DOCX document with readable text.</small>
            </div>
            <div style="margin-top: 16px;">
                <button class="btn-secondary" onclick="this.parentElement.parentElement.remove()">
                    <i data-lucide="x"></i> Remove
                </button>
            </div>
        `;
        lucide.createIcons();
        updateProcessingStatus(`Error processing resume`, 'error');
        showToast(`Failed to process resume: ${error.message}`, 'error');
    }
}

// ENHANCED TEXT PREVIEW MODAL
function showTextPreview(candidateId) {
    const extractedData = extractedTextCache[candidateId];
    if (!extractedData) {
        showToast('Extracted text not available', 'error');
        return;
    }
    
    document.getElementById('preview-modal-title').textContent = `Text Preview: ${extractedData.filename}`;
    document.getElementById('extraction-confidence').textContent = `${extractedData.confidence}% (${extractedData.source})`;
    document.getElementById('preview-text-content').textContent = extractedData.text;
    
    currentFileBeingProcessed = candidateId;
    document.getElementById('text-preview-modal').classList.remove('hidden');
}

function hideTextPreviewModal() {
    document.getElementById('text-preview-modal').classList.add('hidden');
    currentFileBeingProcessed = null;
}

function proceedWithExtraction() {
    hideTextPreviewModal();
    if (currentFileBeingProcessed) {
        showToast('Text extraction confirmed - proceed with saving candidate', 'success');
    }
}

function showJobMatchesForCandidate(candidateData) {
    const container = document.getElementById(`job-matches-${candidateData.id}`);
    if (!container) return;
    
    const jobs = DB.getJobs();
    const matches = jobs.map(job => ({
        job,
        score: calculateMatchScore(candidateData.skills, job.skills),
        matchedSkills: candidateData.skills.filter(skill => job.skills.some(jobSkill => 
            jobSkill.toLowerCase() === skill.toLowerCase()
        )),
        missingSkills: job.skills.filter(skill => !candidateData.skills.some(candSkill => 
            candSkill.toLowerCase() === skill.toLowerCase()
        ))
    })).sort((a, b) => b.score - a.score);
    
    container.innerHTML = matches.slice(0, 3).map(match => `
        <div style="margin-bottom: 12px; padding: 16px; background: var(--color-bg-high-contrast); border-radius: 12px; color: var(--color-text-high-contrast);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div style="font-weight: 500;">${match.job.title}</div>
                <div class="match-score" style="font-size: 14px;">${match.score}%</div>
            </div>
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 8px;">
                ${match.job.department || 'Unknown Department'} • ${match.job.location || 'Location TBD'}
            </div>
            <div style="display: flex; gap: 16px; font-size: 12px;">
                <div>
                    <strong style="color: #10b981;">Matched (${match.matchedSkills.length}):</strong> ${match.matchedSkills.slice(0, 3).join(', ')}${match.matchedSkills.length > 3 ? '...' : ''}
                </div>
                <div>
                    <strong style="color: #f59e0b;">Missing (${match.missingSkills.length}):</strong> ${match.missingSkills.slice(0, 3).join(', ')}${match.missingSkills.length > 3 ? '...' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// ENHANCED Save Candidate Function with Real Data
function saveParsedCandidate(candidateId) {
    const candidateData = window.parsedCandidates[candidateId];
    if (!candidateData) {
        showToast('Error: Candidate data not found', 'error');
        return;
    }
    
    try {
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div> Saving Real Data...';
        button.disabled = true;
        
        setTimeout(() => {
            const savedCandidate = DB.saveCandidate({
                name: candidateData.name,
                email: candidateData.email,
                phone: candidateData.phone,
                skills: candidateData.skills,
                experience: candidateData.experience,
                location: candidateData.location,
                education: candidateData.education,
                status: 'Applied',
                source_document: candidateData.source_document,
                extraction_confidence: candidateData.personalInfoConfidence,
                filename: candidateData.filename
            });
            
            if (savedCandidate) {
                button.innerHTML = '<i data-lucide="check"></i> Saved Real Data Successfully!';
                button.style.background = '#10b981';
                
                delete window.parsedCandidates[candidateId];
                delete extractedTextCache[candidateId];
                
                showToast(`Real candidate data from ${candidateData.filename} saved successfully! 🚀`, 'success', 6000);
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.style.background = '';
                    lucide.createIcons();
                }, 2000);
            }
        }, 1000);
        
    } catch (error) {
        showToast(`Failed to save candidate: ${error.message}`, 'error');
    }
}

function showDetailedMatching(candidateId) {
    const candidateData = window.parsedCandidates[candidateId];
    if (!candidateData) return;
    
    showToast(`Detailed skill analysis: ${candidateData.skills.length} skills detected from real document text`, 'info', 5000);
}

// Interview Functions
function loadInterviews() {
    renderCalendar();
    renderUpcomingInterviews();
    populateJobFilters();
}

function renderCalendar() {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const currentMonthElement = document.getElementById('current-month');
    if (currentMonthElement) {
        currentMonthElement.textContent = 
            `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    }
    
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    calendarGrid.innerHTML = weekdays.map(day => 
        `<div class="calendar-weekday">${day}</div>`
    ).join('');
    
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
        const isToday = date.toDateString() === new Date().toDateString();
        const hasInterview = appState.interviews.some(interview => {
            const interviewDate = new Date(interview.datetime);
            return interviewDate.toDateString() === date.toDateString();
        });
        
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasInterview ? 'has-interview' : ''}`;
        dayElement.textContent = date.getDate();
        dayElement.onclick = () => selectCalendarDate(date);
        
        calendarGrid.appendChild(dayElement);
    }
}

function selectCalendarDate(date) {
    const dateString = date.toISOString().slice(0, 16);
    const datetimeInput = document.querySelector('input[name="datetime"]');
    if (datetimeInput) {
        datetimeInput.value = dateString;
    }
    showScheduleModal();
}

function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

function renderUpcomingInterviews() {
    const container = document.getElementById('upcoming-interviews');
    if (!container) return;
    
    const upcomingInterviews = appState.interviews.filter(interview => 
        new Date(interview.datetime) > new Date()
    ).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    
    if (upcomingInterviews.length === 0) {
        container.innerHTML = '<div class="empty-state" style="padding: 20px; text-align: center;">No upcoming interviews</div>';
        return;
    }
    
    container.innerHTML = upcomingInterviews.map(interview => {
        const candidate = appState.candidates.find(c => c.id === interview.candidate_id);
        const job = appState.jobs.find(j => j.id === interview.job_id);
        const date = new Date(interview.datetime);
        
        return `
            <div class="interview-item">
                <h4 style="color: var(--color-text-high-contrast) !important; font-weight: bold;">${candidate?.name || 'Unknown Candidate'}</h4>
                <div class="interview-meta">
                    <span><i data-lucide="briefcase"></i> ${job?.title || 'Unknown Position'}</span>
                    <span><i data-lucide="calendar"></i> ${formatDate(interview.datetime)}</span>
                    <span><i data-lucide="clock"></i> ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span><i data-lucide="user"></i> ${interview.interviewer}</span>
                    <span><i data-lucide="video"></i> ${interview.interview_type}</span>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button class="btn-secondary" style="font-size: 12px; padding: 6px 12px;" 
                            onclick="window.open('${interview.meeting_link}', '_blank')">
                        <i data-lucide="external-link"></i> Join Meeting
                    </button>
                    <button class="btn-secondary" style="font-size: 12px; padding: 6px 12px;" 
                            onclick="editInterview(${interview.id})">
                        <i data-lucide="edit"></i> Edit
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

function showScheduleModal() {
    document.getElementById('schedule-modal').classList.remove('hidden');
}

function hideScheduleModal() {
    document.getElementById('schedule-modal').classList.add('hidden');
    const form = document.getElementById('schedule-form');
    if (form) form.reset();
}

function editInterview(interviewId) {
    showToast('Interview editing feature coming soon!', 'info');
}

// Analytics Functions
function loadAnalytics() {
    setTimeout(() => {
        renderSkillsChart();
        renderSourcesChart();
        renderScoresChart();
        renderTimelineChart();
    }, 200);
}

function renderSkillsChart() {
    const ctx = document.getElementById('skillsChart');
    if (!ctx) return;
    
    const candidates = DB.getCandidates();
    const skillCounts = {};
    
    candidates.forEach(candidate => {
        candidate.skills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
        });
    });
    
    const topSkills = Object.entries(skillCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    if (topSkills.length === 0) {
        topSkills.push(['No Data', 1]);
    }
    
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: topSkills.map(([skill]) => skill),
            datasets: [{
                label: 'Candidates with Skill',
                data: topSkills.map(([,count]) => count),
                backgroundColor: '#1FB8CD',
                borderColor: '#1FB8CD',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderSourcesChart() {
    const ctx = document.getElementById('sourcesChart');
    if (!ctx) return;
    
    const sources = ['Resume Upload', 'LinkedIn', 'Job Boards', 'Referrals', 'Direct Apply'];
    const sourceCounts = [
        DB.getCandidates().length, // All current candidates from resume upload
        Math.floor(Math.random() * 20) + 5, // Mock data for other sources
        Math.floor(Math.random() * 15) + 5,
        Math.floor(Math.random() * 10) + 2,
        Math.floor(Math.random() * 8) + 2
    ];
    
    new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: {
            labels: sources,
            datasets: [{
                data: sourceCounts,
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
                borderColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                }
            }
        }
    });
}

function renderScoresChart() {
    const ctx = document.getElementById('scoresChart');
    if (!ctx) return;
    
    const candidates = DB.getCandidates();
    const allScores = [];
    
    candidates.forEach(candidate => {
        candidate.match_scores.forEach(score => {
            allScores.push(score.score);
        });
    });
    
    const scoreBuckets = ['0-20', '21-40', '41-60', '61-80', '81-100'];
    const bucketCounts = [0, 0, 0, 0, 0];
    
    if (allScores.length === 0) {
        bucketCounts[2] = 1;
    } else {
        allScores.forEach(score => {
            if (score <= 20) bucketCounts[0]++;
            else if (score <= 40) bucketCounts[1]++;
            else if (score <= 60) bucketCounts[2]++;
            else if (score <= 80) bucketCounts[3]++;
            else bucketCounts[4]++;
        });
    }
    
    new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: scoreBuckets,
            datasets: [{
                label: 'Number of Match Scores',
                data: bucketCounts,
                backgroundColor: '#FFC185',
                borderColor: '#FFC185',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function renderTimelineChart() {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const applications = [12, 18, 25, 22, 35, 28, 42, DB.getCandidates().length];
    const hires = [2, 3, 5, 4, 8, 6, 10, Math.floor(applications[7] * 0.2)];
    
    new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Applications',
                    data: applications,
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Hires',
                    data: hires,
                    borderColor: '#B4413C',
                    backgroundColor: 'rgba(180, 65, 60, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

// Confirmation Modal
function showConfirmationModal(title, message, callback) {
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;
    confirmationCallback = callback;
    document.getElementById('confirmation-modal').classList.remove('hidden');
}

function hideConfirmationModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    confirmationCallback = null;
}

function confirmAction() {
    if (confirmationCallback) {
        confirmationCallback();
    }
    hideConfirmationModal();
}

// Theme Toggle Functionality
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.body.classList.add('dark-mode');
    }
    
    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Save preference
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}

// Parallax and Smooth Scrolling Effects
function initializeParallaxEffects() {
    // Add parallax effect to cards and sections
    const parallaxElements = document.querySelectorAll('.glass-card, .metric-card');
    
    window.addEventListener('scroll', function() {
        parallaxElements.forEach(element => {
            const position = element.getBoundingClientRect();
            
            // Only apply effect when element is in viewport
            if (position.top < window.innerHeight && position.bottom > 0) {
                const scrollPosition = window.scrollY;
                const offset = scrollPosition * 0.05;
                
                // Apply subtle parallax transform
                element.style.transform = `translateY(${offset * 0.5}px)`;
            }
        });
    });
    
    // Add smooth scrolling to all internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Event Listeners and Initialization
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = item.dataset.view;
            if (viewName && viewName !== currentView) {
                switchView(viewName);
            }
        });
    });
    
    // Initialize theme toggle
    initializeThemeToggle();
    
    // Initialize parallax and smooth scrolling effects
    initializeParallaxEffects();
    
    // Job form submission
    const jobForm = document.getElementById('job-form');
    if (jobForm) {
        jobForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (selectedSkills.length === 0) {
                showToast('Please select at least one required skill', 'error');
                return;
            }
            
            const formData = new FormData(this);
            const jobData = {
                title: formData.get('title'),
                description: formData.get('description'),
                skills: [...selectedSkills],
                experience_level: formData.get('experience_level'),
                department: formData.get('department'),
                location: formData.get('location')
            };
            
            if (editingJob) {
                jobData.id = editingJob.id;
            }
            
            try {
                DB.saveJob(jobData);
                hideJobForm();
                renderJobsGrid();
            } catch (error) {
                console.error('Job save error:', error);
            }
        });
    }
    
    // Schedule form submission
    const scheduleForm = document.getElementById('schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const interviewData = {
                candidate_id: parseInt(formData.get('candidate_id')),
                job_id: parseInt(formData.get('job_id')),
                datetime: formData.get('datetime'),
                interviewer: formData.get('interviewer'),
                interview_type: formData.get('interview_type')
            };
            
            try {
                DB.saveInterview(interviewData);
                hideScheduleModal();
                renderCalendar();
                renderUpcomingInterviews();
            } catch (error) {
                console.error('Interview save error:', error);
            }
        });
    }
    
    // Filter event listeners
    const jobFilter = document.getElementById('job-filter');
    const statusFilter = document.getElementById('status-filter');
    
    if (jobFilter) jobFilter.addEventListener('change', filterCandidates);
    if (statusFilter) statusFilter.addEventListener('change', filterCandidates);
    
    // Initialize temporary candidate storage
    window.parsedCandidates = {};
    
    // Load initial dashboard view
    loadViewContent('dashboard');
    
    // Show welcome message
    setTimeout(() => {
        showToast('Welcome to HireAI Pro with Real Document Parsing! 🚀', 'success');
    }, 1000);
});