# 🤖 Multi-Agent AI Interview System

An enterprise-grade, full-stack interview simulation platform that leverages **Multi-Agent Architecture** and **Retrieval-Augmented Generation (RAG)** to conduct personalized, context-aware technical interviews and provide automated, actionable career coaching.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-FFD166?style=for-the-badge&logo=chroma&logoColor=black)

---

## 🚀 Key Features

### 🧠 Multi-Agent AI Core
- **RAG-Aware Interviewer Agent:** Conducts structured interviews. Parses uploaded PDF resumes using `pypdf`, chunks the data, and stores it in **ChromaDB** to ask highly personalized, context-aware questions based on the candidate's actual skills and experience.
- **AI Evaluator Agent (Career Coach):** Automatically analyzes the Q&A history post-interview to generate structured Technical and Behavioral scores, along with detailed strengths, weaknesses, and career recommendations.

### 🔐 Enterprise-Grade Security & Authentication
- **2-Step Verification (2FA):** Secure email-based OTP login and signup flows using `Flask-Mail`.
- **Forgot Password Flow:** Multi-step, glassmorphic modal for secure password resets with strict session tagging to prevent OTP misuse.
- **Role-Based Access Control (RBAC):** Strict separation of Candidate and Admin portals with JWT token validation and protected API routes.

### 📊 Advanced Analytics & Reporting
- **Progress Tracking:** Interactive **Recharts Line Charts** on the Candidate Dashboard to visualize Technical and Behavioral score improvements over time.
- **Skill Mapping:** Radar charts on the feedback page to map candidate skill distributions against industry benchmarks.
- **PDF Export:** Generate and download professionally formatted evaluation reports using `jspdf` and `html2canvas`.
- **Admin Management Panel:** Comprehensive dashboard for administrators to view system-wide metrics, search users, delete accounts, and reset candidate passwords.

### 🎨 Modern UI/UX & Interview Enhancements
- **Glassmorphism Design System:** Beautiful, translucent UI components with backdrop blur and subtle borders.
- **3-Way Theme Toggle:** Seamless switching between Light, Dark, and System (OS-preference detection) modes, with floating toggles on auth pages.
- **Monaco Code Editor:** Integrated VS Code engine (`@monaco-editor/react`) for realistic technical coding rounds with syntax highlighting.
- **Voice-to-Text:** Hands-free answer input using the Web Speech API.

---

## 🏗️ System Architecture

The system operates on a decoupled, multi-agent pipeline:
1. **Ingestion:** Candidate uploads a resume $\rightarrow$ Parser Agent extracts text $\rightarrow$ Vector embeddings stored in ChromaDB.
2. **Interview:** Candidate selects a Job Role $\rightarrow$ Interviewer Agent queries ChromaDB (RAG) $\rightarrow$ LLM (Groq) generates context-aware questions.
3. **Evaluation:** Upon completion, Evaluator Agent analyzes the transcript $\rightarrow$ Generates scores/feedback $\rightarrow$ Saves to PostgreSQL $\rightarrow$ Triggers automated email report.
4. **Administration:** Admin authenticates via RBAC $\rightarrow$ Accesses protected routes to moderate users and review system metrics.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Vite, Tailwind CSS, Recharts, Axios, React Router DOM, Monaco Editor |
| **Backend** | Python, Flask, Flask-CORS, Flask-Mail, Flask-SQLAlchemy, PyJWT |
| **Databases** | PostgreSQL (Relational Data), ChromaDB (Vector Database for RAG) |
| **AI / LLM** | LangChain, Groq API (Qwen/Llama Models), Web Speech API |
| **Tools** | pgAdmin, Git, VS Code, Postman |

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+) & npm
- Python 3.10+
- PostgreSQL installed and running
- A valid **Groq API Key** and an SMTP Email account (e.g., Gmail App Password)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install flask flask-cors flask-sqlalchemy flask-mail psycopg2-binary langchain-groq pypdf chromadb pyjwt werkzeug python-dotenv

# Create a .env file in the backend folder and add your credentials:
# .env
SECRET_KEY=your_super_secret_key
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/interview_db

# Email Configuration (Example for Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Backend setup
# Navigate to frontend directory
cd backend

# Initialize the database and run the server
python app.py

# Frontend Setup
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
The application will be available at http://localhost:5173

###📂 Project Structure
multi-agent-interview-system/
├── backend/
│   ├── app.py                 # Main Flask application & API routes
│   ├── config.py              # Environment and DB configuration
│   ├── models.py              # SQLAlchemy ORM models (User, Session, Question, Feedback)
│   ├── agents/                # LangChain agent logic (interviewer.py, evaluator.py)
│   ├── utils/                 # Resume parser and ChromaDB utilities
│   └── uploads/               # Temporary storage for parsed resumes
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI (Navbar, StarryBackground, Modals)
│   │   ├── pages/             # Route views (Login, Dashboard, AdminDashboard, Interview)
│   │   └── App.jsx            # Main routing configuration
│   └── package.json
└── README.md

Note: This project is developed for academic purposes as part of the MCA final year curriculum. All AI interactions are simulated using the Groq API for rapid, low-latency inference.