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
    
    print("\n" + "="*60)
    print("🚀 LOADING YOUR ACTIVE MODEL: qwen/qwen3.8-27b ")
    print("="*60 + "\n")

    llm = ChatGroq(
        model="qwen/qwen3.8-27b",  
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
        max_tokens=400 
    )

    # Build Context
    context_section = ""
    if resume_context:
        context_section = f"""
        CANDIDATE RESUME DATA:
        {resume_context}
        
        CRITICAL INSTRUCTION: You MUST base your questions on the specific projects, skills, or experience listed in the RESUME DATA above. Do NOT ask generic questions like 'difference between == and is' if resume data is available.
        """
    else:
        context_section = "No resume uploaded. Ask standard technical questions relevant to a " + job_role + " role."

    # STRICT SYSTEM PROMPT
    system_prompt = f"""You are an expert Technical Interviewer conducting a live interview for a {job_role} position.
    
    {context_section}

    STRICT RULES TO FOLLOW:
    1. Look at the 'chat_history' provided below.
    2. If you have ALREADY asked a question in the history, DO NOT ask Question 1 again. Do not restart the interview.
    3. If the user just says "hi" or "hello" and you have already asked a question, simply say: "Please go ahead and answer the previous question."
    4. If the user provides an answer, say "Thank you." and ask the NEXT logical question.
    5. If RESUME DATA is provided above, your questions MUST be about the candidate's specific projects or skills from that data.
    6. Keep your responses concise (under 60 words).
    """

    messages = [SystemMessage(content=system_prompt)]
    
    # Add history (limit to last 6 messages)
    recent_history = chat_history[-6:] if len(chat_history) > 6 else chat_history

    for msg in recent_history:
        if msg.get('role') == 'user':
            messages.append(HumanMessage(content=msg.get('text', '')))
        elif msg.get('role') == 'ai':
            messages.append(AIMessage(content=msg.get('text', '')))

    messages.append(HumanMessage(content=user_message))

    response = llm.invoke(messages)
    return response.content