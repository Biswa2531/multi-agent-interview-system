import os
from groq import Groq
from dotenv import load_dotenv

# Load the .env file
load_dotenv()

# Initialize the Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

print("Models available on your account:\n")

# The models are stored in the .data attribute
models_list = client.models.list()
for model in models_list.data:
    print(model.id)