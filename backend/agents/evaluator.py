import os
import json
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

# --- BULLETPROOF .ENV LOADING ---
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / '.env'
load_dotenv(dotenv_path=env_file)

def evaluate_interview(qa_pairs, job_role="Software Engineer"):
    """
    Analyzes the interview transcript and provides structured feedback.
    """
    # Initialize the Groq LLM
    # We use a lower temperature (0.3) for more consistent, analytical grading
    llm = ChatGroq(
        model="qwen/qwen3.8-27b",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.3, 
        max_tokens=800 # Give it enough space to write the full JSON report
    )

    # Format the Q&A pairs into a readable transcript string
    transcript = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}\n" for qa in qa_pairs])

    # The "System Prompt" - Strictly enforces JSON output
    system_prompt = f"""You are an expert Technical Recruiter and Career Coach evaluating a candidate for a {job_role} role.
    Analyze the following interview transcript and provide a structured evaluation.
    
    You MUST respond ONLY in valid JSON format with the following exact keys:
    {{
        "technical_score": (integer from 1 to 10),
        "behavioral_score": (integer from 1 to 10),
        "strengths": "2-3 bullet points of what the candidate did well",
        "weaknesses": "2-3 bullet points of areas for improvement",
        "career_recommendations": "2-3 actionable pieces of advice for the candidate"
    }}
    
    Do not include any introductory text, conversational filler, or markdown formatting outside of the JSON object.
    
    Transcript:
    {transcript}
    """

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content="Please provide the evaluation in the specified JSON format.")
    ]

    try:
        response = llm.invoke(messages)
        
        # Clean up the response to ensure it's valid JSON 
        # (LLMs sometimes add markdown backticks like ```json ... ```)
        clean_response = response.content.replace("```json", "").replace("```", "").strip()
        
        # Parse the JSON string into a Python dictionary
        return json.loads(clean_response)
        
    except json.JSONDecodeError as e:
        print(f"Error parsing AI evaluation JSON: {e}")
        print(f"Raw AI response: {response.content}")
        # Return a fallback dictionary so the app doesn't crash
        return {
            "technical_score": 5,
            "behavioral_score": 5,
            "strengths": "Could not evaluate due to formatting error.",
            "weaknesses": "Could not evaluate due to formatting error.",
            "career_recommendations": "Please try again."
        }
    except Exception as e:
        print(f"General Error during evaluation: {e}")
        return {
            "technical_score": 0,
            "behavioral_score": 0,
            "strengths": "Error connecting to AI.",
            "weaknesses": "Error connecting to AI.",
            "career_recommendations": "Check backend logs."
        }