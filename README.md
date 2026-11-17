# 🤖 Multi-Agent AI Interview System

An enterprise-grade, full-stack interview simulation platform that leverages **Multi-Agent Architecture**, **Retrieval-Augmented Generation (RAG)**, and **Real-Time Proctoring** to conduct personalized, context-aware technical interviews with automated scoring and comprehensive admin oversight.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## 🚀 Key Features

### 🧠 Multi-Agent AI Core
- **RAG-Aware Interviewer Agent:** Conducts structured interviews by parsing uploaded PDF resumes using `pypdf`, chunking data, and storing embeddings in **ChromaDB** to ask highly personalized questions based on actual candidate experience.
- **AI Evaluator Agent:** Automatically analyzes Q&A history post-interview to generate structured Technical and Behavioral scores, detailed strengths/weaknesses, and actionable career recommendations.
- **Override Grading System:** Admins can manually adjust AI-generated scores with a mandatory reason field; changes are permanently flagged with `admin_override=True` for audit transparency.

### 🔐 Enterprise-Grade Security & Authentication
- **Live Webcam Snapshot Capture:** HTML5 Canvas captures real frames every 10 seconds during interviews, stored securely and viewable in the Admin Evidence Viewer.
- **Tab-Switch & Blur Detection:** Uses `visibilitychange` API to log violations; auto-submits interview after 3 strikes with violation evidence preserved.
- **2FA Email OTP Authentication:** Secure signup/login/forgot-password flows using `Flask-Mail` with hashed, time-bound (5-min) OTPs and strict attempt limits to prevent brute-force attacks.
- **Anti-Cheat Measures:** Copy/paste (Ctrl+C/V) and right-click disabled during active sessions; microphone audio visualizer confirms active listening.
- **Role-Based Access Control (RBAC):** Strict JWT-protected separation of Candidate and Admin portals with dedicated `ProtectedRoute` wrappers.
- **Dynamic Proctoring Configuration:** Frontend fetches `/api/proctoring-config` on load to respect admin-controlled `max_violations` and `webcam_enabled` settings.
- **Server-Side Violation Logging:** All tab-switch/blur events are persisted to PostgreSQL via `POST /api/violation` with automatic interview termination on threshold breach.

### ⚙️ Robust Backend & DevOps
- **Secure File Uploads:** Validates PDF "magic bytes", enforces size limits, and uses UUIDs to prevent directory traversal and filename clashes.
- **Session Management:** Auto-marks abandoned interviews after 2 hours of inactivity, with a seamless **Resume Interview** flow for candidates to pick up where they left off.
- **Production Deployment:** Fully containerized with **Docker**, **Nginx** (SPA fallback routing), and **Gunicorn** (multi-worker) for scalable, concurrent request handling.
- **Cascade Deletes:** Ensures data integrity; deleting a user automatically purges all associated sessions, feedback, and snapshots.

### 📊 Advanced Analytics & Reporting
- **Dynamic Verdict Badge:** Feedback page displays "STRONG HIRE", "CONSIDER", or "REJECT" badge based on weighted average score thresholds.
- **Progress Tracking:** Interactive Recharts Line Charts on Dashboard visualize Technical/Behavioral score trends across multiple interviews.
- **PDF Report Export:** One-click generation of professionally formatted Feedback Reports and Violation Logs using `jspdf` and `html2canvas`.
- **Admin Management Suite:** Comprehensive dashboard with sortable/paginated user tables, deep-dive transcript modals, agent deliberation stream logs, and system-wide analytics.

### 🎨 Modern UI/UX
- **Glassmorphism Design System:** Translucent cards, backdrop-blur effects, neon accents, and subtle borders throughout.
- **3-Way Theme Toggle:** Light/Dark/System mode with OS-preference detection and localStorage persistence.
- **Monaco Code Editor:** Full VS Code engine (`@monaco-editor/react`) with syntax highlighting, line numbers, and auto-indentation.
- **Centralized API Layer:** Single Axios instance auto-attaches JWTs and handles 401 redirects globally, eliminating hardcoded URLs.

---

## 🏗️ System Architecture

The system operates on a decoupled, multi-agent pipeline:
1. **Ingestion:** Resume upload → Parser Agent extracts text → Vector embeddings stored in ChromaDB.
2. **Interview:** Job role selection → Interviewer Agent queries ChromaDB (RAG) → LLM generates context-aware questions → Real-time webcam snapshots captured.
3. **Evaluation:** Transcript analysis → Evaluator Agent generates scores/feedback → Saved to PostgreSQL → Automated email report triggered.
4. **Administration:** RBAC authentication → Protected routes for user management, evidence review, override grading, and system configuration.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, Recharts, Axios, React Router DOM, Monaco Editor, jsPDF |
| **Backend** | Python, Flask, Flask-CORS, Flask-SQLAlchemy, Flask-Mail, Flask-Limiter, PyJWT, Gunicorn |
| **Databases** | PostgreSQL (Relational), ChromaDB (Vector/RAG) |
| **AI / LLM** | LangChain, Groq API, Web Speech API, HTML5 Canvas |
| **DevOps** | Docker, Docker Compose, Nginx, Pytest |

---

## 📦 Installation & Setup

### 🐳 Recommended: Docker Setup (Production Ready)
This is the fastest and most reliable way to run the entire stack (Frontend, Backend, PostgreSQL) simultaneously.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Biswa2531/multi-agent-interview-system.git
   cd multi-agent-interview-system
   ```

2. **Configure Environment:**
   Create a file named `backend/.env` and populate it with your credentials:
   ```env
   # Database (Docker network defaults)
   DATABASE_URL=postgresql://postgres:postgres@interview_db:5432/interview_db

   GROQ_MODEL=qwen-model
   FRONTEND_URL=http://localhost:5173

   # AI & RAG
   GROQ_API_KEY=your_groq_api_key_here

   # Email (Use a Gmail App Password, NOT your regular password)
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_16_char_gmail_app_password

   # Security
   SECRET_KEY=your_super_secret_flask_key_here
   ```

3. **Build and Start the Containers:**
   ```bash
   docker compose up -d --build
   ```
   *(This installs dependencies, builds the React app, configures Nginx, and starts Gunicorn).*

4. **Create the First Admin User:**
   Sign up a normal user via the frontend UI (e.g., `admin@test.com`), then promote them via the dev endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/dev/promote-to-admin \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@test.com"}'
   ```

5. **Access the Application:**
   Open your browser and navigate to: 👉 **http://localhost**

---

### 💻 Alternative: Local Development Setup
*(Use this only if you prefer not to use Docker)*

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Automated Testing

The backend includes a Pytest suite to mathematically verify security decorators and routing integrity.

To run the tests inside the Docker container:
```bash
docker compose exec backend pytest tests/ -v
```

**Expected Output:**
```text
tests/test_security.py::test_admin_route_blocks_unauthenticated_users PASSED
tests/test_security.py::test_admin_route_blocks_invalid_tokens PASSED
tests/test_security.py::test_user_stats_route_blocks_unauthenticated_users PASSED
============================== 3 passed in 1.23s ==============================
```

---

## 📂 Project Structure

```text
multi-agent-interview-system/
├── backend/
│   ├── app.py                  # Main Flask application & all API routes
│   ├── models.py               # SQLAlchemy models (User, Session, Feedback, Violation, etc.)
│   ├── requirements.txt        # Python dependencies (includes pytest)
│   ├── tests/                  # Pytest automated test suites
│   │   ├── __init__.py
│   │   └── test_security.py    # Security decorator validation tests
│   ├── utils/                  # Utility functions (e.g., resume_parser.py)
│   ├── uploads/                # Uploaded resumes & proctoring snapshots
│   └── Dockerfile              # Multi-stage Python/Gunicorn build
├── frontend/
│   ├── src/
│   │   ├── api.js              # Centralized Axios instance (auto-JWT, 401 handling)
│   │   ├── components/         # Shared components (ProtectedRoute, StarryBackground)
│   │   └── pages/              # Main page views (Dashboard, Interview, Admin panels)
│   ├── nginx.conf              # Nginx SPA fallback & reverse proxy config
│   └── Dockerfile              # Multi-stage Node/Nginx build
├── docker-compose.yml          # Orchestrates Backend, Frontend, and PostgreSQL
├── README.md                   # You are here!
└── .gitignore
```

> **Note:** This project is developed for academic purposes as part of the MCA final year curriculum. All AI interactions are simulated using the Groq API for rapid, low-latency inference.

---

## 👨‍💻 Author

**Biswajit Rout**