import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# Load .env
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / '.env'
load_dotenv(dotenv_path=env_file)

def get_interviewer_response(user_message, job_role="Software Engineer", chat_history=[], resume_context=""):
    # --- GUARANTEED WORKING MODEL (Currently Active on Groq) ---
    llm = ChatGroq(
        model="llama-3.1-70b-versatile",  # <-- This is the CURRENT, active model
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
        max_tokens=400 
    )

    context_section = ""
    if resume_context:
        context_section = f"""
        CANDIDATE RESUME DATA:
        {resume_context}
        INSTRUCTION: You MUST base your questions on the specific projects, skills, or experience listed in the RESUME DATA above.
        """
    else:
        context_section = f"No resume uploaded. Ask standard technical questions relevant to a {job_role} role."

    system_prompt = f"""You are an expert Technical Interviewer conducting a live interview for a {job_role} position.
    {context_section}
    CRITICAL RULES:
    1. Your goal is to ask exactly 5 technical questions in total.
    2. If the user is just greeting you (e.g., "Hello"), acknowledge it briefly and IMMEDIATELY ask the first technical question.
    3. If the user asks a doubt, answer it briefly, then re-ask the current question or move to the next one.
    4. If the user has provided an answer, say "Thank you." and ask the NEXT technical question.
    5. NEVER repeat a question. Look at the chat history.
    6. Keep your responses concise (under 60 words).
    """

    messages = [SystemMessage(content=system_prompt)]
    recent_history = chat_history[-6:] if len(chat_history) > 6 else chat_history

    for msg in recent_history:
        if msg.get('role') == 'user':
            messages.append(HumanMessage(content=msg.get('text', '')))
        elif msg.get('role') == 'ai':
            messages.append(AIMessage(content=msg.get('text', '')))

    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    return response.content