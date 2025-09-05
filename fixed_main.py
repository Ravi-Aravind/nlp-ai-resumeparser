
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import aiofiles
import json
import os
from datetime import datetime, timedelta
import uuid
import logging
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import modules with error handling
try:
    from config import settings
except ImportError:
    logger.warning("Config module not found, using defaults")
    class Settings:
        environment = "development"
        api_host = "0.0.0.0"
        api_port = 8000
        allowed_origins = "http://localhost:3000,http://localhost:8080,http://127.0.0.1:3000"
        upload_dir = "./uploads"
        max_file_size = 10485760

        @property
        def cors_origins(self):
            return [origin.strip() for origin in self.allowed_origins.split(",")]

    settings = Settings()

# Import custom modules with error handling
modules_available = {}

try:
    from fixed_enhanced_resume_parser import EnhancedResumeParser
    modules_available['resume_parser'] = True
    logger.info("✅ Enhanced resume parser loaded")
except ImportError as e:
    modules_available['resume_parser'] = False
    logger.warning(f"⚠️ Resume parser not available: {e}")

try:
    from enhanced_skill_matcher import EnhancedSkillMatcher
    modules_available['skill_matcher'] = True
    logger.info("✅ Skill matcher loaded")
except ImportError as e:
    modules_available['skill_matcher'] = False
    logger.warning(f"⚠️ Skill matcher not available: {e}")

try:
    from enhanced_database import EnhancedDatabaseManager
    modules_available['database'] = True
    logger.info("✅ Database manager loaded")
except ImportError as e:
    modules_available['database'] = False
    logger.warning(f"⚠️ Database manager not available: {e}")

try:
    from fixed_enhanced_scheduler import EnhancedInterviewScheduler
    modules_available['scheduler'] = True
    logger.info("✅ Interview scheduler loaded")
except ImportError as e:
    modules_available['scheduler'] = False
    logger.warning(f"⚠️ Interview scheduler not available: {e}")

try:
    from models import Candidate, Job, Interview
    modules_available['models'] = True
    logger.info("✅ Data models loaded")
except ImportError as e:
    modules_available['models'] = False
    logger.warning(f"⚠️ Data models not available: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="AI Hiring Management System",
    description="Complete hiring management system with AI-powered features",
    version="2.1.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins + ["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
services = {}

if modules_available['database']:
    services['db'] = EnhancedDatabaseManager()
else:
    services['db'] = None

if modules_available['resume_parser']:
    services['resume_parser'] = EnhancedResumeParser()
else:
    services['resume_parser'] = None

if modules_available['skill_matcher']:
    services['skill_matcher'] = EnhancedSkillMatcher()
else:
    services['skill_matcher'] = None

if modules_available['scheduler']:
    services['scheduler'] = EnhancedInterviewScheduler()
else:
    services['scheduler'] = None

# Global application state
app_state = {
    "candidates": [],
    "jobs": [],
    "interviews": [],
    "match_scores": {},
    "next_id": 1,
    "initialized": False
}

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    try:
        logger.info("🚀 Starting AI Hiring Management System...")

        # Create necessary directories
        os.makedirs("uploads", exist_ok=True)
        os.makedirs("data", exist_ok=True)
        os.makedirs("data/backups", exist_ok=True)
        os.makedirs("static", exist_ok=True)

        # Initialize database
        if services['db']:
            await services['db'].initialize()
            app_state.update(await services['db'].load_all_data())
            logger.info("📊 Database initialized")

        # Initialize scheduler
        if services['scheduler']:
            await services['scheduler'].initialize()
            logger.info("📅 Scheduler initialized")

        # Ensure sample data exists
        if not app_state["jobs"]:
            await _seed_sample_data()

        app_state["initialized"] = True
        logger.info("✅ Application startup complete")

    except Exception as e:
        logger.error(f"❌ Startup error: {str(e)}")
        logger.error(traceback.format_exc())

@app.on_event("shutdown") 
async def shutdown_event():
    """Cleanup on shutdown"""
    try:
        if services['db']:
            await services['db'].save_all_data(app_state)
            await services['db'].close()
        logger.info("✅ Application shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")

# Static file serving
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Health check endpoint
@app.get("/health")
async def health_check():
    """System health check with module status"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.1.0",
        "modules_available": modules_available,
        "data_stats": {
            "candidates": len(app_state["candidates"]),
            "jobs": len(app_state["jobs"]),
            "interviews": len(app_state["interviews"])
        },
        "initialized": app_state["initialized"]
    }

# Serve frontend application
@app.get("/app", response_class=HTMLResponse)
async def serve_app():
    """Serve the frontend application"""
    try:
        if os.path.exists("static/index.html"):
            with open("static/index.html", "r", encoding="utf-8") as f:
                return f.read()
        elif os.path.exists("index.html"):
            with open("index.html", "r", encoding="utf-8") as f:
                return f.read()
        else:
            return HTMLResponse("""
                <html>
                    <body>
                        <h1>AI Hiring Management System</h1>
                        <p>Frontend files not found. Please copy index.html to static/ directory.</p>
                        <p>API Documentation: <a href="/docs">Click here</a></p>
                    </body>
                </html>
            """)
    except Exception as e:
        logger.error(f"Error serving app: {e}")
        return HTMLResponse(f"<h1>Error loading application: {str(e)}</h1>")

@app.get("/")
async def root():
    """API information"""
    return {
        "name": "AI Hiring Management System API",
        "version": "2.1.0",
        "status": "active",
        "frontend_url": "/app",
        "docs_url": "/docs",
        "modules": modules_available,
        "endpoints": {
            "health": "/health",
            "frontend": "/app",
            "api_docs": "/docs",
            "upload_resume": "/api/resumes/upload",
            "candidates": "/api/candidates",
            "jobs": "/api/jobs",
            "interviews": "/api/interviews",
            "dashboard": "/api/analytics/dashboard"
        }
    }

# Resume upload and parsing
@app.post("/api/resumes/upload")
async def upload_resume(
    file: UploadFile = File(...),
    job_id: Optional[str] = Form(None)
):
    """Upload and parse resume with comprehensive error handling"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        allowed_extensions = ['.pdf', '.docx', '.doc']
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )

        if hasattr(file, 'size') and file.size and file.size > settings.max_file_size:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        logger.info(f"📄 Processing resume: {file.filename}")

        # Save uploaded file
        file_id = str(uuid.uuid4())
        file_path = os.path.join(settings.upload_dir, f"{file_id}{file_extension}")

        content = await file.read()
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        logger.info(f"💾 File saved: {file_path}")

        # Parse resume if parser is available
        parsed_data = {}
        if services['resume_parser']:
            try:
                parsed_data = await services['resume_parser'].parse_resume(file_path)
                logger.info(f"🧠 Resume parsed: {parsed_data.get('name', 'Unknown')}")
            except Exception as e:
                logger.error(f"Parsing error: {e}")
                # Use fallback parsing
                parsed_data = _fallback_resume_parse(content, file.filename)
        else:
            # Fallback parsing without advanced features
            parsed_data = _fallback_resume_parse(content, file.filename)

        # Create candidate record
        candidate_id = get_next_id()
        candidate = {
            "id": candidate_id,
            "name": parsed_data.get("name") or "Unknown Candidate",
            "email": parsed_data.get("email"),
            "phone": parsed_data.get("phone"), 
            "skills": parsed_data.get("skills", []),
            "experience": parsed_data.get("experience"),
            "education": parsed_data.get("education"),
            "work_history": parsed_data.get("work_history", []),
            "location": parsed_data.get("location"),
            "status": "Applied",
            "applied_jobs": [int(job_id)] if job_id else [],
            "match_scores": [],
            "resume_file_path": file_path,
            "original_filename": file.filename,
            "created_date": datetime.now().isoformat(),
            "updated_date": datetime.now().isoformat(),
            "confidence_scores": parsed_data.get("confidence_scores", {}),
            "raw_text": parsed_data.get("raw_text", "")[:500]  # Limit raw text
        }

        # Save candidate
        app_state["candidates"].append(candidate)

        if services['db']:
            await services['db'].save_candidate(candidate)

        logger.info(f"✅ Candidate created: {candidate['name']} (ID: {candidate_id})")

        return {
            "success": True,
            "message": "Resume uploaded and parsed successfully",
            "candidate": candidate,
            "parsing_confidence": parsed_data.get("confidence_scores", {}).get("overall", 0.0)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

def _fallback_resume_parse(content, filename):
    """Fallback parsing when advanced parser is not available"""
    try:
        # Try to decode text content
        if isinstance(content, bytes):
            text = content.decode('utf-8', errors='ignore')
        else:
            text = str(content)

        # Simple extraction
        import re

        # Extract email
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        email = email_match.group(0).lower() if email_match else None

        # Extract phone
        phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        phone = phone_match.group(0) if phone_match else None

        # Extract name (first line that looks like a name)
        lines = text.split('\n')[:10]
        name = None
        for line in lines:
            line = line.strip()
            if len(line) > 0 and len(line) < 50:
                words = line.split()
                if 1 <= len(words) <= 3 and all(word[0].isupper() for word in words if word):
                    name = line
                    break

        # Basic skills extraction
        basic_skills = ["Python", "JavaScript", "React", "Node.js", "SQL", "AWS", "Docker", "Git"]
        found_skills = []
        text_lower = text.lower()
        for skill in basic_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)

        return {
            "name": name or "Unknown",
            "email": email,
            "phone": phone,
            "skills": found_skills,
            "experience": None,
            "education": None,
            "work_history": [],
            "location": None,
            "raw_text": text[:500],
            "confidence_scores": {"overall": 0.3}  # Low confidence for basic parsing
        }

    except Exception as e:
        logger.error(f"Fallback parsing error: {e}")
        return {
            "name": "Unknown",
            "email": None,
            "phone": None,
            "skills": [],
            "experience": None,
            "education": None,
            "work_history": [],
            "location": None,
            "raw_text": "",
            "confidence_scores": {"overall": 0.0}
        }

# Candidate management endpoints
@app.get("/api/candidates")
async def get_candidates(
    job_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get candidates with filtering"""
    try:
        candidates = app_state["candidates"].copy()

        # Apply filters
        if job_id:
            candidates = [c for c in candidates if job_id in c.get("applied_jobs", [])]
        if status:
            candidates = [c for c in candidates if c.get("status") == status]

        # Sort by created date
        candidates.sort(key=lambda x: x.get("created_date", ""), reverse=True)

        # Pagination
        paginated = candidates[skip:skip+limit]

        logger.info(f"📋 Retrieved {len(paginated)} candidates")

        return {
            "candidates": paginated,
            "total": len(candidates),
            "page": skip // limit + 1 if limit > 0 else 1,
            "pages": (len(candidates) - 1) // limit + 1 if limit > 0 else 1
        }

    except Exception as e:
        logger.error(f"Error getting candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/candidates/{candidate_id}")
async def get_candidate(candidate_id: int):
    """Get specific candidate"""
    try:
        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        return candidate

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting candidate {candidate_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Job management endpoints
@app.get("/api/jobs")
async def get_jobs():
    """Get all jobs with application counts"""
    try:
        jobs = app_state["jobs"].copy()

        # Add calculated fields
        for job in jobs:
            applications_count = len([c for c in app_state["candidates"] 
                                   if job["id"] in c.get("applied_jobs", [])])
            job["applications_count"] = applications_count

        jobs.sort(key=lambda x: x.get("created_date", ""), reverse=True)

        return {
            "jobs": jobs,
            "total": len(jobs)
        }

    except Exception as e:
        logger.error(f"Error getting jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/jobs")
async def create_job(job_data: dict):
    """Create new job posting"""
    try:
        # Validation
        required_fields = ["title", "description", "experience_level"]
        for field in required_fields:
            if not job_data.get(field):
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Create job record
        job_id = get_next_id()
        job = {
            "id": job_id,
            "title": job_data["title"],
            "description": job_data["description"],
            "skills": job_data.get("skills", []),
            "experience_level": job_data["experience_level"],
            "department": job_data.get("department", ""),
            "location": job_data.get("location", ""),
            "salary_range": job_data.get("salary_range", ""),
            "status": "Active",
            "created_date": datetime.now().isoformat(),
            "applications_count": 0
        }

        # Save job
        app_state["jobs"].append(job)

        if services['db']:
            await services['db'].save_job(job)

        logger.info(f"💼 Job created: {job['title']} (ID: {job_id})")

        return {
            "success": True,
            "message": "Job created successfully",
            "job": job
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Interview scheduling endpoints
@app.post("/api/interviews")
async def schedule_interview(interview_data: dict):
    """Schedule interview with calendar integration"""
    try:
        # Validation
        required_fields = ["candidate_id", "job_id", "interviewer", "datetime", "interview_type"]
        for field in required_fields:
            if field not in interview_data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")

        candidate_id = interview_data["candidate_id"]
        job_id = interview_data["job_id"]

        # Find candidate and job
        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)
        job = next((j for j in app_state["jobs"] if j["id"] == job_id), None)

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Create interview record
        interview_id = get_next_id()
        interview = {
            "id": interview_id,
            "candidate_id": candidate_id,
            "job_id": job_id,
            "candidate_name": candidate["name"],
            "job_title": job["title"],
            "interviewer": interview_data["interviewer"],
            "datetime": interview_data["datetime"],
            "interview_type": interview_data["interview_type"],
            "duration": interview_data.get("duration", 60),
            "location": interview_data.get("location", "Virtual"),
            "status": "Scheduled",
            "notes": interview_data.get("notes", ""),
            "created_date": datetime.now().isoformat(),
            "meeting_link": f"https://meet.google.com/placeholder-{interview_id}"
        }

        # Schedule with external calendar if available
        if services['scheduler']:
            try:
                enhanced_interview_data = {
                    **interview,
                    "candidate_email": candidate.get("email")
                }
                await services['scheduler'].schedule_interview(enhanced_interview_data)
                logger.info("📅 Calendar event created")
            except Exception as e:
                logger.warning(f"Calendar integration error: {e}")

        # Save interview
        app_state["interviews"].append(interview)

        if services['db']:
            await services['db'].save_interview(interview)

        # Update candidate status
        candidate["status"] = "Interview Scheduled"
        candidate["updated_date"] = datetime.now().isoformat()

        if services['db']:
            await services['db'].save_candidate(candidate)

        logger.info(f"✅ Interview scheduled: {interview_id}")

        return {
            "success": True,
            "message": "Interview scheduled successfully",
            "interview": interview
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interview scheduling error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/interviews")
async def get_interviews(
    candidate_id: Optional[int] = None,
    job_id: Optional[int] = None,
    interviewer: Optional[str] = None
):
    """Get interviews with filtering"""
    try:
        interviews = app_state["interviews"].copy()

        # Apply filters
        if candidate_id:
            interviews = [i for i in interviews if i.get("candidate_id") == candidate_id]
        if job_id:
            interviews = [i for i in interviews if i.get("job_id") == job_id]
        if interviewer:
            interviews = [i for i in interviews if i.get("interviewer") == interviewer]

        # Sort by datetime
        interviews.sort(key=lambda x: x.get("datetime", ""))

        return {
            "interviews": interviews,
            "total": len(interviews)
        }

    except Exception as e:
        logger.error(f"Error getting interviews: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Skill matching endpoint
@app.post("/api/skill-match")
async def calculate_skill_match(match_data: dict):
    """Calculate skill match between candidate and job"""
    try:
        candidate_id = match_data["candidate_id"]
        job_id = match_data["job_id"]

        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)
        job = next((j for j in app_state["jobs"] if j["id"] == job_id), None)

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if services['skill_matcher']:
            # Use advanced skill matcher
            match_result = services['skill_matcher'].calculate_enhanced_match(
                candidate.get("skills", []),
                job.get("skills", []),
                candidate.get("experience"),
                job.get("experience_level")
            )
        else:
            # Basic matching fallback
            candidate_skills = set(skill.lower() for skill in candidate.get("skills", []))
            job_skills = set(skill.lower() for skill in job.get("skills", []))

            matched = candidate_skills.intersection(job_skills)
            match_score = len(matched) / len(job_skills) * 100 if job_skills else 0

            match_result = {
                "score": match_score,
                "matched_skills": list(matched),
                "missing_skills": list(job_skills - candidate_skills),
                "details": {"basic_matching": True}
            }

        # Save match score
        match_key = f"{candidate_id}_{job_id}"
        app_state["match_scores"][match_key] = {
            "candidate_id": candidate_id,
            "job_id": job_id,
            "score": match_result["score"],
            "details": match_result,
            "calculated_date": datetime.now().isoformat()
        }

        logger.info(f"🎯 Skill match calculated: {match_result['score']:.1f}%")

        return {
            "success": True,
            "match_result": match_result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Skill matching error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics dashboard endpoint
@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics():
    """Get dashboard analytics and metrics"""
    try:
        total_jobs = len(app_state["jobs"])
        total_candidates = len(app_state["candidates"])
        total_interviews = len(app_state["interviews"])

        # Pipeline statistics
        pipeline_stats = {}
        for candidate in app_state["candidates"]:
            status = candidate.get("status", "Unknown")
            pipeline_stats[status] = pipeline_stats.get(status, 0) + 1

        # Recent activity
        recent_activity = []

        # Add recent candidates
        recent_candidates = sorted(
            app_state["candidates"],
            key=lambda x: x.get("created_date", ""),
            reverse=True
        )[:5]

        for candidate in recent_candidates:
            recent_activity.append({
                "type": "candidate_applied",
                "message": f"New application: {candidate.get('name', 'Unknown')}",
                "timestamp": candidate.get("created_date"),
                "data": {"candidate_id": candidate.get("id")}
            })

        # Add recent interviews
        recent_interviews = sorted(
            app_state["interviews"],
            key=lambda x: x.get("created_date", ""),
            reverse=True
        )[:3]

        for interview in recent_interviews:
            recent_activity.append({
                "type": "interview_scheduled",
                "message": f"Interview: {interview.get('candidate_name')} - {interview.get('job_title')}",
                "timestamp": interview.get("created_date"),
                "data": {"interview_id": interview.get("id")}
            })

        # Sort by timestamp
        recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        recent_activity = recent_activity[:10]

        # Calculate average match score
        total_score = 0
        score_count = 0
        for candidate in app_state["candidates"]:
            for match_score in candidate.get("match_scores", []):
                total_score += match_score.get("score", 0)
                score_count += 1

        avg_match_score = round(total_score / max(score_count, 1), 1)

        analytics = {
            "total_jobs": total_jobs,
            "total_candidates": total_candidates,
            "total_interviews": total_interviews,
            "pipeline_stats": pipeline_stats,
            "recent_activity": recent_activity,
            "success_metrics": {
                "avg_match_score": avg_match_score,
                "interview_rate": round((total_interviews / max(total_candidates, 1)) * 100, 1),
                "active_jobs": len([j for j in app_state["jobs"] if j.get("status") == "Active"])
            }
        }

        return analytics

    except Exception as e:
        logger.error(f"Dashboard analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Utility functions
def get_next_id() -> int:
    """Get next available ID"""
    app_state["next_id"] += 1
    return app_state["next_id"] - 1

async def _seed_sample_data():
    """Create sample data for testing"""
    if not app_state["jobs"]:
        sample_jobs = [
            {
                "id": get_next_id(),
                "title": "Senior Full Stack Developer", 
                "description": "We are looking for a Senior Full Stack Developer with expertise in React, Node.js, and cloud platforms.",
                "skills": ["React", "Node.js", "Python", "AWS", "Docker", "MongoDB"],
                "experience_level": "Senior",
                "status": "Active",
                "created_date": datetime.now().isoformat(),
                "department": "Engineering",
                "location": "San Francisco, CA",
                "salary_range": "$120,000 - $160,000"
            },
            {
                "id": get_next_id(),
                "title": "Data Scientist",
                "description": "Join our AI team to build machine learning models and extract insights from large datasets.",
                "skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics", "Data Visualization"],
                "experience_level": "Mid-Level",
                "status": "Active", 
                "created_date": datetime.now().isoformat(),
                "department": "Data Science",
                "location": "Remote",
                "salary_range": "$90,000 - $130,000"
            }
        ]

        app_state["jobs"].extend(sample_jobs)
        logger.info(f"🌱 Seeded {len(sample_jobs)} sample jobs")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found", "path": str(request.url)}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "timestamp": datetime.now().isoformat()}
    )

# Development server
if __name__ == "__main__":
    import uvicorn

    logger.info(f"🚀 Starting AI Hiring Management System")
    logger.info(f"📱 Frontend: http://{settings.api_host}:{settings.api_port}/app")
    logger.info(f"📚 API Docs: http://{settings.api_host}:{settings.api_port}/docs")
    logger.info(f"🩺 Health: http://{settings.api_host}:{settings.api_port}/health")

    try:
        uvicorn.run(
            "fixed_main:app",
            host=settings.api_host,
            port=settings.api_port,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        sys.exit(1)
