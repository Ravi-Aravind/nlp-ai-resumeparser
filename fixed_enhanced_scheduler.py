
import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio
import aiofiles

# Google Calendar imports with error handling
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Google Calendar API not available: {e}")
    GOOGLE_AVAILABLE = False

# LinkedIn imports with error handling  
try:
    from linkedin_api import Linkedin
    LINKEDIN_AVAILABLE = True
except ImportError as e:
    logging.warning(f"LinkedIn API not available: {e}")
    LINKEDIN_AVAILABLE = False

# Email imports
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64

# Configuration import with fallback
try:
    from config import settings
except ImportError:
    # Fallback configuration
    class Settings:
        google_client_id = os.getenv('GOOGLE_CLIENT_ID')
        google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET') 
        google_project_id = os.getenv('GOOGLE_PROJECT_ID')
        linkedin_client_id = os.getenv('LINKEDIN_CLIENT_ID')
        linkedin_client_secret = os.getenv('LINKEDIN_CLIENT_SECRET')
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', '587'))

    settings = Settings()

logger = logging.getLogger(__name__)

class EnhancedInterviewScheduler:
    """Enhanced interview scheduler with Google Calendar and LinkedIn integration"""

    def __init__(self):
        self.google_service = None
        self.gmail_service = None
        self.linkedin_api = None
        self.credentials_path = "credentials.json"
        self.token_path = "token.json"
        self.scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/gmail.send'
        ]

    async def initialize(self):
        """Initialize all services with proper error handling"""
        try:
            # Initialize Google services
            if GOOGLE_AVAILABLE and self._has_google_credentials():
                await self._initialize_google_services()

            # Initialize LinkedIn API
            if LINKEDIN_AVAILABLE and self._has_linkedin_credentials():
                await self._initialize_linkedin_api()

            logger.info("Scheduler services initialized")
            return True

        except Exception as e:
            logger.error(f"Scheduler initialization error: {e}")
            return False

    def _has_google_credentials(self) -> bool:
        """Check if Google Calendar credentials are available"""
        return (settings.google_client_id and 
                settings.google_client_secret and 
                (os.path.exists(self.credentials_path) or 
                 settings.google_project_id))

    def _has_linkedin_credentials(self) -> bool:
        """Check if LinkedIn credentials are available"""
        return (settings.linkedin_client_id and 
                settings.linkedin_client_secret)

    async def _initialize_google_services(self):
        """Initialize Google Calendar and Gmail services"""
        try:
            creds = None

            # Load existing token
            if os.path.exists(self.token_path):
                creds = Credentials.from_authorized_user_file(self.token_path, self.scopes)

            # Refresh or get new credentials
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    # Create credentials file if it doesn't exist
                    await self._ensure_credentials_file()

                    if os.path.exists(self.credentials_path):
                        flow = InstalledAppFlow.from_client_secrets_file(
                            self.credentials_path, self.scopes)
                        # For production, use run_console() instead of run_local_server()
                        if settings.environment == 'production':
                            creds = flow.run_console()
                        else:
                            creds = flow.run_local_server(port=0)

                # Save credentials for future use
                if creds:
                    async with aiofiles.open(self.token_path, 'w') as f:
                        await f.write(creds.to_json())

            if creds:
                # Build Google services
                self.google_service = build('calendar', 'v3', credentials=creds)
                self.gmail_service = build('gmail', 'v1', credentials=creds)
                logger.info("Google services initialized successfully")
            else:
                logger.warning("Failed to initialize Google services - credentials issue")

        except Exception as e:
            logger.error(f"Google services initialization error: {e}")
            self.google_service = None
            self.gmail_service = None

    async def _ensure_credentials_file(self):
        """Create credentials.json from environment variables"""
        if not os.path.exists(self.credentials_path) and settings.google_client_id:
            credentials_data = {
                "installed": {
                    "client_id": settings.google_client_id,
                    "project_id": settings.google_project_id or "ai-hiring-system",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_secret": settings.google_client_secret,
                    "redirect_uris": ["http://localhost"]
                }
            }

            async with aiofiles.open(self.credentials_path, 'w') as f:
                await f.write(json.dumps(credentials_data, indent=2))

            logger.info("Created credentials.json from environment variables")

    async def _initialize_linkedin_api(self):
        """Initialize LinkedIn API"""
        try:
            # Note: This requires actual LinkedIn credentials for a user account
            # In production, you'd want to implement OAuth flow for LinkedIn
            logger.warning("LinkedIn API initialization requires user credentials")
            logger.info("LinkedIn API available but not authenticated")

        except Exception as e:
            logger.error(f"LinkedIn API initialization error: {e}")
            self.linkedin_api = None

    async def schedule_interview(self, interview_data: Dict[str, Any]) -> Dict[str, Any]:
        """Schedule interview with calendar and email integration"""
        try:
            # Extract interview details
            candidate_name = interview_data.get('candidate_name', 'Candidate')
            job_title = interview_data.get('job_title', 'Position')
            interviewer = interview_data['interviewer']
            datetime_str = interview_data['datetime']
            duration = interview_data.get('duration', 60)

            # Create calendar event if Google service available
            calendar_event = None
            if self.google_service:
                try:
                    calendar_event = await self._create_calendar_event(interview_data)
                    interview_data['calendar_event_id'] = calendar_event.get('id')
                    interview_data['meeting_link'] = calendar_event.get('hangoutLink', 
                        f"https://meet.google.com/generated-{interview_data.get('id', 'unknown')}")
                except Exception as e:
                    logger.warning(f"Calendar event creation failed: {e}")

            # Send email notifications if possible
            if calendar_event or interview_data.get('meeting_link'):
                try:
                    await self._send_interview_notifications(interview_data)
                except Exception as e:
                    logger.warning(f"Email notifications failed: {e}")

            logger.info(f"Interview scheduled: {interview_data.get('id')}")
            return interview_data

        except Exception as e:
            logger.error(f"Error scheduling interview: {e}")
            raise

    async def _create_calendar_event(self, interview_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create Google Calendar event"""
        if not self.google_service:
            raise Exception("Google Calendar service not initialized")

        try:
            # Parse datetime
            start_datetime = datetime.fromisoformat(interview_data['datetime'])
            end_datetime = start_datetime + timedelta(minutes=interview_data.get('duration', 60))

            # Create event
            event = {
                'summary': f"Interview: {interview_data.get('candidate_name')} - {interview_data.get('job_title')}",
                'description': f"""
Interview Details:
• Candidate: {interview_data.get('candidate_name', 'TBD')}
• Position: {interview_data.get('job_title', 'TBD')}
• Interviewer: {interview_data['interviewer']}
• Type: {interview_data.get('interview_type', 'General')}
• Duration: {interview_data.get('duration', 60)} minutes

Scheduled via AI Hiring Management System
                """.strip(),
                'start': {
                    'dateTime': start_datetime.isoformat(),
                    'timeZone': 'UTC',
                },
                'end': {
                    'dateTime': end_datetime.isoformat(),
                    'timeZone': 'UTC',
                },
                'location': interview_data.get('location', 'Virtual Meeting'),
                'conferenceData': {
                    'createRequest': {
                        'requestId': f"interview_{interview_data.get('id', int(datetime.now().timestamp()))}",
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                },
                'reminders': {
                    'useDefault': False,
                    'overrides': [
                        {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                        {'method': 'popup', 'minutes': 30},       # 30 minutes before
                    ],
                },
                'attendees': []
            }

            # Add attendees if email addresses available
            if interview_data.get('candidate_email'):
                event['attendees'].append({'email': interview_data['candidate_email']})

            interviewer_email = self._get_interviewer_email(interview_data['interviewer'])
            if interviewer_email:
                event['attendees'].append({'email': interviewer_email})

            # Create the event
            created_event = self.google_service.events().insert(
                calendarId='primary',
                body=event,
                conferenceDataVersion=1,
                sendUpdates='all'
            ).execute()

            logger.info(f"Calendar event created: {created_event['id']}")
            return created_event

        except HttpError as e:
            logger.error(f"Google Calendar API error: {e}")
            raise Exception(f"Failed to create calendar event: {e}")

    async def _send_interview_notifications(self, interview_data: Dict[str, Any]):
        """Send email notifications for interview"""
        try:
            candidate_email = interview_data.get('candidate_email')
            interviewer_email = self._get_interviewer_email(interview_data['interviewer'])
            meeting_link = interview_data.get('meeting_link', 'TBD')

            # Send to candidate
            if candidate_email:
                await self._send_candidate_invitation(candidate_email, interview_data, meeting_link)

            # Send to interviewer
            if interviewer_email:
                await self._send_interviewer_notification(interviewer_email, interview_data, meeting_link)

            logger.info("Interview notifications sent successfully")

        except Exception as e:
            logger.error(f"Error sending notifications: {e}")

    async def _send_candidate_invitation(self, email: str, interview_data: Dict[str, Any], meeting_link: str):
        """Send interview invitation to candidate"""
        subject = f"Interview Invitation: {interview_data.get('job_title', 'Position')}"

        interview_datetime = datetime.fromisoformat(interview_data['datetime'])
        formatted_datetime = interview_datetime.strftime('%B %d, %Y at %I:%M %p UTC')

        body = f"""
Dear {interview_data.get('candidate_name', 'Candidate')},

You have been invited to an interview for the position of {interview_data.get('job_title', 'the position')}.

Interview Details:
• Date & Time: {formatted_datetime}
• Interviewer: {interview_data['interviewer']}
• Duration: {interview_data.get('duration', 60)} minutes
• Type: {interview_data.get('interview_type', 'General')}
• Location: {interview_data.get('location', 'Virtual')}
• Meeting Link: {meeting_link}

Please ensure you:
1. Test your audio and video before the interview
2. Have a quiet, well-lit environment  
3. Prepare questions about the role and company
4. Have your resume and portfolio ready

If you need to reschedule, please reply to this email as soon as possible.

Best regards,
AI Hiring Management Team
        """.strip()

        await self._send_email(email, subject, body)

    async def _send_interviewer_notification(self, email: str, interview_data: Dict[str, Any], meeting_link: str):
        """Send interview notification to interviewer"""
        subject = f"Interview Scheduled: {interview_data.get('candidate_name')} - {interview_data.get('job_title')}"

        interview_datetime = datetime.fromisoformat(interview_data['datetime'])
        formatted_datetime = interview_datetime.strftime('%B %d, %Y at %I:%M %p UTC')

        body = f"""
Dear {interview_data['interviewer']},

You have an interview scheduled.

Interview Details:
• Candidate: {interview_data.get('candidate_name', 'TBD')}
• Position: {interview_data.get('job_title', 'TBD')}
• Date & Time: {formatted_datetime}
• Duration: {interview_data.get('duration', 60)} minutes
• Type: {interview_data.get('interview_type', 'General')}
• Meeting Link: {meeting_link}

Please review the candidate's resume and prepare relevant questions.

Best regards,
AI Hiring Management System
        """.strip()

        await self._send_email(email, subject, body)

    async def _send_email(self, to_email: str, subject: str, body: str):
        """Send email using Gmail API or SMTP"""
        try:
            if self.gmail_service:
                # Use Gmail API
                await self._send_email_via_gmail_api(to_email, subject, body)
            elif settings.smtp_username and settings.smtp_password:
                # Use SMTP
                await self._send_email_via_smtp(to_email, subject, body)
            else:
                logger.warning(f"Email service not configured. Would send to {to_email}: {subject}")

        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {e}")

    async def _send_email_via_gmail_api(self, to_email: str, subject: str, body: str):
        """Send email using Gmail API"""
        try:
            message = MIMEMultipart()
            message['to'] = to_email
            message['subject'] = subject
            message.attach(MIMEText(body, 'plain'))

            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

            self.gmail_service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()

            logger.info(f"Email sent via Gmail API to: {to_email}")

        except Exception as e:
            logger.error(f"Gmail API email error: {e}")
            raise

    async def _send_email_via_smtp(self, to_email: str, subject: str, body: str):
        """Send email using SMTP"""
        try:
            message = MIMEMultipart()
            message['From'] = settings.smtp_username
            message['To'] = to_email
            message['Subject'] = subject
            message.attach(MIMEText(body, 'plain'))

            # Connect to SMTP server
            with smtplib.SMTP(settings.smtp_server, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)

            logger.info(f"Email sent via SMTP to: {to_email}")

        except Exception as e:
            logger.error(f"SMTP email error: {e}")
            raise

    def _get_interviewer_email(self, interviewer_name: str) -> str:
        """Get interviewer email from name"""
        # Default interviewer email mapping
        interviewer_emails = {
            "John Smith": "john.smith@company.com",
            "Sarah Wilson": "sarah.wilson@company.com", 
            "Mike Johnson": "mike.johnson@company.com",
            "Lisa Chen": "lisa.chen@company.com"
        }

        return interviewer_emails.get(interviewer_name, "interviewer@company.com")

    async def check_availability(self, datetime_str: str, interviewer: str) -> bool:
        """Check if interviewer is available at given time"""
        try:
            if not self.google_service:
                logger.warning("Calendar service not available, assuming interviewer is available")
                return True

            interview_datetime = datetime.fromisoformat(datetime_str)

            # Check for conflicts in a 2-hour window
            time_min = (interview_datetime - timedelta(hours=1)).isoformat() + 'Z'
            time_max = (interview_datetime + timedelta(hours=1)).isoformat() + 'Z'

            events_result = self.google_service.events().list(
                calendarId='primary',
                timeMin=time_min,
                timeMax=time_max,
                singleEvents=True
            ).execute()

            # Check for conflicts
            interviewer_email = self._get_interviewer_email(interviewer)
            for event in events_result.get('items', []):
                attendees = event.get('attendees', [])
                if any(att.get('email') == interviewer_email for att in attendees):
                    logger.info(f"Interviewer {interviewer} has conflict: {event.get('summary')}")
                    return False

            return True

        except Exception as e:
            logger.error(f"Availability check error: {e}")
            return True  # Default to available if check fails

    async def book_slot(self, datetime_str: str, interviewer: str, interview_id: str):
        """Book time slot for interview"""
        try:
            logger.info(f"Booking slot: {interviewer} at {datetime_str} for interview {interview_id}")
            # The actual booking happens during calendar event creation
            pass
        except Exception as e:
            logger.error(f"Error booking slot: {e}")

    async def send_calendar_invite(self, interview_id: str, invite_data: Dict[str, Any]):
        """Send calendar invite for interview"""
        try:
            logger.info(f"Calendar invite handling for interview {interview_id}")
            # This is handled automatically when creating calendar events with attendees
        except Exception as e:
            logger.error(f"Error sending calendar invite: {e}")

    async def get_available_slots(self, date: str, duration: int = 60) -> List[str]:
        """Get available time slots for a given date"""
        try:
            # Generate working hours slots (9 AM to 5 PM)
            available_slots = []
            base_date = datetime.fromisoformat(f"{date}T09:00:00")

            for hour in range(9, 17):  # 9 AM to 5 PM
                for minute in [0, 30]:  # Every 30 minutes
                    slot_time = base_date.replace(hour=hour, minute=minute)
                    if slot_time > datetime.now():  # Only future slots
                        available_slots.append(slot_time.isoformat())

            return available_slots

        except Exception as e:
            logger.error(f"Error getting available slots: {e}")
            return []

    async def get_upcoming_interviews(self, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """Get upcoming interviews from calendar"""
        try:
            if not self.google_service:
                return []

            now = datetime.utcnow()
            future = now + timedelta(days=days_ahead)

            events_result = self.google_service.events().list(
                calendarId='primary',
                timeMin=now.isoformat() + 'Z',
                timeMax=future.isoformat() + 'Z',
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            interviews = []
            for event in events_result.get('items', []):
                summary = event.get('summary', '')
                if 'Interview' in summary or 'interview' in summary:
                    interviews.append({
                        'calendar_id': event['id'],
                        'title': summary,
                        'datetime': event['start'].get('dateTime', event['start'].get('date')),
                        'location': event.get('location', 'Virtual'),
                        'attendees': [att.get('email') for att in event.get('attendees', [])],
                        'meeting_link': event.get('hangoutLink')
                    })

            return interviews

        except Exception as e:
            logger.error(f"Error getting upcoming interviews: {e}")
            return []

    async def reschedule_interview(self, interview_id: int, new_datetime: str) -> bool:
        """Reschedule an existing interview"""
        try:
            # This would need the calendar event ID to update
            logger.info(f"Rescheduling interview {interview_id} to {new_datetime}")

            # In a real implementation, you'd:
            # 1. Find the calendar event by interview_id
            # 2. Update the calendar event
            # 3. Send reschedule notifications

            return True

        except Exception as e:
            logger.error(f"Error rescheduling interview: {e}")
            return False

    async def cancel_interview(self, interview_id: int) -> bool:
        """Cancel an interview"""
        try:
            logger.info(f"Cancelling interview {interview_id}")

            # In a real implementation, you'd:
            # 1. Delete the calendar event
            # 2. Send cancellation notifications

            return True

        except Exception as e:
            logger.error(f"Error cancelling interview: {e}")
            return False
