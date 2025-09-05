
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
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Enhanced AI Hiring Agent API",
    description="Complete hiring management system with fixed interview scheduling",
    version="2.1.0"
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
    "jobs": [
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
        },
        {
            "id": 2,
            "title": "Data Scientist",
            "description": "Join our AI team to build machine learning models and extract insights from large datasets.",
            "skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics", "Data Visualization"],
            "experience_level": "Mid-Level",
            "status": "Active",
            "created_date": "2025-08-18T00:00:00",
            "department": "Data Science",
            "location": "Remote",
            "salary_range": "$90,000 - $130,000"
        }
    ],
    "interviews": [],
    "match_scores": {},
    "next_id": 3
}

@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    try:
        await db.initialize()
        # Load existing data
        loaded_data = await db.load_all_data()
        if loaded_data.get('candidates') or loaded_data.get('interviews'):
            app_state.update(loaded_data)

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
        "version": "2.1.0",
        "candidates_count": len(app_state["candidates"]),
        "jobs_count": len(app_state["jobs"]),
        "interviews_count": len(app_state["interviews"])
    }

# FIXED: Enhanced Resume Upload and Parsing
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
                "name": "Unknown Candidate",
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

# FIXED: Enhanced Interview Scheduling with proper validation
@app.post("/api/interviews")
async def schedule_interview(interview_data: dict):
    """Schedule interview with enhanced features and proper validation"""
    try:
        # Validate required fields
        required_fields = ["candidate_id", "job_id", "interviewer", "datetime", "interview_type"]
        for field in required_fields:
            if field not in interview_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        candidate_id = interview_data["candidate_id"]
        job_id = interview_data["job_id"]
        interviewer = interview_data["interviewer"]
        datetime_str = interview_data["datetime"]

        # Validate candidate exists
        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Validate job exists
        job = next((j for j in app_state["jobs"] if j["id"] == job_id), None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        # FIXED: Validate datetime format and working hours
        try:
            target_datetime = datetime.fromisoformat(datetime_str.replace('Z', ''))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format")

        # Check if interview is in the future
        if target_datetime <= datetime.now():
            raise HTTPException(status_code=400, detail="Interview must be scheduled for future date and time")

        # Check if it's a working day (Monday-Friday)
        if target_datetime.weekday() > 4:
            raise HTTPException(status_code=400, detail="Interviews can only be scheduled on working days (Monday-Friday)")

        # Check working hours (9 AM - 5 PM)
        if target_datetime.hour < 9 or target_datetime.hour >= 17:
            raise HTTPException(status_code=400, detail="Interviews can only be scheduled during working hours (9 AM - 5 PM)")

        # FIXED: Check interviewer availability
        availability_check = await interview_scheduler.check_availability(datetime_str, interviewer)
        if not availability_check:
            # Check for specific conflicts
            conflicts = [i for i in app_state["interviews"] 
                        if i["interviewer"] == interviewer and 
                           abs((datetime.fromisoformat(i["datetime"].replace('Z', '')) - target_datetime).total_seconds()) < 3600]  # 1 hour buffer

            if conflicts:
                conflict_time = datetime.fromisoformat(conflicts[0]["datetime"].replace('Z', '')).strftime('%I:%M %p')
                raise HTTPException(
                    status_code=409,
                    detail=f"Interviewer {interviewer} is not available. Conflict with interview at {conflict_time}"
                )
            else:
                raise HTTPException(
                    status_code=409,
                    detail=f"Interviewer {interviewer} is not available at the requested time"
                )

        # Create interview record with proper structure
        interview_id = get_next_id()
        interview = {
            "id": interview_id,
            "candidate_id": candidate_id,
            "job_id": job_id,
            "candidate_name": candidate["name"],
            "job_title": job["title"],
            "interviewer": interviewer,
            "datetime": target_datetime.isoformat(),
            "interview_type": interview_data["interview_type"],
            "status": "Scheduled",
            "duration": interview_data.get("duration", 60),
            "location": interview_data.get("location", "Virtual"),
            "meeting_link": f"https://zoom.us/j/{uuid.uuid4().hex[:10]}" if interview_data.get("location", "Virtual") == "Virtual" else None,
            "notes": interview_data.get("notes", ""),
            "created_date": datetime.now().isoformat(),
            "created_by": interview_data.get("created_by", "System")
        }

        # Save interview
        app_state["interviews"].append(interview)
        await db.save_interview(interview)

        # FIXED: Update candidate status properly
        candidate["status"] = "Interview Scheduled"
        candidate["updated_date"] = datetime.now().isoformat()

        # Add interview to candidate's history
        if "interview_history" not in candidate:
            candidate["interview_history"] = []
        candidate["interview_history"].append(interview_id)

        await db.save_candidate(candidate)

        # FIXED: Book the time slot with proper error handling
        try:
            await interview_scheduler.book_slot(datetime_str, interviewer, str(interview_id))
        except Exception as booking_error:
            logger.warning(f"Could not book slot in scheduler: {str(booking_error)}")
            # Continue with interview creation even if booking fails

        # Send calendar invite
        try:
            invite_result = await interview_scheduler.send_calendar_invite(str(interview_id), {
                "candidate_email": candidate.get("email"),
                "candidate_name": candidate["name"],
                "job_title": job["title"],
                "interviewer": interviewer,
                "datetime": datetime_str,
                "meeting_link": interview.get("meeting_link")
            })
            interview["calendar_invite_sent"] = invite_result.get("success", False)
        except Exception as invite_error:
            logger.warning(f"Could not send calendar invite: {str(invite_error)}")
            interview["calendar_invite_sent"] = False

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
        raise HTTPException(status_code=500, detail=f"Failed to schedule interview: {str(e)}")

# FIXED: Enhanced interview management endpoints
@app.get("/api/interviews")
async def get_interviews(
    candidate_id: Optional[int] = None,
    job_id: Optional[int] = None,
    interviewer: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
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

        # FIXED: Date range filtering
        if date_from:
            date_from_obj = datetime.fromisoformat(date_from.replace('Z', ''))
            interviews = [i for i in interviews 
                         if datetime.fromisoformat(i.get("datetime", "").replace('Z', '')) >= date_from_obj]

        if date_to:
            date_to_obj = datetime.fromisoformat(date_to.replace('Z', ''))
            interviews = [i for i in interviews 
                         if datetime.fromisoformat(i.get("datetime", "").replace('Z', '')) <= date_to_obj]

        # Sort by datetime
        interviews.sort(key=lambda x: x.get("datetime", ""))

        return {
            "interviews": interviews,
            "total": len(interviews)
        }

    except Exception as e:
        logger.error(f"Error retrieving interviews: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# FIXED: Interview rescheduling endpoint
@app.put("/api/interviews/{interview_id}")
async def update_interview(interview_id: int, interview_data: dict):
    """Update/reschedule interview with proper validation"""
    try:
        interview = next((i for i in app_state["interviews"] if i["id"] == interview_id), None)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        # Store original data for history
        original_datetime = interview["datetime"]
        original_interviewer = interview["interviewer"]

        # Validate new datetime if provided
        if "datetime" in interview_data:
            new_datetime_str = interview_data["datetime"]
            try:
                new_datetime = datetime.fromisoformat(new_datetime_str.replace('Z', ''))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid datetime format")

            # Validate new datetime
            if new_datetime <= datetime.now():
                raise HTTPException(status_code=400, detail="New interview time must be in the future")

            # Check working hours and days
            if new_datetime.weekday() > 4:
                raise HTTPException(status_code=400, detail="Interviews can only be scheduled on working days")

            if new_datetime.hour < 9 or new_datetime.hour >= 17:
                raise HTTPException(status_code=400, detail="Interviews must be during working hours (9 AM - 5 PM)")

            # Check availability for new interviewer if changed
            new_interviewer = interview_data.get("interviewer", interview["interviewer"])
            availability = await interview_scheduler.check_availability(new_datetime_str, new_interviewer)
            if not availability:
                raise HTTPException(
                    status_code=409,
                    detail=f"Interviewer {new_interviewer} is not available at {new_datetime.strftime('%I:%M %p')}"
                )

        # FIXED: Update interview data with change tracking
        updated_fields = []

        for key, value in interview_data.items():
            if key in interview and interview[key] != value:
                updated_fields.append(f"{key}: {interview[key]} -> {value}")
                interview[key] = value

        # Add change history
        if updated_fields:
            if "change_history" not in interview:
                interview["change_history"] = []

            interview["change_history"].append({
                "changes": updated_fields,
                "updated_by": interview_data.get("updated_by", "System"),
                "timestamp": datetime.now().isoformat(),
                "reason": interview_data.get("reason", "Manual update")
            })

        interview["updated_date"] = datetime.now().isoformat()

        # FIXED: Handle slot booking changes
        if "datetime" in interview_data or "interviewer" in interview_data:
            # Cancel old slot
            try:
                await interview_scheduler.cancel_slot(original_datetime, original_interviewer)
            except Exception as e:
                logger.warning(f"Could not cancel old slot: {str(e)}")

            # Book new slot
            try:
                await interview_scheduler.book_slot(
                    interview["datetime"], 
                    interview["interviewer"], 
                    str(interview_id)
                )
            except Exception as e:
                logger.warning(f"Could not book new slot: {str(e)}")

        # Save updated interview
        await db.save_interview(interview)

        logger.info(f"Interview {interview_id} updated successfully")

        return {
            "success": True,
            "message": "Interview updated successfully",
            "interview": interview,
            "updated_fields": updated_fields
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating interview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# FIXED: Interview cancellation endpoint
@app.delete("/api/interviews/{interview_id}")
async def cancel_interview(interview_id: int, cancellation_data: dict = {}):
    """Cancel interview with proper cleanup"""
    try:
        interview = next((i for i in app_state["interviews"] if i["id"] == interview_id), None)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        # Update interview status
        interview["status"] = "Cancelled"
        interview["cancellation_reason"] = cancellation_data.get("reason", "No reason provided")
        interview["cancelled_date"] = datetime.now().isoformat()
        interview["cancelled_by"] = cancellation_data.get("cancelled_by", "System")

        # FIXED: Update candidate status appropriately
        candidate = next((c for c in app_state["candidates"] if c["id"] == interview["candidate_id"]), None)
        if candidate:
            # Only change status back if it was "Interview Scheduled"
            if candidate.get("status") == "Interview Scheduled":
                # Check if there are other scheduled interviews
                other_interviews = [i for i in app_state["interviews"] 
                                  if i["candidate_id"] == candidate["id"] and 
                                     i["id"] != interview_id and 
                                     i.get("status") == "Scheduled"]

                if not other_interviews:
                    candidate["status"] = "Applied"  # Reset to Applied if no other interviews
                # If there are other interviews, keep status as "Interview Scheduled"

            candidate["updated_date"] = datetime.now().isoformat()
            await db.save_candidate(candidate)

        # FIXED: Cancel the booked slot
        try:
            await interview_scheduler.cancel_slot(interview["datetime"], interview["interviewer"])
        except Exception as e:
            logger.warning(f"Could not cancel slot in scheduler: {str(e)}")

        # Save updated interview
        await db.save_interview(interview)

        logger.info(f"Interview {interview_id} cancelled successfully")

        return {
            "success": True,
            "message": "Interview cancelled successfully",
            "interview": interview
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling interview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# FIXED: Availability checking endpoint
@app.get("/api/interviews/availability")
async def check_interviewer_availability(
    interviewer: str,
    datetime: str,
    duration: int = 60
):
    """Check interviewer availability for specific datetime"""
    try:
        # Validate datetime
        try:
            target_datetime = datetime.fromisoformat(datetime.replace('Z', ''))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid datetime format")

        # Check basic availability
        availability = await interview_scheduler.check_availability(datetime, interviewer)

        # Get conflicts if any
        conflicts = []
        for interview in app_state["interviews"]:
            if (interview.get("interviewer") == interviewer and 
                interview.get("status") == "Scheduled"):

                interview_datetime = datetime.fromisoformat(interview["datetime"].replace('Z', ''))
                time_diff = abs((target_datetime - interview_datetime).total_seconds() / 60)

                if time_diff < duration + 30:  # Include 30-minute buffer
                    conflicts.append({
                        "interview_id": interview["id"],
                        "candidate_name": interview["candidate_name"],
                        "datetime": interview["datetime"],
                        "duration": interview.get("duration", 60)
                    })

        # Generate alternative slots if not available
        alternatives = []
        if not availability:
            base_date = target_datetime.date()
            for hour_offset in [-2, -1, 1, 2]:  # Check 2 hours before/after
                alt_datetime = target_datetime + timedelta(hours=hour_offset)
                if (alt_datetime.hour >= 9 and alt_datetime.hour < 17 and 
                    await interview_scheduler.check_availability(alt_datetime.isoformat(), interviewer)):
                    alternatives.append({
                        "datetime": alt_datetime.isoformat(),
                        "display": alt_datetime.strftime('%I:%M %p')
                    })

        return {
            "available": availability,
            "conflicts": conflicts,
            "alternatives": alternatives[:5],  # Limit to 5 suggestions
            "working_hours": "9:00 AM - 5:00 PM",
            "working_days": "Monday - Friday"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking availability: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

# Rest of the API endpoints (jobs, analytics, etc.) remain the same...
@app.get("/api/jobs")
async def get_jobs():
    """Get all jobs with enhanced data"""
    try:
        jobs = app_state["jobs"].copy()

        # Add calculated fields
        for job in jobs:
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

# Helper functions
def get_next_id():
    """Get next available ID"""
    app_state["next_id"] += 1
    return app_state["next_id"] - 1

async def calculate_skill_match_background(candidate_id: int, job_id: int):
    """Background task for skill match calculation"""
    try:
        candidate = next((c for c in app_state["candidates"] if c["id"] == candidate_id), None)
        job = next((j for j in app_state["jobs"] if j["id"] == job_id), None)

        if candidate and job:
            match_result = skill_matcher.calculate_enhanced_match(
                candidate.get("skills", []),
                job.get("skills", []),
                candidate.get("experience"),
                job.get("experience_level")
            )

            # Update candidate match scores
            match_scores = candidate.get("match_scores", [])
            match_scores = [ms for ms in match_scores if ms.get("job_id") != job_id]  # Remove old score
            match_scores.append({
                "job_id": job_id,
                "score": match_result["score"],
                "calculated_date": datetime.now().isoformat()
            })
            candidate["match_scores"] = match_scores

            await db.save_candidate(candidate)

    except Exception as e:
        logger.error(f"Background skill match calculation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
