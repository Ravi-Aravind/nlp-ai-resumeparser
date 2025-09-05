@echo off
echo Starting AI Hiring Management System...

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    echo Virtual environment activated
) else (
    echo Virtual environment not found. Please run setup first.
    pause
    exit /b 1
)

REM Check configuration
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.template .env
    echo Please edit .env file with your API credentials
)

REM Start the server
echo Starting server on http://localhost:8000
echo Frontend: http://localhost:8000/app
echo API Docs: http://localhost:8000/docs

python fixed_main.py
pause
