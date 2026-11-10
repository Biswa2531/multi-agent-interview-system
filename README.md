# 🤖 Multi-Agent AI Interview System

An enterprise-grade, full-stack interview simulation platform that leverages **Multi-Agent Architecture**, **Retrieval-Augmented Generation (RAG)**, and **Real-Time Proctoring** to conduct personalized, context-aware technical interviews with automated scoring and comprehensive admin oversight.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-FFD166?style=for-the-badge&logo=chroma&logoColor=black)

---

## 🚀 Key Features

### 🧠 Multi-Agent AI Core
**RAG-Aware Interviewer Agent:** Conducts structured interviews by parsing uploaded PDF resumes using `pypdf`, chunking data, and storing embeddings in **ChromaDB** to ask highly personalized questions based on actual candidate experience.
- **AI Evaluator Agent (Career Coach):** Automatically analyzes Q&A history post-interview to generate structured Technical and Behavioral scores, detailed strengths/weaknesses, and actionable career recommendations.
- **Override Grading System:** Admins can manually adjust AI-generated scores with a mandatory reason field; changes are permanently flagged with `admin_override=True` for audit transparency.

### 🔐 Enterprise-Grade Security & Authentication
- **Live Webcam Snapshot Capture:** HTML5 Canvas captures real frames every 10 seconds during interviews, stored securely and viewable in the Admin Evidence Viewer.
- **Tab-Switch & Blur Detection:** Uses `visibilitychange` API to log violations; auto-submits interview after 3 strikes with violation evidence preserved.
- **2FA Email OTP Authentication:** Secure signup/login/forgot-password flows using `Flask-Mail` with session-tagged OTPs to prevent misuse.
- **Anti-Cheat Measures:** Copy/paste (Ctrl+C/V) and right-click disabled during active sessions; microphone audio visualizer confirms active listening.
- **Role-Based Access Control (RBAC):** Strict JWT-protected separation of Candidate and Admin portals with dedicated glassmorphic sidebar navigation.

### 📊 Advanced Analytics & Reporting
- **Dynamic Verdict Badge:** Feedback page displays "STRONG HIRE", "CONSIDER", or "REJECT" badge based on weighted average score thresholds.
- **Progress Tracking:** Interactive Recharts Line Charts on Dashboard visualize Technical/Behavioral score trends across multiple interviews.
- **Skill Radar Mapping:** Compares candidate skill distribution against industry benchmarks with cumulative metric rings.
- **PDF Report Export:** One-click generation of professionally formatted Feedback Reports and Violation Logs using `jspdf`.
- **Admin Management Suite:** Comprehensive dashboard with sortable/paginated user tables, deep-dive transcript modals, agent deliberation stream logs, and system-wide analytics (bar charts, pie charts).

### 🎨 Modern UI/UX & Interview Enhancements
- **Glassmorphism Design System:** Translucent cards, backdrop-blur effects, neon accents, and subtle borders throughout.
- **3-Way Theme Toggle:** Light/Dark/System mode with OS-preference detection and localStorage persistence.
- **Monaco Code Editor:** Full VS Code engine (`@monaco-editor/react`) with syntax highlighting, line numbers, and auto-indentation.
- **Voice-to-Text Input:** Hands-free answer submission via Web Speech API with animated soundwave visualization.
- **Hint Agent:** Contextual coding hints available at cost of minor score penalty (max 3 per session).

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
| **Backend** | Python, Flask, Flask-CORS, Flask-SQLAlchemy, Flask-Mail, PyJWT, SQLAlchemy 2.0 |
| **Databases** | PostgreSQL (Relational), ChromaDB (Vector/RAG) |
| **AI / LLM** | LangChain, Groq API (Qwen/Llama), Web Speech API, HTML5 Canvas |
| **Tools** | pgAdmin, Git, VS Code, Postman |
---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+) & npm
- Python 3.10+
- PostgreSQL installed and running
- Valid **Groq API Key** and SMTP Email account (Gmail App Password recommended)

### 1. Backend Setup
```bash
\cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install flask flask-cors flask-sqlalchemy flask-mail psycopg2-binary langchain-groq pypdf chromadb pyjwt werkzeug python-dotenv
```

Create a `.env` file in the `backend` folder and add your credentials:
```env
SECRET_KEY=your_super_secret_key
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/interview_db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
CHROMA_HOST=localhost
CHROMA_PORT=8000```

```bash
# Initialize the database and run the server
python app.py
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The application will be available at `http://localhost:5173`*

---

## 📂 Project Structure
```text
multi-agent-interview-system/
├── backend/
│   ├── app.py                  # Main Flask application & all API routes
│   ├── models.py               # SQLAlchemy models (User, Session, Feedback, Violation, etc.)
│   ├── config.py               # Configuration loader
│   ├── agents/                 # Multi-agent logic
│   │   ├── interviewer.py      # Sophia v4.2 - Question generation & conversation
│   │   └── evaluator.py        # Chronos v2.1 - Real-time scoring & feedback
│   ├── utils/                  # Utility functions
│   │   └── resume_parser.py    # PDF parsing & ChromaDB vector ingestion
│   ├── uploads/                # Uploaded resumes & proctoring snapshots
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx       # 2FA OTP login/signup
│   │   │   ├── Dashboard.jsx   # User dashboard with progress charts
│   │   │   ├── Interview.jsx   # Split-screen live interview session
│   │   │   ├── Feedback.jsx    # Post-assessment report with verdict badge
│   │   │   ├── Profile.jsx     # User profile & resume management
│   │   │   ├── AdminDashboard.jsx  # Admin analytics overview
│   │   │   ├── AdminUsers.jsx      # Candidate management with pagination
│   │   │   ├── AdminInterviews.jsx # Interview repository with sorting
│   │   │   ├── AdminProctoring.jsx # Security evidence viewer
│   │   │   └── AdminSettings.jsx   # System configuration
│   │   ├── components/         # Shared components
│   │   │   ├── Navbar.jsx      # Glassmorphic nav with status badge
│   │   │   ├── AdminLayout.jsx # Sidebar navigation for admin panel
│   │   │   └── StarryBackground.jsx # Animated background effect
│   │   ├── App.jsx             # Router & layout composition
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── uploads/                    # Server-side file storage
├── README.md                   # This file
└── .gitignore
```

> **Note:** This project is developed for academic purposes as part of the MCA final year curriculum. All AI interactions are simulated using the Groq API for rapid, low-latency inference.