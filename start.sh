#!/bin/bash
# Simple startup script for AI Hiring Management System

echo "Starting AI Hiring Management System..."

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    echo "Virtual environment activated"
else
    echo "Virtual environment not found. Please run setup first."
    exit 1
fi

# Check configuration
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.template .env
    echo "Please edit .env file with your API credentials"
fi

# Start the server
echo "Starting server on http://localhost:8000"
echo "Frontend: http://localhost:8000/app"
echo "API Docs: http://localhost:8000/docs"

python fixed_main.py
