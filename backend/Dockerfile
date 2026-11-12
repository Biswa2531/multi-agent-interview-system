# Use official lightweight Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port Gunicorn will run on
EXPOSE 5000

# Run the app with Gunicorn (4 workers for production)
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]