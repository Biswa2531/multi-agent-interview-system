import os
import chromadb
from pypdf import PdfReader

# Initialize ChromaDB client
client = chromadb.PersistentClient(path="./chroma_db_storage")
collection = client.get_or_create_collection(name="candidate_resumes")

def process_resume(file_path, user_id):
    """Reads a PDF, extracts text, chunks it, and stores it in ChromaDB tagged with user_id."""
    try:
        reader = PdfReader(file_path)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"

        chunks = full_text.split('\n\n')
        chunks = [c.strip() for c in chunks if len(c.strip()) > 50]

        if not chunks:
            return "Error: Could not extract meaningful text from PDF."

        ids = [f"chunk_{i}_{user_id}_{os.path.basename(file_path)}" for i in range(len(chunks))]
        metadatas = [{"user_id": str(user_id)} for _ in chunks]

        collection.add(documents=chunks, ids=ids, metadatas=metadatas)
        return f"✅ Successfully processed resume! Stored {len(chunks)} text chunks in ChromaDB."
    except Exception as e:
        return f"❌ Error processing resume: {str(e)}"

def get_resume_context(user_id):
    """
    Retrieves the resume chunks ONLY for the specific logged-in user.
    """
    try:
        # Broader query to ensure we catch the resume text
        results = collection.query(
            query_texts=["resume"], 
            where={"user_id": str(user_id)}, 
            n_results=5 # Grab up to 5 chunks to be safe
        )
        
        if results and results['documents'] and results['documents'][0]:
            return "\n\n".join(results['documents'][0])
        return ""
    except Exception as e:
        print(f"ChromaDB Query Error: {e}")
        return ""