#!/bin/bash

echo "Starting all Fledge Portal Microservices..."

# Activate virtual environment
source venv/bin/activate || source .venv/bin/activate || echo "No venv found, hoping for the best"
# Start core service on port 8000
(cd core_service && uvicorn main:app --reload --port 8000) &
P1=$!

# Start announcement service on port 8001
(cd announcement_service && uvicorn main:app --reload --port 8001) &
P2=$!

# Start attendance service on port 8002
(cd attendance_service && uvicorn main:app --reload --port 8002) &
P3=$!

# Start test service on port 8003
(cd test_service && uvicorn main:app --reload --port 8003) &
P4=$!

# Start class activity service on port 8004
(cd class_activity_service && uvicorn main:app --reload --port 8004) &
P5=$!

# Start materials service on port 8005
(cd materials_service && uvicorn main:app --reload --port 8005) &
P6=$!

# Start video service on port 8006
(cd video_service && uvicorn main:app --reload --port 8006) &
P7=$!

# Start community service on port 8009
(cd community_service && uvicorn main:app --reload --port 8009) &
P8=$!

echo "All services started. Press Ctrl+C to stop all."

# Wait for all background processes
wait $P1 $P2 $P3 $P4 $P5 $P6 $P7 $P8
