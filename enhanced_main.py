
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import asyncio
import aiofiles
import json
import os
from datetime import datetime, timedelta
import uuid
import logging
import traceback

# Import our custom modules
from enhanced_resume_parser import EnhancedResumeParser
from enhanced_skill_matcher import EnhancedSkillMatcher
from enhanced_database import EnhancedDatabaseManager
from enhanced_scheduler import EnhancedInterviewScheduler
from models import *

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Enhanced AI Hiring Agent API",
    description="Complete hiring management system with enhanced features",
    version="2.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize enhanced services
db = EnhancedDatabaseManager()
resume_parser = EnhancedResumeParser()
skill_matcher = EnhancedSkillMatcher()
interview_scheduler = EnhancedInterviewScheduler()

# Global state for better data management
app_state = {
    "candidates": [],
    "jobs": [],
    "interviews": [],
    "match_scores": {},
    "next_id": 1
}

@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    try:
        await db.initialize()
        # Load existing data
        app_state.update(await db.load_all_data())
        logger.info("Enhanced AI Hiring Agent API started successfully")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    try:
        await db.save_all_data(app_state)
        await db.close()
        logger.info("Enhanced AI Hiring Agent API shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "candidates_count": len(app_state["candidates"]),
        "jobs_count": len(app_state["jobs"]),
        "interviews_count": len(app_state["interviews"])
    }

# Enhanced Resume Upload and Parsing
@app.post("/api/resumes/upload")
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    job_id: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Enhanced resume upload with proper error handling and persistence"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        if not file.filename.lower().endswith(('.pdf', '.docx', '.doc')):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF, DOCX, and DOC files are supported"
            )

        if file.size and file.size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File size too large (max 10MB)")

        logger.info(f"Processing resume upload: {file.filename}")

        # Save uploaded file
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        file_path = f"uploads/{file_id}{file_extension}"
        os.makedirs("uploads", exist_ok=True)

        # Read and save file content
        content = await file.read()
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        logger.info(f"File saved to: {file_path}")

        # Parse resume with enhanced parser
        try:
            parsed_data = await resume_parser.parse_resume(file_path)
            logger.info(f"Resume parsed successfully: {parsed_data.get('name', 'Unknown')}")
        except Exception as parse_error:
            logger.error(f"Resume parsing error: {str(parse_error)}")
            # Return partial data even if parsing fails
            parsed_data = {
                "name": "Unknown",
                "email": None,
                "phone": None,
                "skills": [],
                "experience": None,
                "education": [],
                "work_history": [],
                "raw_text": "",
                "confidence_scores": {"overall": 0.0}
            }

        # Create candidate record with enhanced data
        candidate_id = get_next_id()
        candidate_data = {
            "id": candidate_id,
            "name": parsed_data.get("name", "Unknown Candidate"),
            "email": parsed_data.get("email"),
            "phone": parsed_data.get("phone"),
            "skills": parsed_data.get("skills", []),
            "experience": parsed_data.get("experience"),
            "education": parsed_data.get("education", []),
            "work_history": parsed_data.get("work_history", []),
            "status": "Applied",
            "applied_jobs": [int(job_id)] if job_id else [],
            "match_scores": [],
            "resume_file_path": file_path,
            "original_filename": file.filename,
            "created_date": datetime.now().isoformat(),
            "updated_date": datetime.now().isoformat(),
            "confidence_scores": parsed_data.get("confidence_scores", {}),
            "raw_text": parsed_data.get("raw_text", ""),
            "location": parsed_data.get("location"),
            "salary_expectation": parsed_data.get("salary_expectation")
        }

        # Save candidate to app state
        app_state["candidates"].append(candidate_data)

        # Calculate skill matches if job_id provided
        if job_id:
            background_tasks.add_task(calculate_skill_match_background, candidate_id, int(job_id))

        # Save to persistent storage
        await db.save_candidate(candidate_data)

        logger.info(f"Candidate saved successfully: ID {candidate_id}")

        return {
            "success": True,
            "message": "Resume uploaded and parsed successfully",
            "candidate": candidate_data,
            "parsing_confidence": parsed_data.get("confidence_scores", {}).get("overall", 0.0)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading resume: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Enhanced Candidate Management
@app.get("/api/candidates")
async def get_candidates(
    job_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get candidates with enhanced filtering and proper data retrieval"""
    try:
        candidates = app_state["candidates"].copy()

        # Apply filters
        if job_id:
            candidates = [c for c in candidates if job_id in c.get("applied_jobs", [])]

        if status:
            candidates = [c for c in candidates if c.get("status") == status]

        # Sort by created_date (newest first)
        candidates.sort(key=lambda x: x.get("created_date", ""), reverse=True)

        # Apply pagination
        paginated_candidates = candidates[skip:skip+limit]

        logger.info(f"Retrieved {len(paginated_candidates)} candidates")

        return {
            "candidates": paginated_candidates,
            "total": len(candidates),
            "page": skip // limit + 1 if limit > 0 else 1,
            "pages": (len(candidates) - 1) // limit + 1 if limit > 0 else 1
        }

    except Exception as e:
        logger.error(f"Error retrieving candidates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/candidates/{candidate_id}")
async def get_candidate(candidate_id: int):
    """Get a specific candidate with enhanced data"""
    try:
        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Add calculated fields
        candidate_with_extras = candidate.copy()
        candidate_with_extras["total_skills"] = len(candidate.get("skills", []))
        candidate_with_extras["has_email"] = bool(candidate.get("email"))
        candidate_with_extras["has_phone"] = bool(candidate.get("phone"))

        return candidate_with_extras

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving candidate {candidate_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/candidates/{candidate_id}/status")
async def update_candidate_status(candidate_id: int, status_data: dict):
    """Update candidate status with proper persistence"""
    try:
        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Update status
        old_status = candidate.get("status")
        new_status = status_data.get("status")

        candidate["status"] = new_status
        candidate["updated_date"] = datetime.now().isoformat()

        if status_data.get("notes"):
            if "status_history" not in candidate:
                candidate["status_history"] = []

            candidate["status_history"].append({
                "from_status": old_status,
                "to_status": new_status,
                "notes": status_data.get("notes"),
                "updated_by": status_data.get("updated_by", "System"),
                "timestamp": datetime.now().isoformat()
            })

        # Save to persistent storage
        await db.save_candidate(candidate)

        logger.info(f"Updated candidate {candidate_id} status from {old_status} to {new_status}")

        return {
            "success": True,
            "message": f"Candidate status updated to {new_status}",
            "candidate": candidate
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating candidate status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Interview Scheduling
@app.post("/api/interviews")
async def schedule_interview(interview_data: dict):
    """Schedule interview with enhanced features"""
    try:
        # Validate required fields
        required_fields = ["candidate_id", "job_id", "interviewer", "datetime", "interview_type"]
        for field in required_fields:
            if field not in interview_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        candidate_id = interview_data["candidate_id"]
        job_id = interview_data["job_id"]

        # Validate candidate exists
        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Validate job exists
        job = next((j for j in app_state["jobs"] if j["id"] == job_id), None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Check interviewer availability
        interviewer = interview_data["interviewer"]
        datetime_str = interview_data["datetime"]

        availability_check = await interview_scheduler.check_availability(datetime_str, interviewer)
        if not availability_check:
            raise HTTPException(
                status_code=409, 
                detail=f"Interviewer {interviewer} is not available at {datetime_str}"
            )

        # Create interview record
        interview_id = get_next_id()
        interview = {
            "id": interview_id,
            "candidate_id": candidate_id,
            "job_id": job_id,
            "candidate_name": candidate["name"],
            "job_title": job["title"],
            "interviewer": interviewer,
            "datetime": datetime_str,
            "interview_type": interview_data["interview_type"],
            "status": "Scheduled",
            "duration": interview_data.get("duration", 60),
            "location": interview_data.get("location", "Virtual"),
            "meeting_link": f"https://zoom.us/j/{uuid.uuid4().hex[:10]}",
            "notes": interview_data.get("notes", ""),
            "created_date": datetime.now().isoformat(),
            "created_by": interview_data.get("created_by", "System")
        }

        # Save interview
        app_state["interviews"].append(interview)
        await db.save_interview(interview)

        # Update candidate status to "Interview Scheduled"
        candidate["status"] = "Interview Scheduled"
        candidate["updated_date"] = datetime.now().isoformat()
        await db.save_candidate(candidate)

        # Book the time slot
        await interview_scheduler.book_slot(datetime_str, interviewer, str(interview_id))

        # Send calendar invite (mock)
        await interview_scheduler.send_calendar_invite(str(interview_id), {
            "candidate_email": candidate.get("email"),
            "candidate_name": candidate["name"],
            "job_title": job["title"],
            "interviewer": interviewer,
            "datetime": datetime_str,
            "meeting_link": interview["meeting_link"]
        })

        logger.info(f"Interview scheduled: {interview_id} for candidate {candidate_id}")

        return {
            "success": True,
            "message": "Interview scheduled successfully",
            "interview": interview
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error scheduling interview: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/interviews")
async def get_interviews(
    candidate_id: Optional[int] = None,
    job_id: Optional[int] = None,
    interviewer: Optional[str] = None,
    status: Optional[str] = None
):
    """Get interviews with enhanced filtering"""
    try:
        interviews = app_state["interviews"].copy()

        # Apply filters
        if candidate_id:
            interviews = [i for i in interviews if i.get("candidate_id") == candidate_id]

        if job_id:
            interviews = [i for i in interviews if i.get("job_id") == job_id]

        if interviewer:
            interviews = [i for i in interviews if i.get("interviewer") == interviewer]

        if status:
            interviews = [i for i in interviews if i.get("status") == status]

        # Sort by datetime
        interviews.sort(key=lambda x: x.get("datetime", ""))

        return {
            "interviews": interviews,
            "total": len(interviews)
        }

    except Exception as e:
        logger.error(f"Error retrieving interviews: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Skill Matching
@app.post("/api/skill-match")
async def calculate_skill_match_endpoint(match_request: dict):
    """Calculate enhanced skill match"""
    try:
        candidate_id = match_request.get("candidate_id")
        job_id = match_request.get("job_id")

        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)
        job = next((j for j in app_state["jobs"] if j["id"] == job_id), None)

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # Calculate match using enhanced skill matcher
        match_result = skill_matcher.calculate_enhanced_match(
            candidate.get("skills", []), 
            job.get("skills", []),
            candidate.get("experience"),
            job.get("experience_level")
        )

        # Save match score
        match_key = f"{candidate_id}_{job_id}"
        app_state["match_scores"][match_key] = {
            "candidate_id": candidate_id,
            "job_id": job_id,
            "score": match_result["score"],
            "details": match_result,
            "calculated_date": datetime.now().isoformat()
        }

        # Update candidate's match scores
        candidate_match_scores = candidate.get("match_scores", [])
        # Remove existing score for this job
        candidate_match_scores = [ms for ms in candidate_match_scores if ms.get("job_id") != job_id]
        # Add new score
        candidate_match_scores.append({
            "job_id": job_id,
            "score": match_result["score"],
            "calculated_date": datetime.now().isoformat()
        })
        candidate["match_scores"] = candidate_match_scores

        await db.save_candidate(candidate)

        return {
            "success": True,
            "match_result": match_result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating skill match: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
def get_next_id():
    """Get next available ID"""
    app_state["next_id"] += 1
    return app_state["next_id"] - 1

async def calculate_skill_match_background(candidate_id: int, job_id: int):
    """Background task for skill match calculation"""
    try:
        await calculate_skill_match_endpoint({
            "candidate_id": candidate_id,
            "job_id": job_id
        })
    except Exception as e:
        logger.error(f"Background skill match calculation failed: {str(e)}")

# Job Management (Enhanced)
@app.get("/api/jobs")
async def get_jobs():
    """Get all jobs with enhanced data"""
    try:
        jobs = app_state["jobs"].copy()

        # Add calculated fields
        for job in jobs:
            # Count applications for this job
            applications_count = len([c for c in app_state["candidates"] if job["id"] in c.get("applied_jobs", [])])
            job["applications_count"] = applications_count

        jobs.sort(key=lambda x: x.get("created_date", ""), reverse=True)

        return {
            "jobs": jobs,
            "total": len(jobs)
        }

    except Exception as e:
        logger.error(f"Error retrieving jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Dashboard
@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics():
    """Get enhanced dashboard analytics"""
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
                "message": f"New candidate: {candidate.get('name', 'Unknown')}",
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
                "message": f"Interview scheduled: {interview.get('candidate_name')} for {interview.get('job_title')}",
                "timestamp": interview.get("created_date"),
                "data": {"interview_id": interview.get("id")}
            })

        # Sort all recent activity by timestamp
        recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        recent_activity = recent_activity[:10]

        # Top skills analysis
        skill_counts = {}
        for candidate in app_state["candidates"]:
            for skill in candidate.get("skills", []):
                skill_counts[skill] = skill_counts.get(skill, 0) + 1

        top_skills = [
            {"skill": skill, "count": count} 
            for skill, count in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]

        return {
            "total_jobs": total_jobs,
            "total_candidates": total_candidates,
            "total_interviews": total_interviews,
            "pipeline_stats": pipeline_stats,
            "recent_activity": recent_activity,
            "top_skills": top_skills,
            "success_metrics": {
                "interview_rate": round((total_interviews / max(total_candidates, 1)) * 100, 1),
                "active_jobs": len([j for j in app_state["jobs"] if j.get("status") == "Active"]),
                "avg_match_score": calculate_average_match_score()
            }
        }

    except Exception as e:
        logger.error(f"Error getting dashboard analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_average_match_score():
    """Calculate average match score across all candidates"""
    try:
        total_score = 0
        count = 0

        for candidate in app_state["candidates"]:
            for match_score in candidate.get("match_scores", []):
                total_score += match_score.get("score", 0)
                count += 1

        return round(total_score / max(count, 1), 1)

    except Exception:
        return 0.0

if __name__ == "__main__":
    import uvicorn
    # Initialize sample data if empty
    if not app_state["jobs"]:
        app_state["jobs"] = [
            {
                "id": 1,
                "title": "Senior Full Stack Developer",
                "description": "Looking for a Senior Full Stack Developer with React and Node.js expertise.",
                "skills": ["React", "Node.js", "Python", "AWS", "Docker", "MongoDB"],
                "experience_level": "Senior",
                "status": "Active",
                "created_date": "2025-08-20T00:00:00",
                "department": "Engineering",
                "location": "San Francisco, CA",
                "salary_range": "$120,000 - $160,000"
            }
        ]
        app_state["next_id"] = 2

    uvicorn.run(app, host="0.0.0.0", port=8000)
