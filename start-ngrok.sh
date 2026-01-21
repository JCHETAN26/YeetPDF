#!/bin/bash

# Start ngrok tunnel for frontend
echo "🚀 Starting ngrok tunnel for PDFShare..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Install it with: brew install ngrok"
    exit 1
fi

# Check if ngrok is authenticated
if ! ngrok config check &> /dev/null; then
    echo "⚠️  ngrok is not authenticated. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "Then run: ngrok config add-authtoken YOUR_TOKEN"
    exit 1
fi

# Start ngrok tunnel on port 8080 (frontend)
echo "📡 Creating tunnel for http://localhost:8080..."
ngrok http 8080 --domain=beloved-mentally-dodo.ngrok-free.app
