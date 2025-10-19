@echo off
echo Starting Kenya Great Party Full-Stack Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if MongoDB is running (optional)
echo Checking MongoDB connection...
echo Note: Make sure MongoDB is running on your system
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit the .env file with your configuration
    echo - Set your MongoDB connection string
    echo - Set your JWT secret
    echo - Configure email settings
    echo.
    pause
)

REM Create uploads directory
if not exist "public\uploads" (
    echo Creating uploads directory...
    mkdir public\uploads
)

echo Starting the server...
echo.
echo The application will be available at: http://localhost:5000
echo Admin panel: http://localhost:5000/admin
echo.
echo Press Ctrl+C to stop the server
echo.

npm start
