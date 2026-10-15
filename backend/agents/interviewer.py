import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

backend_dir = Path(__file__).parent.parent
env_file = backend_dir / '.env'
load_dotenv(dotenv_path=env_file)

def get_interviewer_response(user_message, job_role="Software Engineer", chat_history=[], resume_context="", current_round=1):
    
    # Keep your fast model and settings
    llm = ChatGroq(
        model="qwen/qwen3.8-27b",  # Keeping your working model
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
        max_tokens=150 # Slightly increased to allow room for RAG context
    )

    # --- RAG INTEGRATION ---
    # Use up to 1000 chars of resume context (300 was too short for the AI to understand skills)
    context_section = ""
    if resume_context and resume_context != "No resume context found.":
        context_section = f"\n\nCANDIDATE RESUME CONTEXT:\n{resume_context[:1000]}\n---\n"
    else:
        context_section = "\n\nNo resume provided. Ask standard questions.\n"

    # --- ROUND LOGIC ---
    round_instructions = ""
    if current_round == 1:
        round_instructions = "ROUND 1: TECHNICAL. Focus on core concepts, frameworks, and problem-solving based on their resume."
    elif current_round == 2:
        round_instructions = "ROUND 2: BEHAVIORAL. Ask situational, teamwork, and challenge-based questions."
    elif current_round == 3:
        round_instructions = "ROUND 3: HR/CULTURE. Ask about career goals, culture fit, and expectations."

    # --- SYSTEM PROMPT ---
    system_prompt = f"""You are Sophia, an expert AI Technical Interviewer interviewing a candidate for the **{job_role}** role.
    {context_section}
    {round_instructions}
    
    RULES: 
    1. Never repeat questions. 
    2. If the user just says 'hi' or introduces themselves, ask the first relevant technical question immediately.
    3. Keep replies concise (under 50 words). Just ask the question.
    4. If the chat history has more than 15 messages, say "Thank you, that concludes our interview!" and nothing else."""

    messages = [SystemMessage(content=system_prompt)]
    
    # Keep your exact history parsing to prevent crashes
    recent_history = chat_history[-6:] if len(chat_history) > 6 else chat_history

    for msg in recent_history:
        # BULLETPROOF SAFETY CHECK: Prevents the Week 4 crash
        if isinstance(msg, dict):
            role = msg.get('role')
            text = msg.get('text', '')
        else:
            role = getattr(msg, 'role', 'user')
            text = getattr(msg, 'content', str(msg))
        
        if role in ['user', 'candidate']:
            messages.append(HumanMessage(content=text))
        elif role in ['ai', 'assistant']:
            messages.append(AIMessage(content=text))

    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    return response.content