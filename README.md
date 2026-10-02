# Multi-Agent AI Interview System

An AI-powered, full-stack interview simulation platform that uses Multi-Agent Architecture and Retrieval-Augmented Generation (RAG) to conduct personalized technical interviews and provide automated career coaching.

## 🚀 Features
- **AI Interviewer Agent:** Conducts structured, 5-question technical interviews.
- **RAG (Resume Parsing):** Upload a PDF resume; the AI reads it using ChromaDB and asks personalized questions based on your specific projects and skills.
- **Contextual Bridging:** The AI intelligently maps your past experience to the specific job role you are applying for.
- **AI Evaluator Agent (Career Coach):** Automatically scores the interview (Technical & Behavioral) and provides actionable feedback.
- **Persistent Storage:** All interview sessions and feedback are saved in a PostgreSQL database.
- **Admin Dashboard:** View past interview records and detailed Q&A logs.

## ️ Tech Stack
- **Frontend:** React.js, Vite, Axios
- **Backend:** Python, Flask, SQLAlchemy
- **Database:** PostgreSQL (Relational), ChromaDB (Vector Database for RAG)
- **AI/LLM:** LangChain, Groq API (Qwen Model)
- **Tools:** pgAdmin, Git

## 🏗️ Architecture
The system uses a Multi-Agent approach:
1. **Parser Agent:** Extracts text from PDFs and stores vector embeddings in ChromaDB.
2. **Interviewer Agent:** Uses LangChain to query the Vector DB (RAG) and generate context-aware questions via LLM.
3. **Evaluator Agent:** Analyzes the Q&A history to generate a structured feedback report.

## 📦 Installation & Setup

### Prerequisites
- Node.js & npm
- Python 3.10+
- PostgreSQL installed and running
- A Groq API Key

### Backend Setup
1. Navigate to the `backend` folder.
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows).
4. Install dependencies: `pip install flask flask-cors flask-sqlalchemy psycopg2-binary langchain-groq pypdf chromadb python-dotenv`
5. Create a `.env` file with your keys:
   ```env
   GROQ_API_KEY=your_groq_key
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/interview_system