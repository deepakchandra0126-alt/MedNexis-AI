#!/bin/bash
echo "🏥 HealthAI Quick Setup"
echo "========================"

echo ""
echo "📦 [1/3] Installing backend..."
cd backend && npm install && cp .env.example .env
echo "✅ Backend ready"

echo ""
echo "📦 [2/3] Installing frontend..."
cd ../frontend && npm install
echo "✅ Frontend ready"

echo ""
echo "✅ [3/3] ML model is pre-trained (no setup needed!)"

echo ""
echo "=============================="
echo "🎉 Setup done! Now start the services:"
echo ""
echo "Terminal 1 (ML):       cd ml && python app.py"
echo "Terminal 2 (Backend):  cd backend && node server.js"
echo "Terminal 3 (Frontend): cd frontend && npm start"
echo ""
echo "Then open: http://localhost:3000"
