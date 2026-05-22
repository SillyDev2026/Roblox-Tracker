# Roblox Session Tracker

A Node.js-based Roblox session tracking tool that monitors gameplay activity, detects active sessions, and logs playtime statistics using local system and log file analysis.

---

## Terminal Preview

Terminal screenshot included in repository assets.

---

## Overview

This tool tracks Roblox activity on a Windows system by monitoring the Roblox process and reading local log files. It records session duration, detects when a user joins or leaves a game, and retrieves basic game information through Roblox APIs.

It is designed for personal analytics and gameplay tracking.

---

## Features

- Detects when Roblox starts and closes  
- Tracks individual gameplay sessions  
- Logs total playtime per session  
- Identifies when a player joins or leaves a game  
- Retrieves game name using Roblox API (PlaceId → UniverseId)  
- Estimates FPS and network ping (approximate values)  
- Reads and parses Roblox log files for session detection  
- Real-time terminal status display  

---

## How It Works

The script continuously monitors the Roblox process and scans local log directories for activity changes.

When a session begins:
- Detects Roblox launch
- Extracts PlaceId from logs
- Converts PlaceId to UniverseId via Roblox API
- Fetches the game title
- Starts session tracking

During gameplay:
- Periodically estimates FPS
- Checks network ping
- Updates live terminal status

When Roblox closes:
- Finalizes session duration
- Outputs summary statistics

---

## Example Output

[GAME] Rivals joined
[FPS] 60 | [PING] 48ms

-----------------
Session ended
Time played: 1h 32m 30s
-----------------

---

## Requirements

- Node.js 16+
- Windows OS
- Roblox Player installed
- Access to Roblox local log directory

---

## Installation

git clone https://github.com/yourusername/roblox-tracker
cd roblox-tracker
npm install
node index.js

---

## Configuration

const server = "http://localhost:3002";

This can be changed if you want to connect to a custom backend for storing session data or analytics.

---

## Auto-Start (Windows)

1. Press Win + R  
2. Type: shell:startup  
3. Press Enter  
4. Place the executable or shortcut inside the folder  

Alternatively use Task Manager → Startup tab.

---

## Limitations

- FPS is estimated  
- Log parsing depends on Roblox format  
- Windows-only support  
- Requires local Roblox logs  
- May trigger antivirus warnings due to monitoring behavior  

---

## Roadmap

- Web dashboard for session history  
- Cloud sync for stats  
- Per-game analytics  
- UI overlay  
- SQLite integration  

---

## License

MIT
