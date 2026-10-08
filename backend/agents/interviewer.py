import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

backend_dir = Path(__file__).parent.parent
env_file = backend_dir / '.env'
load_dotenv(dotenv_path=env_file)

def get_interviewer_response(user_message, job_role="Software Engineer", chat_history=[], resume_context="", current_round=1):
    
    # --- SPEED FIX: Lower max_tokens and use a fast temperature ---
    llm = ChatGroq(
        model="qwen/qwen3.8-27b",  
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
        max_tokens=150 # Reduced from 400 to make it reply much faster
    )

    context_section = ""
    if resume_context:
        context_section = f"RESUME: {resume_context[:300]}..." # Truncate resume to speed up processing
    else:
        context_section = f"No resume. Ask standard {job_role} questions."

    round_instructions = ""
    if current_round == 1:
        round_instructions = "ROUND 1: TECHNICAL. Ask core concept questions."
    elif current_round == 2:
        round_instructions = "ROUND 2: CODING. Ask logic/scenario questions."
    elif current_round == 3:
        round_instructions = "ROUND 3: BEHAVIORAL. Ask teamwork/challenge questions."

    # --- SPEED FIX: Ultra-short prompt ---
    system_prompt = f"""You are a {job_role} interviewer. {context_section} {round_instructions}
    RULES: 
    1. Never repeat questions. 
    2. If user says 'hi', ask Q1 immediately. 
    3. Keep replies under 40 words. Just ask the question."""

    messages = [SystemMessage(content=system_prompt)]
    
    # --- SPEED FIX: Only send last 4 messages instead of 6 ---
    recent_history = chat_history[-4:] if len(chat_history) > 4 else chat_history

    for msg in recent_history:
        if msg.get('role') == 'user':
            messages.append(HumanMessage(content=msg.get('text', '')))
        elif msg.get('role') == 'ai':
            messages.append(AIMessage(content=msg.get('text', '')))

    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    return response.content