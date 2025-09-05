#!/bin/bash

# AI Hiring Management System - Quick Setup Script
# Fixed Version with Interview Scheduling

echo "🚀 Setting up AI Hiring Management System (Fixed Version)..."
echo ""

# Check if Python is installed
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}' | awk -F. '{print $1}')
    if [ "$PYTHON_VERSION" -ge "3" ]; then
        echo "✅ Python 3 found"
        PYTHON_CMD="python"
    else
        echo "❌ Python 3 required. Please install Python 3.8+"
        exit 1
    fi
else
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

# Check if pip is installed
if command -v pip &> /dev/null; then
    echo "✅ pip found"
elif command -v pip3 &> /dev/null; then
    echo "✅ pip3 found"
    alias pip=pip3
else
    echo "❌ pip not found. Please install pip"
    exit 1
fi

# Create virtual environment (recommended)
echo ""
read -p "🤔 Create virtual environment? (recommended) [Y/n]: " CREATE_VENV
CREATE_VENV=${CREATE_VENV:-Y}

if [[ $CREATE_VENV =~ ^[Yy]$ ]]; then
    echo "📦 Creating virtual environment..."
    $PYTHON_CMD -m venv venv

    # Activate virtual environment
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    echo "✅ Virtual environment activated"
fi

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Error installing dependencies"
    exit 1
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p data
mkdir -p data/backups
echo "✅ Directories created"

# Setup database
echo ""
echo "🗄️ Initializing database..."
$PYTHON_CMD -c "
import asyncio
from enhanced_database import EnhancedDatabaseManager

async def init_db():
    db = EnhancedDatabaseManager()
    await db.initialize()
    print('✅ Database initialized')

asyncio.run(init_db())
"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "  Backend:"
echo "    $PYTHON_CMD enhanced_main_fixed.py"
echo ""
echo "  Frontend (in another terminal):"
echo "    $PYTHON_CMD -m http.server 3000"
echo ""
echo "  Then visit: http://localhost:3000"
echo ""
echo "📊 API Documentation: http://localhost:8000/docs"
echo "🔍 Health Check: http://localhost:8000/health"
echo ""
echo "🐳 Alternative: Use Docker Compose"
echo "    docker-compose up -d"
echo ""
echo "✨ Enjoy your FIXED interview scheduling system!"
