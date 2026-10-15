import os
import chromadb
from pypdf import PdfReader
# FIXED: Updated import for newer LangChain versions
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Initialize a persistent ChromaDB client in the backend folder
CHROMA_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_db")
os.makedirs(CHROMA_DB_PATH, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
collection = chroma_client.get_or_create_collection(name="resumes")

def process_resume(file_path, user_id):
    """Extracts text from PDF, chunks it, and stores it in ChromaDB."""
    try:
        # 1. Extract text from PDF
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        if not text.strip():
            return "Error: Could not extract text from PDF. Is it a scanned image?"

        # 2. Delete old resume data for this user (if any)
        try:
            collection.delete(where={"user_id": str(user_id)})
        except:
            pass

        # 3. Chunk the text
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            length_function=len
        )
        chunks = text_splitter.split_text(text)

        # 4. Store in ChromaDB
        if chunks:
            collection.add(
                documents=chunks,
                metadatas=[{"user_id": str(user_id), "chunk_index": i} for i in range(len(chunks))],
                ids=[f"{user_id}_{i}" for i in range(len(chunks))]
            )
            return f"Successfully processed and indexed {len(chunks)} chunks of your resume."
        else:
            return "Error: Resume text was too short to process."

    except Exception as e:
        return f"Error processing resume: {str(e)}"

def get_resume_context(user_id):
    """Queries ChromaDB to get relevant resume context for the user."""
    try:
        # Fetch all chunks for this user to give the AI full context
        results = collection.get(
            where={"user_id": str(user_id)},
            limit=10 # Fetch up to 10 chunks
        )
        if results and results['documents']:
            return "\n\n---\n\n".join(results['documents'])
        return "No resume context found for this user."
    except Exception as e:
        print(f"ChromaDB Query Error: {e}")
        return "No resume context found."