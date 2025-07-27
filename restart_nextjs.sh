#!/bin/bash

# Check if port 3000 is in use
PID=$(lsof -ti:3000)

if [ -n "$PID" ]; then
  echo "Port 3000 is in use by PID $PID. Killing..."
  kill -9 $PID
  echo "Process $PID killed."
else
  echo "Port 3000 is not in use."
fi

# Start Next.js app in dev mode
nohup npm run dev > frontend.log 2>&1 &

# Wait a moment for the app to start
sleep 2

echo "Next.js app restarted with 'npm run dev'."

echo "Current processes using port 3000:"
lsof -i :3000 