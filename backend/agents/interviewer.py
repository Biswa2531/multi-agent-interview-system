import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# --- BULLETPROOF .ENV LOADING ---
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / '.env'
load_dotenv(dotenv_path=env_file)

def get_interviewer_response(user_message, job_role="Software Engineer", chat_history=[], resume_context=""):
    """
    Generates a response from the AI Interviewer Agent.
    """
    llm = ChatGroq(
        model="qwen/qwen3.8-27b",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
        max_tokens=500
    )

    # Build the Resume Context section for the prompt
    context_section = ""
    if resume_context:
        context_section = f"""
        CANDIDATE RESUME CONTEXT:
        {resume_context}
        """
    else:
        context_section = "No resume uploaded. Ask standard technical questions based on the job role."

    # The "System Prompt" - Smart enough to link Resume to Job Role
    system_prompt = f"""You are an expert Technical Interviewer hiring for a {job_role} position. 
    Your goal is to conduct a professional, structured interview.
    
    {context_section}

    Rules:
    1. Ask ONE question at a time.
    2. Wait for the candidate to answer before asking the next question.
    3. If the candidate's answer is vague, ask a polite follow-up question.
    4. IMPORTANT: You must ask questions based on the CANDIDATE RESUME CONTEXT provided above, but you must FRAME them around the '{job_role}' position they are applying for. 
       (Example: If they are applying for 'Tele Executive' but their resume says 'Front-End Developer', ask: 'How would your technical background help you communicate with clients in a Tele Executive role?')
    5. Do not provide the answers to your questions.
    6. Do NOT re-introduce yourself if the conversation has already started. Simply ask the next question.
    7. STRICTLY ask exactly 5 questions in total. After the candidate answers the 5th question, thank them for their time and say the interview is concluded. Do not ask a 6th question."""

    messages = [SystemMessage(content=system_prompt)]
    
    recent_history = chat_history[-4:] if len(chat_history) > 4 else chat_history

    for msg in recent_history:
        if msg.get('role') == 'user':
            messages.append(HumanMessage(content=msg.get('text', '')))
        elif msg.get('role') == 'ai':
            messages.append(AIMessage(content=msg.get('text', '')))

    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    return response.content