Roblox Session Tracker (Windows)

A lightweight Node.js Windows-only tool that tracks Roblox gameplay sessions by monitoring the Roblox process and reading local log files. It records playtime, detects session changes, and provides real-time activity stats.

------------------------------------------------------------

Preview

Terminal output showing live session tracking.

------------------------------------------------------------

Overview

This tool runs locally on Windows and continuously monitors:
- Roblox process activity
- Local Roblox log files
- Active gameplay sessions

It automatically detects when you join or leave a game and logs session data such as playtime and basic game metadata.

------------------------------------------------------------

Features

- Detects when Roblox launches and closes
- Tracks individual game sessions
- Logs total playtime per session
- Detects game joins/leaves in real time
- Fetches game title via Roblox API (PlaceId -> UniverseId)
- Estimates FPS and ping (approximate)
- Reads Roblox local logs for session detection
- Real-time terminal status display

------------------------------------------------------------

How It Works

1. Process Monitoring
- Detects Roblox Player start/stop

2. Log Analysis
- Reads local Roblox log files
- Extracts PlaceId and session events

3. API Lookup
- Converts PlaceId -> UniverseId
- Retrieves game name from Roblox API

4. Session Tracking
- Starts timer on game join
- Tracks stats during gameplay
- Ends session on exit

------------------------------------------------------------

Example Output

[GAME] Rivals joined
[FPS] 60 | [PING] 48ms

-----------------
Session ended
Time played: 1h 32m 30s
-----------------

------------------------------------------------------------

Requirements

- Windows 10 / 11
- Node.js 16+
- Roblox Player installed
- Access to local Roblox logs

------------------------------------------------------------

Installation

git clone https://github.com/yourusername/roblox-tracker
cd roblox-tracker
npm install
node index.js

------------------------------------------------------------

Windows Auto-Start

Option 1:
Win + R → shell:startup → place shortcut

Option 2:
Task Manager → Startup tab → add Node.js script

------------------------------------------------------------

Limitations

- Depends on Roblox log format
- Windows-only support
- Requires local file access
- May trigger antivirus warnings but its not a virus 
- tested thru many games

------------------------------------------------------------

Roadmap

- Web dashboard
- Cloud sync
- Per-game analytics
- UI overlay
- SQLite integration
- Graph reports

------------------------------------------------------------

------------------------------------------------------------
Images
# at startup
<img width="217" height="140" alt="image" src="https://github.com/user-attachments/assets/90a3a745-dc29-47f6-a198-e223c59c6e07" />

#saving state
<img width="258" height="45" alt="image" src="https://github.com/user-attachments/assets/a7a4455d-a5b3-424a-921b-685c3e602dd2" />

# full image
<img width="324" height="220" alt="image" src="https://github.com/user-attachments/assets/4ad60d35-cb34-4d63-ac6c-5e1abf2d85a4" />

------------------------------------------------------------
License: MIT
