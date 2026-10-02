import os
import chromadb
from pypdf import PdfReader

# Initialize ChromaDB client
client = chromadb.PersistentClient(path="./chroma_db_storage")
collection = client.get_or_create_collection(name="candidate_resumes")

def process_resume(file_path):
    """Reads a PDF, extracts text, chunks it, and stores it in ChromaDB."""
    try:
        reader = PdfReader(file_path)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"

        chunks = full_text.split('\n\n')
        chunks = [c.strip() for c in chunks if len(c.strip()) > 50]

        if not chunks:
            return "Error: Could not extract meaningful text from PDF."

        ids = [f"chunk_{i}_{os.path.basename(file_path)}" for i in range(len(chunks))]

        collection.add(documents=chunks, ids=ids)
        return f"✅ Successfully processed resume! Stored {len(chunks)} text chunks in ChromaDB."
    except Exception as e:
        return f" Error processing resume: {str(e)}"

def get_resume_context():
    """
    Retrieves the most relevant resume chunks to give the AI context.
    """
    try:
        # Query for broad terms to get a good summary of the resume
        results = collection.query(
            query_texts=["skills experience projects technologies education"],
            n_results=3 # Get top 3 most relevant chunks
        )
        
        if results and results['documents'] and results['documents'][0]:
            # Join the chunks into a single string
            return "\n\n".join(results['documents'][0])
        return ""
    except Exception as e:
        print(f"ChromaDB Query Error: {e}")
        return ""