#!/bin/bash
echo "🚀 Starting AI Hiring Backend..."
echo "📊 API Documentation will be available at: http://localhost:8000/docs"
echo "🔍 Health check at: http://localhost:8000/health"
echo ""

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    echo "✅ Virtual environment activated"
fi

python enhanced_main_fixed.py
