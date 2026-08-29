#!/bin/bash

echo "🚀 Starting Fledge Portal Backend Services..."

export PORT="${PORT:-8080}"
export PYTHONUNBUFFERED=1

# Configure Nginx API Gateway template
echo "⚙️ Configuring Nginx Gateway for PORT $PORT..."
envsubst '${PORT}' < /app/nginx.conf.template > /etc/nginx/sites-available/default
mkdir -p /etc/nginx/sites-enabled
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Launch microservices in their directories
echo "📦 Launching Python microservices..."

(cd /app/core_service && python3 -m uvicorn main:app --host 127.0.0.1 --port 8000) &
P1=$!

(cd /app/announcement_service && python3 -m uvicorn main:app --host 127.0.0.1 --port 8001) &
P2=$!

(cd /app/attendance_service && python3 -m uvicorn main:app --host 127.0.0.1 --port 8002) &
P3=$!

(cd /app/test_service && python3 -m uvicorn main:app --host 127.0.0.1 --port 8003) &
P4=$!

(cd /app/class_activity_service && python3 -m uvicorn main:app --host 127.0.0.1 --port 8004) &
P5=$!

(cd /app/materials_service && python3 -m uvicorn main:app --host 127.0.0.1 --port 8005) &
P6=$!

(cd /app/video_service && python3 -m uvicorn main:app --host 127.0.0.1 --port 8006) &
P7=$!

(cd /app/community_service && python3 -m uvicorn main:app --host 127.0.0.1 --port 8009) &
P8=$!

# Wait for core service (port 8000) to be fully ready before opening Nginx port
echo "⏳ Waiting for core service on 127.0.0.1:8000 to be ready..."
for i in $(seq 1 60); do
    if python3 -c "import socket; s = socket.socket(); s.settimeout(0.5); s.connect(('127.0.0.1', 8000)); s.close()" 2>/dev/null; then
        echo "✅ Core service is ready on port 8000!"
        break
    fi
    sleep 0.5
done

# Start Nginx in foreground to keep container running and handle incoming traffic
echo "🌐 Starting Nginx Reverse Proxy on PORT $PORT..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "🎉 All backend services and API Gateway are online!"

# Trap termination signals
trap "kill -TERM $NGINX_PID $P1 $P2 $P3 $P4 $P5 $P6 $P7 $P8 2>/dev/null" SIGTERM SIGINT

wait $NGINX_PID $P1 $P2 $P3 $P4 $P5 $P6 $P7 $P8
