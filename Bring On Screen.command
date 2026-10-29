#!/bin/bash
cd "$(dirname "$0")"
[ -d node_modules ] || npm install
nohup npm start -- --reset-positions >/dev/null 2>&1 &
