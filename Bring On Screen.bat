@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
start "" /min cmd /c "npm start -- --reset-positions"
