#!/usr/bin/env python3
"""
Integration testing script for AI Hiring Management System
Tests all components and their integration
"""

import asyncio
import logging
import sys
import os
import json
import requests
import time
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IntegrationTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.api_available = False
        self.test_results = []

    def print_header(self, message):
        print(f"\n{'='*60}")
        print(f"🧪 {message}")
        print('='*60)

    def print_test(self, test_name, status, details=""):
        symbol = "✅" if status else "❌"
        print(f"{symbol} {test_name}")
        if details:
            print(f"   {details}")
        self.test_results.append({"test": test_name, "passed": status, "details": details})

    async def test_backend_modules(self):
        """Test backend module imports and basic functionality"""
        self.print_header("Testing Backend Modules")

        # Test configuration
        try:
            from config import settings
            self.print_test("Configuration module", True, f"Environment: {settings.environment}")
        except Exception as e:
            self.print_test("Configuration module", False, str(e))

        # Test resume parser
        try:
            from fixed_enhanced_resume_parser import EnhancedResumeParser
            parser = EnhancedResumeParser()
            self.print_test("Resume parser module", True, "Module loaded successfully")

            # Test with sample text if resume file exists
            if os.path.exists('resume.docx'):
                try:
                    result = await parser.parse_resume('resume.docx')
                    self.print_test("Resume parsing test", True, f"Parsed: {result.get('name', 'Unknown')}")
                except Exception as e:
                    self.print_test("Resume parsing test", False, str(e))
        except Exception as e:
            self.print_test("Resume parser module", False, str(e))

        # Test skill matcher
        try:
            from enhanced_skill_matcher import EnhancedSkillMatcher
            matcher = EnhancedSkillMatcher()

            # Test basic matching
            result = matcher.calculate_enhanced_match(
                ["Python", "React", "JavaScript"],
                ["Python", "JavaScript", "Node.js"]
            )
            self.print_test("Skill matcher module", True, f"Match score: {result.get('score', 0):.1f}%")
        except Exception as e:
            self.print_test("Skill matcher module", False, str(e))

        # Test database
        try:
            from enhanced_database import EnhancedDatabaseManager
            db = EnhancedDatabaseManager()
            await db.initialize()
            self.print_test("Database module", True, "Database initialized")
        except Exception as e:
            self.print_test("Database module", False, str(e))

        # Test scheduler
        try:
            from fixed_enhanced_scheduler import EnhancedInterviewScheduler
            scheduler = EnhancedInterviewScheduler()
            self.print_test("Scheduler module", True, "Scheduler loaded (APIs may need credentials)")
        except Exception as e:
            self.print_test("Scheduler module", False, str(e))

    async def test_api_endpoints(self):
        """Test API endpoints"""
        self.print_header("Testing API Endpoints")

        # Test health endpoint
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.api_available = True
                self.print_test("Health endpoint", True, f"Status: {data.get('status')}")
            else:
                self.print_test("Health endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_test("Health endpoint", False, "API server not running")
            return

        # Test jobs endpoint
        try:
            response = requests.get(f"{self.base_url}/api/jobs", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.print_test("Jobs endpoint", True, f"Found {len(data.get('jobs', []))} jobs")
            else:
                self.print_test("Jobs endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_test("Jobs endpoint", False, str(e))

        # Test candidates endpoint
        try:
            response = requests.get(f"{self.base_url}/api/candidates", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.print_test("Candidates endpoint", True, f"Found {len(data.get('candidates', []))} candidates")
            else:
                self.print_test("Candidates endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_test("Candidates endpoint", False, str(e))

        # Test dashboard endpoint
        try:
            response = requests.get(f"{self.base_url}/api/analytics/dashboard", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.print_test("Dashboard endpoint", True, f"Analytics data loaded")
            else:
                self.print_test("Dashboard endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.print_test("Dashboard endpoint", False, str(e))

    async def test_frontend_files(self):
        """Test frontend file availability"""
        self.print_header("Testing Frontend Files")

        frontend_files = [
            ('index.html', 'Main HTML file'),
            ('fixed_app.js', 'JavaScript application'),
            ('style.css', 'CSS styling'),
            ('static/index.html', 'Static HTML copy'),
            ('static/app.js', 'Static JS copy'),
            ('static/style.css', 'Static CSS copy')
        ]

        for filename, description in frontend_files:
            if os.path.exists(filename):
                file_size = os.path.getsize(filename)
                self.print_test(f"Frontend file: {filename}", True, f"{description} ({file_size} bytes)")
            else:
                self.print_test(f"Frontend file: {filename}", False, f"{description} - File missing")

    async def test_configuration(self):
        """Test configuration files"""
        self.print_header("Testing Configuration")

        config_files = [
            ('.env', 'Environment configuration'),
            ('.env.template', 'Environment template'),
            ('credentials.json', 'Google API credentials'),
            ('credentials.json.template', 'Credentials template'),
            ('requirements.txt', 'Python dependencies')
        ]

        for filename, description in config_files:
            if os.path.exists(filename):
                self.print_test(f"Config: {filename}", True, description)
            else:
                self.print_test(f"Config: {filename}", False, f"{description} - Missing")

    async def test_directory_structure(self):
        """Test directory structure"""
        self.print_header("Testing Directory Structure")

        directories = [
            ('data', 'Database storage'),
            ('data/backups', 'Database backups'),
            ('uploads', 'Resume file storage'),
            ('static', 'Static files for frontend'),
            ('venv', 'Python virtual environment')
        ]

        for dirname, description in directories:
            if os.path.exists(dirname) and os.path.isdir(dirname):
                self.print_test(f"Directory: {dirname}", True, description)
            else:
                self.print_test(f"Directory: {dirname}", False, f"{description} - Missing")

    def generate_report(self):
        """Generate test report"""
        self.print_header("Test Summary Report")

        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['passed'])

        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")

        if passed_tests == total_tests:
            print("\n🎉 All tests passed! Your system is ready to use.")
        elif passed_tests >= total_tests * 0.8:
            print("\n⚠️ Most tests passed. System should work with minor issues.")
        else:
            print("\n❌ Many tests failed. Please resolve issues before deployment.")

        # Show failed tests
        failed_tests = [r for r in self.test_results if not r['passed']]
        if failed_tests:
            print("\nFailed Tests:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")

    async def run_all_tests(self):
        """Run all integration tests"""
        print("AI Hiring Management System - Integration Test Suite")
        print(f"Testing from directory: {os.getcwd()}")

        await self.test_directory_structure()
        await self.test_configuration()
        await self.test_frontend_files()
        await self.test_backend_modules()

        # Test API if server is running
        print(f"\nTrying to connect to API server at {self.base_url}...")
        time.sleep(1)  # Give server time to respond

        await self.test_api_endpoints()

        self.generate_report()

async def main():
    """Main test function"""
    tester = IntegrationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nTest suite error: {e}")
        sys.exit(1)
