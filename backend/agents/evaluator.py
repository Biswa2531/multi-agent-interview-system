import os
import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# Load .env
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / '.env'
load_dotenv(dotenv_path=env_file)

def evaluate_interview(qa_pairs, job_role, resume_context=""):
    llm = ChatGroq(
        model="qwen/qwen3.8-27b",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3, # Low temp for objective, consistent grading
        max_tokens=800
    )

    # Format QA pairs clearly
    qa_text = ""
    for i, qa in enumerate(qa_pairs, 1):
        qa_text += f"\n--- Question {i} ---\n"
        qa_text += f"Q: {qa.get('question', 'No question')}\n"
        qa_text += f"A: {qa.get('answer', 'No answer provided')}\n"

    if not qa_pairs:
        qa_text = "No questions were asked in this interview."

    # Add Resume Context to the prompt
    context_section = ""
    if resume_context and resume_context != "No resume context found.":
        context_section = f"\n\nCANDIDATE RESUME CONTEXT:\n{resume_context[:800]}\n"

    # STRICT PROMPT TO FORCE AI TO CROSS-REFERENCE RESUME
    system_prompt = f"""You are Chronos, an expert AI Technical Evaluator and Career Coach.
    You are evaluating a candidate for a **{job_role}** role.
    {context_section}
    
    Read the interview transcript below CAREFULLY. Look at the candidate's actual answers (A:).
    Cross-reference their answers with their Resume Context to check for consistency and depth.
    Provide fair, constructive feedback based on what they actually wrote.
    
    You MUST reply with ONLY valid JSON. No markdown, no explanations.
    Format: {{"technical_score": 7, "behavioral_score": 7, "strengths": "Brief strengths", "weaknesses": "Brief weaknesses", "career_recommendations": "Brief recommendations"}}
    Scores must be integers out of 10."""

    user_prompt = f"Job Role: {job_role}\n\nInterview Transcript:\n{qa_text}"

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    response = llm.invoke(messages)
    raw_content = response.content

    # Clean up markdown blocks if the AI adds them
    raw_content = raw_content.replace("```json", "").replace("```", "").strip()

    try:
        feedback = json.loads(raw_content)
        return {
            "technical_score": int(feedback.get("technical_score", 5)),
            "behavioral_score": int(feedback.get("behavioral_score", 5)),
            "strengths": str(feedback.get("strengths", "")),
            "weaknesses": str(feedback.get("weaknesses", "")),
            "career_recommendations": str(feedback.get("career_recommendations", ""))
        }
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error: {e}")
        print(f"Raw response: {raw_content}")
        return {
            "technical_score": 5, "behavioral_score": 5,
            "strengths": "Completed the interview.", "weaknesses": "Needs improvement.",
            "career_recommendations": "Continue learning."
        }