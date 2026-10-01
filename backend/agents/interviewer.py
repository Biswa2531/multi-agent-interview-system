import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

# --- BULLETPROOF .ENV LOADING ---
backend_dir = Path(__file__).parent.parent
env_file = backend_dir / '.env'
load_dotenv(dotenv_path=env_file)

def get_interviewer_response(user_message, job_role="Software Engineer", chat_history=[]):
    """
    Generates a response from the AI Interviewer Agent.
    """
    # Initialize the Groq LLM with a max token limit to prevent 429 errors
    llm = ChatGroq(
        model="qwen/qwen3.8-27b",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7,
        max_tokens=500
    )

    # The "System Prompt" - This defines the AI's personality and rules
    system_prompt = f"""You are an expert Technical Interviewer for a {job_role} position. 
    Your goal is to conduct a professional, structured interview.
    
    Rules:
    1. Ask ONE question at a time.
    2. Wait for the candidate to answer before asking the next question.
    3. If the candidate's answer is vague, ask a polite follow-up question.
    4. Keep your questions clear, professional, and relevant to the job role.
    5. Do not provide the answers to your questions.
    6. Start the interview by introducing yourself briefly and asking the first question.
    7. STRICTLY ask exactly 5 questions in total. After the candidate answers the 5th question, thank them for their time and say the interview is concluded. Do not ask a 6th question."""

    # Build the message history
    messages = [SystemMessage(content=system_prompt)]
    
    # TRUNCATE HISTORY: Only keep the last 4 messages (2 turns) to save tokens and prevent 429 errors
    recent_history = chat_history[-4:] if len(chat_history) > 4 else chat_history

    # Add previous chat history from the frontend
    for msg in recent_history:
        if msg.get('role') == 'user':
            messages.append(HumanMessage(content=msg.get('text', '')))
        elif msg.get('role') == 'ai':
            messages.append(AIMessage(content=msg.get('text', '')))

    # Add the current user message
    messages.append(HumanMessage(content=user_message))

    # Get response from the LLM
    response = llm.invoke(messages)
    
    return response.content