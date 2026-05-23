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
<img width="547" height="144" alt="image" src="https://github.com/user-attachments/assets/05d5fffd-a1ea-45e1-a8bb-7fe3c0031416" />

<img width="283" height="133" alt="image" src="https://github.com/user-attachments/assets/c6dd1ae8-ab9e-49bc-96e2-f92c7e586224" />

<img width="281" height="132" alt="image" src="https://github.com/user-attachments/assets/14ca02c2-5b07-4921-ab55-c77af6eba49f" />
------------------------------------------------------------
License: MIT