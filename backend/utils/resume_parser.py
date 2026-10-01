import os
import chromadb
from pypdf import PdfReader

# Initialize ChromaDB client (saves data to a local folder)
client = chromadb.PersistentClient(path="./chroma_db_storage")
collection = client.get_or_create_collection(name="candidate_resumes")

def process_resume(file_path):
    """
    Reads a PDF, extracts text, chunks it, and stores it in ChromaDB.
    """
    try:
        # 1. Extract text from PDF
        reader = PdfReader(file_path)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"

        # 2. Simple chunking (split by double newlines/paragraphs)
        chunks = full_text.split('\n\n')
        # Filter out tiny chunks (noise)
        chunks = [c.strip() for c in chunks if len(c.strip()) > 50]

        if not chunks:
            return "Error: Could not extract meaningful text from PDF."

        # 3. Store in ChromaDB
        # Generate unique IDs for each chunk
        ids = [f"chunk_{i}_{os.path.basename(file_path)}" for i in range(len(chunks))]

        collection.add(
            documents=chunks,
            ids=ids
        )
        
        return f"✅ Successfully processed resume! Stored {len(chunks)} text chunks in ChromaDB."

    except Exception as e:
        return f" Error processing resume: {str(e)}"

def query_resume(query_text, n_results=3):
    """
    Searches ChromaDB for the most relevant chunks based on a query.
    """
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    return results['documents'][0] if results['documents'] else []