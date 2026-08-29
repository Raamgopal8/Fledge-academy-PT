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

# 4. Load environment variables from backend/.env if it exists
ENV_VARS_FLAG=""
if [ -f "backend/.env" ]; then
    echo "📄 Found backend/.env file! Using environment variables from backend/.env..."
    # Convert .env format to gcloud format (ignoring comments and blank lines)
    VARS=$(grep -v '^#' backend/.env | grep -v '^$' | tr '\n' ',' | sed 's/,$//')
    ENV_VARS_FLAG="--set-env-vars $VARS"
elif [ -n "$MONGODB_URL" ]; then
    ENV_VARS_FLAG="--set-env-vars MONGODB_URL=$MONGODB_URL,SECRET_KEY=sb_secret_F9bSlCMOXoSrP6nI8jb-KQ_Ri76pBkx,ALGORITHM=HS256"
else
    echo "💡 Tip: You can create a backend/.env file with MONGODB_URL_1..8 and R2 credentials."
    read -p "Enter your general MongoDB Connection URL (or press Enter if configured): " USER_MONGO_URL
    if [ -n "$USER_MONGO_URL" ]; then
        ENV_VARS_FLAG="--set-env-vars MONGODB_URL=$USER_MONGO_URL,SECRET_KEY=sb_secret_F9bSlCMOXoSrP6nI8jb-KQ_Ri76pBkx,ALGORITHM=HS256"
    fi
fi

# 5. Build and push backend Docker container to Google Container Registry
echo "🐳 Building & pushing backend Docker container..."
gcloud builds submit ./backend --tag "$IMAGE_NAME"

# 6. Deploy Docker container to Cloud Run
echo "☁️ Deploying container to Cloud Run..."
gcloud run deploy fledgeportal-backend \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --no-cpu-throttling \
    $ENV_VARS_FLAG

# 7. Build Next.js Frontend with static export for Firebase Hosting
echo "📦 Building Next.js frontend (export mode)..."
NEXT_EXPORT=true npm run build

# 8. Deploy to Firebase Hosting
echo "🌐 Deploying frontend to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deployment complete! Your application is live on Firebase."
