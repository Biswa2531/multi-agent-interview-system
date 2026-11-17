import psycopg2

# ⚠️ IMPORTANT: Replace 'YOUR_PASSWORD' with the actual password you set when installing PostgreSQL!
password = 'postgre123'

try:
    # Connect to the default 'postgres' database first
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password=password,
        host="localhost"
    )
    conn.autocommit = True # Required to create a new database
    cursor = conn.cursor()
    
    # Create the new database
    cursor.execute("CREATE DATABASE interview_system;")
    print("✅ Successfully created 'interview_system' database!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Make sure PostgreSQL is running in the background and the password is correct.")
finally:
    if 'conn' in locals():
        conn.close()