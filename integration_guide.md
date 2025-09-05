# AI Hiring Management System - Integration Guide

## Overview
This document provides step-by-step instructions to integrate and deploy the complete AI Hiring Management System with LinkedIn and Google Calendar APIs.

## Project Structure
```
ai-hiring-system/
├── backend/
│   ├── fixed_main.py                    # Main FastAPI server
│   ├── fixed_enhanced_resume_parser.py  # Resume parsing module
│   ├── fixed_enhanced_scheduler.py      # Calendar/LinkedIn integration  
│   ├── enhanced_skill_matcher.py        # Skill matching engine
│   ├── enhanced_database.py             # Database management
│   ├── models.py                        # Data models
│   ├── config.py                        # Configuration management
│   └── requirements.txt                 # Python dependencies
├── frontend/
│   ├── index.html                       # Main HTML interface
│   ├── fixed_app.js                     # Fixed JavaScript with API calls
│   ├── style.css                        # UI styling
│   └── package.json                     # Frontend dependencies
├── config/
│   ├── .env.template                    # Environment variables template
│   ├── credentials.json.template        # Google API credentials template
│   └── deploy.sh                        # Deployment script
├── data/                                # Database and uploads
│   ├── backups/                         # Database backups
│   └── hiring_system.db                 # SQLite database
└── uploads/                             # Resume file storage
```

## Integration Fixes Applied

### 1. Backend API Integration
- **Fixed CORS Configuration**: Proper cross-origin resource sharing setup
- **Real API Endpoints**: All frontend JavaScript now makes actual API calls
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **File Upload**: Real resume parsing with PDF/DOCX support
- **Database Integration**: Persistent data storage with backups

### 2. Frontend-Backend Communication  
- **API Client Class**: Centralized API communication with error handling
- **Loading States**: Real-time loading indicators and progress bars
- **Error Notifications**: User-friendly error messages and success feedback
- **Data Synchronization**: Real-time UI updates from backend responses

### 3. External API Integration
- **Google Calendar API**: OAuth 2.0 flow for calendar integration
- **LinkedIn API**: Ready for LinkedIn partner program approval
- **Email Notifications**: Gmail API and SMTP fallback for notifications

### 4. Configuration Management
- **Environment Variables**: Secure configuration with .env file
- **Credentials Management**: Template files for API credentials
- **Deployment Scripts**: Automated setup and deployment

## Setup Instructions

### Step 1: Environment Setup
1. Create project directory and copy all files
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Download spaCy model: `python -m spacy download en_core_web_sm`

### Step 2: API Credentials Setup
1. **Google Calendar API**: Get credentials from Google Cloud Console
2. **LinkedIn API**: Apply to LinkedIn Partner Program (optional)
3. **Email**: Configure Gmail app password for notifications

### Step 3: Configuration
1. Copy .env.template to .env
2. Fill in your API credentials in .env file
3. Copy credentials.json.template to credentials.json
4. Add your Google API credentials

### Step 4: Launch Application
1. Create directories: `mkdir -p data/backups uploads static`
2. Copy frontend files: `cp index.html static/` etc.
3. Start server: `python fixed_main.py`
4. Access at: http://localhost:8000/app

## Key Improvements Made

1. **Fixed Import Issues**: All modules now import correctly
2. **Real API Integration**: Frontend actually calls backend APIs
3. **Error Handling**: Graceful error handling throughout
4. **Configuration Management**: Environment-based configuration
5. **External API Integration**: Google Calendar and LinkedIn ready
6. **File Processing**: Real resume parsing with multiple formats
7. **Database Persistence**: Data is properly saved and loaded
8. **CORS Configuration**: Frontend-backend communication works
9. **Deployment Ready**: Production-ready deployment scripts

## Troubleshooting Common Issues

### ModuleNotFoundError
- Ensure virtual environment is activated
- Install all dependencies: `pip install -r requirements.txt`
- Check that all .py files are in the same directory

### CORS Errors
- Verify CORS middleware is enabled
- Check allowed origins in configuration
- Ensure frontend makes requests to correct API URL

### File Upload Issues
- Check file permissions on uploads directory
- Verify file size limits (max 10MB)
- Ensure supported file types (PDF, DOCX, DOC)

### API Integration Issues
- Check .env configuration
- Verify API credentials are valid
- Test backend health endpoint first

Ready for production deployment with proper security configuration.
