#!/bin/bash
set -e

echo "Starting Fledge Portal Backend Services..."

# Launch each service
(cd /app/core_service && uvicorn main:app --host 0.0.0.0 --port 8000) &
P1=$!

(cd /app/announcement_service && uvicorn main:app --host 0.0.0.0 --port 8001) &
P2=$!

(cd /app/attendance_service && uvicorn main:app --host 0.0.0.0 --port 8002) &
P3=$!

(cd /app/test_service && uvicorn main:app --host 0.0.0.0 --port 8003) &
P4=$!

(cd /app/class_activity_service && uvicorn main:app --host 0.0.0.0 --port 8004) &
P5=$!

(cd /app/materials_service && uvicorn main:app --host 0.0.0.0 --port 8005) &
P6=$!

(cd /app/video_service && uvicorn main:app --host 0.0.0.0 --port 8006) &
P7=$!

(cd /app/community_service && uvicorn main:app --host 0.0.0.0 --port 8009) &
P8=$!

echo "All backend services running."

# Trap termination signals
trap "kill -TERM $P1 $P2 $P3 $P4 $P5 $P6 $P7 $P8 2>/dev/null" SIGTERM SIGINT

wait $P1 $P2 $P3 $P4 $P5 $P6 $P7 $P8
