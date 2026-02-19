# Money Muling Detection Engine
## RIFT 2026 Hackathon - Graph Theory Track

A comprehensive high-performance Financial Forensics Engine designed to detect money muling networks using Graph Theory and Temporal Analysis.

### 🚀 Live Demo & Repo
- **Repo**: [GitHub Repository URL]
- **Live App**: [Live Application URL]

### 🛠 Tech Stack
- **Backend**: Python, FastAPI, NetworkX, Pandas, Uvicorn
- **Frontend**: React, Vite, TailwindCSS, TypeScript
- **Analysis**: Graph Theory (Cycles, Patterns), Temporal Sliding Windows

### 📂 Project Structure
```
FinGraph_Forensics/
├── backend/                # FastAPI Application
│   ├── main.py             # Core Logic & API
│   ├── requirements.txt    # Python Dependencies
│   └── test_app.py         # Verification Script
├── frontend/               # React Web Application
│   ├── src/                # Source Code
│   └── package.json        # Node Dependencies
└── start_app.bat           # One-click startup script
```

### ⚡ Quick Start (Windows)

#### Method 1: One-Click (Recommended)
Double-click `start_app.bat` in the root directory.

#### Method 2: Manual Startup

**Terminal 1: Backend**
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8001 --reload
```
*Runs on: http://127.0.0.1:8001*

**Terminal 2: Frontend**
```powershell
cd frontend
npm install
npm run dev
```
*Runs on: http://localhost:8080 or http://localhost:5173*

### 🧠 Graph Theory & Algorithms

#### 1. Cycle Detection (Circular Fund Routing)
We use a **Depth-Limited Search (DLS)** approach via `networkx` to detect simple cycles of length 3, 4, and 5.
- **Why**: Muling rings often move money in loops to obscure the source.
- **Complexity**: Optimized for sparse financial graphs.

#### 2. Smurfing Detection (Temporal Fan-in/Fan-out)
We implement a **72-hour sliding window** algorithm.
- **Fan-in**: Detects accounts receiving funds from >10 unique sources within 3 days.
- **Fan-out**: Detects accounts sending funds to >10 unique destinations within 3 days.

#### 3. Suspicion Scoring (0-100)
- **Base Score**: 0
- **+50**: Member of a Cycle (Ring)
- **+30**: Fan-in Pattern
- **+30**: Fan-out Pattern
- **Cap**: 100

### 🧪 Verification
To verify the backend logic independently (ensure backend is running):
```bash
python backend/test_app.py
```

### ⚠️ Common Issues
- **Port 8001/8080 in use**: Close other terminals or change the port in `main.py` and `frontend/src/services/api.ts`.
- **"npm" not found**: Ensure Node.js is installed.

---
*Built for RIFT 2026*
