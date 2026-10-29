#!/bin/bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js from https://nodejs.org first."; read -n1; exit; }
[ -d node_modules ] || npm install
nohup npm start >/dev/null 2>&1 &
