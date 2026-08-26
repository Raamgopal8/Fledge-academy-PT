#!/bin/bash
set -e

echo "Starting Fledge Portal Backend Services..."

# Configure Nginx API Gateway with assigned PORT (Render default is 10000)
export PORT="${PORT:-10000}"
echo "Configuring Nginx Gateway on PORT $PORT..."
envsubst '${PORT}' < /app/nginx.conf.template > /etc/nginx/sites-available/default
mkdir -p /etc/nginx/sites-enabled
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Start Nginx in background
echo "Starting Nginx Reverse Proxy..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Launch each service internally on localhost
(cd /app/core_service && uvicorn main:app --host 127.0.0.1 --port 8000) &
P1=$!

(cd /app/announcement_service && uvicorn main:app --host 127.0.0.1 --port 8001) &
P2=$!

(cd /app/attendance_service && uvicorn main:app --host 127.0.0.1 --port 8002) &
P3=$!

(cd /app/test_service && uvicorn main:app --host 127.0.0.1 --port 8003) &
P4=$!

(cd /app/class_activity_service && uvicorn main:app --host 127.0.0.1 --port 8004) &
P5=$!

(cd /app/materials_service && uvicorn main:app --host 127.0.0.1 --port 8005) &
P6=$!

(cd /app/video_service && uvicorn main:app --host 127.0.0.1 --port 8006) &
P7=$!

(cd /app/community_service && uvicorn main:app --host 127.0.0.1 --port 8009) &
P8=$!

echo "All backend microservices and API Gateway running on PORT $PORT."

# Trap termination signals
trap "kill -TERM $NGINX_PID $P1 $P2 $P3 $P4 $P5 $P6 $P7 $P8 2>/dev/null" SIGTERM SIGINT

wait $NGINX_PID $P1 $P2 $P3 $P4 $P5 $P6 $P7 $P8
