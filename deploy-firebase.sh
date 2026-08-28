#!/bin/bash
# ==============================================================================
# Fledge Portal - Fresh Firebase & Cloud Run Deployment Script
# ==============================================================================
set -e

echo "🚀 Starting Firebase & Cloud Run Deployment Process..."

# 1. Check for gcloud and firebase CLI tools
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: firebase CLI is not installed. Install with: npm install -g firebase-tools"
    exit 1
fi

if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed. Install Google Cloud SDK to build and deploy Docker containers."
    exit 1
fi

# 2. Re-authenticate to guarantee fresh account isolation
echo "🔑 Ensuring authentication with your fresh account..."
echo "If you need to switch accounts, run: firebase login --reauth"

# 3. Prompt for Project ID if not set
read -p "Enter your Firebase Project ID: " PROJECT_ID
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: Project ID cannot be empty."
    exit 1
fi

gcloud config set project "$PROJECT_ID"
firebase use "$PROJECT_ID"

REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/fledgeportal-backend:latest"

# 4. Build and push backend Docker container to Google Container Registry
echo "🐳 Building & pushing backend Docker container..."
gcloud builds submit ./backend --tag "$IMAGE_NAME"

# 5. Deploy Docker container to Cloud Run
echo "☁️ Deploying container to Cloud Run..."
gcloud run deploy fledgeportal-backend \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi

# 6. Build Next.js Frontend
echo "📦 Building Next.js frontend..."
npm run build

# 7. Deploy to Firebase Hosting
echo "🌐 Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deployment complete! Your application is live on Firebase."
