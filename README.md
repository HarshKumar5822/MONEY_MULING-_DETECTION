# MuleGuard | Graph-Based Financial Forensics Engine
## RIFT 2026 Hackathon - Money Muling Detection Challenge

MuleGuard is a high-performance, real-time forensic engine designed to uncover sophisticated money muling networks that traditional database queries often miss.

### 🚀 Live Demo & Repo
- **Live App**: [Live Application URL]
- **Repo**: [GitHub Repository URL]
- **Demo Video**: [LinkedIn Video Link]

### 🛠 Tech Stack
- **Backend**: Python 3.10+, FastAPI (High-performance API), NetworkX (Graph Algorithms), Pandas (Data Processing).
- **Frontend**: React 18, Vite, TailwindCSS, TypeScript, Framer Motion (Animations).
- **Visualization**: React-Force-Graph (Canvas-based 2D WebGL rendering).

### 🏗 System Architecture
MuleGuard follows a decoupled **Client-Server Architecture**:
1. **Ingestion Layer**: Sanitizes and transforms CSV transaction logs into a Directed Graph.
2. **Analysis Engine**: Executes parallel detector passes (Cycles, Smurfing, Shells).
3. **Scoring Model**: Aggregates pattern hits into a normalized 0-100 Suspicion Score.
4. **Visualization Layer**: Renders an interactive WebGL graph with real-time forensic overlays.

### 🧠 Algorithm Approach & Complexity Analysis

#### 1. Circular Fund Routing (Cycles)
- **Algorithm**: Depth-Limited DFS (Depth 3-5).
- **Complexity**: $O(V + E \times k^d)$ where $k$ is avg degree and $d$ is depth.
- **Why**: Optimized to find tight loops in milliseconds without exploring exponential simple cycles.

#### 2. Smurfing Patterns (Fan-in / Fan-out)
- **Algorithm**: Temporal Sliding Window (72h).
- **Complexity**: $O(T \log T)$ due to timestamp sorting + $O(T)$ linear scan.
- **Why**: Detects high-velocity aggregation/dispersion within critical time windows.

#### 3. Layered Shell Networks
- **Algorithm**: 3-Hop Chain Discovery with Degree Filtering.
- **Complexity**: $O(V_{shell} \times k^2)$ where $V_{shell} \subset V$ are nodes with degree 2-3.
- **Why**: Specifically targets intermediate "passthrough" accounts used for layering.

### 📈 Suspicion Score Methodology
Scores are normalized (0-100) based on weighted pattern hits:
| Pattern | Weight | Description |
| :--- | :--- | :--- |
| **Cycle Member** | +80 | High-confidence circular routing detected. |
| **Smurfing (Fan-in/Out)** | +30 | High-velocity multiple source/destination activity. |
| **Shell Member** | +40 | Part of a layered passthrough network. |
| **Max Cap** | 100 | Scores are capped at 100 for forensic reporting. |

### ⚙️ Installation & Setup

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --port 8001
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### ⚠️ Known Limitations & Future Work
- **Static Window**: Currently uses a fixed 72h window; future versions will support dynamic windowing.
- **Memory Bound**: Large graphs (>50k nodes) may require a graph database like Neo4j for persistent analysis.

### 👥 Team Members
- [Your Name/Team Name]

---
*Built for RIFT 2026 Hackathon*
