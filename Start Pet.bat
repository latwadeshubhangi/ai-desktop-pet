@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Please install Node.js from https://nodejs.org first, then run this again. & pause & exit /b)
if not exist node_modules (echo First run: installing, please wait... & call npm install)
start "" /min cmd /c "npm start"
