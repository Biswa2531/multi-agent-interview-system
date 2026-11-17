import smtplib
from email.message import EmailMessage

# --- UPDATE THESE TWO LINES ---
MY_EMAIL = "b.screation2004@gmail.com"
MY_APP_PASSWORD = "krafqksbiwcculwo" # Your 16-char password, NO SPACES
# ------------------------------

msg = EmailMessage()
msg.set_content("If you are reading this, your SMTP configuration is 100% working! 🎉")
msg['Subject'] = "Multi-Agent Interview System: SMTP Test"
msg['From'] = MY_EMAIL
msg['To'] = MY_EMAIL # Sends to yourself

try:
    print("Connecting to smtp.gmail.com:587...")
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls() # Secure the connection
    print("Logging in...")
    server.login(MY_EMAIL, MY_APP_PASSWORD)
    print("Sending email...")
    server.send_message(msg)
    server.quit()
    print("✅ SUCCESS! Check your inbox. Your email is configured perfectly.")
except smtplib.SMTPAuthenticationError:
    print("❌ FAILED: Authentication error. Double-check your 16-char App Password (no spaces) and ensure 2-Step Verification is ON.")
except Exception as e:
    print(f"❌ FAILED: {e}")