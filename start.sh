#!/bin/bash

echo "Starting Kenya Great Party Full-Stack Application..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    echo "Please install npm"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies"
        exit 1
    fi
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo
    echo "IMPORTANT: Please edit the .env file with your configuration"
    echo "- Set your MongoDB connection string"
    echo "- Set your JWT secret"
    echo "- Configure email settings"
    echo
    read -p "Press Enter to continue after configuring .env file..."
fi

# Create uploads directory
if [ ! -d "public/uploads" ]; then
    echo "Creating uploads directory..."
    mkdir -p public/uploads
fi

echo "Starting the server..."
echo
echo "The application will be available at: http://localhost:5000"
echo "Admin panel: http://localhost:5000/admin"
echo
echo "Press Ctrl+C to stop the server"
echo

npm start
