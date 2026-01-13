#!/bin/bash

echo "================================"
echo "Starting iCore Telegram Server"
echo "================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please create .env file with your configuration"
    exit 1
fi

echo "Starting server..."
node index.js
