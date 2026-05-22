Roblox Tracker

it will say virus detected on windows but its not since i built it only for Roblox Tracking
and then check for constant updates for window version will get updates once a while since working on a sqlite3 store in JavaScript
to connect to roblox then saves to u and only u

A Node.js-based session and gameplay tracker for Roblox that monitors
running state, detects in-game activity through log files, and records
session/game duration along with real-time performance stats like FPS
and ping.

FEATURES - Detects when Roblox starts and stops - Tracks in-game
sessions and total playtime - Identifies when a player joins or leaves a
game - Fetches game name using Roblox APIs - Monitors FPS (approximate)
and network ping - Reads Roblox log files to detect session changes -
Simple terminal-based live status display

HOW IT WORKS The script continuously monitors Roblox process activity
and scans the local Roblox log directory. When a new game session is
detected, it: - Extracts the PlaceId from logs - Converts it into a
UniverseId via Roblox API - Retrieves the game name - Tracks session
duration until disconnect or exit

It also runs a lightweight performance tracker that estimates FPS and
periodically checks ping.

REQUIREMENTS - Node.js 16+ - Windows (uses tasklist and Roblox log
directory pathing) - Roblox Player installed

INSTALLATION git clone https://github.com/yourusername/roblox-tracker cd
roblox-tracker npm install node index.js

CONFIGURATION const server = “http://localhost:3002”;

You can change this if you plan to connect it to your own backend for
logging or analytics.

OUTPUT EXAMPLE [SESSION] Roblox opened [GAME] Joined: Brookhaven RP
[FPS: 60] [PING: 48ms]

SESSION ENDED Game Time: 1h 12m 33s Session Time: 1h 15m 10s

LIMITATIONS - FPS is estimated and not pulled directly from Roblox
internals - Log parsing depends on Roblox log format consistency -
Windows-only support by default - Requires Roblox to generate logs in
expected directory

FUTURE IDEAS - Web dashboard for session history - Cloud sync for
gameplay stats - Per-game analytics tracking - UI overlay for real-time
stats - Multi-platform support

LICENSE MIT
