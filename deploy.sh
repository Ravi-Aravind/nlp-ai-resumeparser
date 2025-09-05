#!/bin/bash
# Deployment script for AI Hiring Management System

echo "🚀 Deploying AI Hiring Management System..."

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

# Activate virtual environment
source venv/bin/activate || venv\Scripts\activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Download spaCy model
echo "Downloading spaCy language model..."
python -m spacy download en_core_web_sm

# Create necessary directories
echo "Creating directories..."
mkdir -p uploads
mkdir -p data
mkdir -p data/backups
mkdir -p static

# Copy frontend files to static directory
echo "Copying frontend files..."
cp index.html static/
cp fixed_app.js static/app.js
cp style.css static/

# Check configuration
echo "Validating configuration..."
python -c "from config import validate_configuration; validate_configuration()"

# Start the application
echo "🎯 Starting application..."
echo "Frontend: http://localhost:8000/app"
echo "API Documentation: http://localhost:8000/docs"
echo "Health Check: http://localhost:8000/health"

python fixed_main.py
