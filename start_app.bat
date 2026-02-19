@echo off
echo Starting Money Muling Detection Engine...

:: Start Backend
start "Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn main:app --port 8001 --reload"

:: Start Frontend
start "Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo Backend running on http://localhost:8001
echo Frontend running on http://localhost:8080 (or check console)
echo.
pause
