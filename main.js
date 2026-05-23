const fs = require("fs");
const path = require("path");
const https = require("https");
const { exec, execSync } = require("child_process");
const RPC = require("discord-rpc");
const tracker = require("./gameTracker");

const CLIENT_ID = "1491648971041411163";
const VERSION = "1.1.0";

const LOG_DIR = process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, "Roblox", "logs")
  : null;

const CHECK_INTERVAL = 2500;
const LOG_INTERVAL = 1200;

RPC.register(CLIENT_ID);

const rpc = new RPC.Client({
  transport: "ipc",
});

let rpcReady = false;

const STATE = {
  IDLE: "IDLE",
  MENU: "MENU",
  LOADING: "LOADING",
  IN_GAME: "IN_GAME",
  SAVING: "SAVING",
  HOPPING: "HOPPING",
  WAITING_SERVER: "WAITING_SERVER",
};

const ROBLOX_ICON = "roblox";

let currentState = STATE.IDLE;
let robloxRunning = false;

let sessionStart = 0;
let inSession = false;

let universeId = null;
let placeId = null;

let game = {
  name: "Roblox",
  icon: ROBLOX_ICON,
};

let players = 0;
let genre = "Unknown";

let serverType = "Public Server";
let privateServerId = null;

let playerPoll = null;

let processing = false;
let currentLog = null;

const logOffsets = new Map();

let joinLock = false;
let leaving = false;

const ICON_CACHE = {};

let recentLogBuffer = "";
let currentServerIp = null;
let currentServerPort = null;
let lastJobId = null;
let lastServerKey = null;
let lastPlaceId = null;
let lastLeaveTime = 0;
let serverHopCount = 0;
let isHoping = false;
let hopStartTime = 0;

function detectServerType(logText) {
  const lower = logText.toLowerCase();

  const isPrivate =
    lower.includes("privateserverid") ||
    lower.includes("reservedserveraccesscode") ||
    lower.includes("vipserver") ||
    lower.includes("accesscode");

  return isPrivate ? "Private Server" : "Public Server";
}

function getServerKey(ip, port) {
  if (!ip || !port) return null;
  return `${ip}:${port}`;
}

rpc.on("ready", () => {
  rpcReady = true;

  setTimeout(() => {
    updateRPC();
  }, 1000);
});

rpc.login({
  clientId: CLIENT_ID,
}).catch(() => {});

function httpsJSON(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (c) => {
          data += c;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(null);
          }
        });
      })
      .on("error", () => {
        resolve(null);
      });
  });
}

function startServerHop() {
  if (isHoping) return;

  isHoping = true;
  hopStartTime = Date.now();

  currentState = STATE.HOPPING;
  updateRPC();
}

function isRobloxRunning() {
  return new Promise((resolve) => {
    exec("tasklist", (err, out) => {
      if (err || !out) {
        return resolve(false);
      }

      resolve(
        out.toLowerCase().includes("robloxplayerbeta.exe")
      );
    });
  });
}

function getLatestLog() {
  if (!LOG_DIR || !fs.existsSync(LOG_DIR)) {
    return null;
  }

  const files = fs
    .readdirSync(LOG_DIR)
    .filter((f) => f.endsWith(".log"))
    .map((f) => {
      const file = path.join(LOG_DIR, f);

      return {
        file,
        time: fs.statSync(file).mtimeMs,
      };
    })
    .sort((a, b) => b.time - a.time);

  return files[0]?.file || null;
}

function getWindowTitle() {
  try {
    return execSync(
      `powershell "Get-Process RobloxPlayerBeta -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowTitle"`
    )
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function detectWindowState() {
  const title = getWindowTitle();

  if (!title) {
    return STATE.MENU;
  }

  if (title.trim() === "Roblox") {
    return STATE.MENU;
  }

  return STATE.IN_GAME;
}

async function getUniverseId(placeId) {
  const data = await httpsJSON(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
  );

  return data?.universeId || null;
}

async function getGameInfo(universeId) {
  const data = await httpsJSON(
    `https://games.roblox.com/v1/games?universeIds=${universeId}`
  );

  const g = data?.data?.[0];

  if (!g) {
    return null;
  }

  return {
    name: g.name,
    players: g.playing,
    genre: g.genre,
  };
}

async function getGameIcon(placeId) {
  if (!placeId) {
    return ROBLOX_ICON;
  }

  if (ICON_CACHE[placeId]) {
    return ICON_CACHE[placeId];
  }

  const url =
    `https://thumbnails.roblox.com/v1/places/gameicons?` +
    `placeIds=${placeId}&size=512x512&format=Png&isCircular=false`;

  const data = await httpsJSON(url);

  const icon =
    data?.data?.[0]?.imageUrl || ROBLOX_ICON;

  ICON_CACHE[placeId] = icon;

  return icon;
}

function updateRPC() {
  if (!rpcReady) {
    return;
  }

  let details = "Roblox";
  let state = "Idle";
  let image = ROBLOX_ICON;

  switch (currentState) {
    case STATE.LOADING:
      details = "Loading game...";
      state = `${game.name} • ${serverType}`;
      image = game.icon;
      break;

    case STATE.IN_GAME:
      details = `Playing ${game.name}`;
      state =
        `${players} players • ` +
        `${genre} • ` +
        `${serverType}`;
      image = game.icon;
      break;

    case STATE.MENU:
      details = "Browsing Roblox";
      state = "Main Menu";
      break;

    case STATE.SAVING:
      details = "Leaving game";
      state = "Saving session...";
      break;

    case STATE.HOPPING:
      details = "Server hopping...";
      state = "Finding new server...";
      image = ROBLOX_ICON;
      break;
    
    case STATE.WAITING_SERVER:
      details = "Server hopping...";
      state = "Waiting for server to load";
      image = ROBLOX_ICON;
      break;

  }

  rpc.setActivity({
    details,
    state,
    startTimestamp: sessionStart || Date.now(),
    largeImageKey: image,
  });
}

function startSession() {
  sessionStart = Date.now();

  currentState = STATE.MENU;

  updateRPC();
}

function resetGameData() {
  universeId = null;
  placeId = null;

  game = {
    name: "Roblox",
    icon: ROBLOX_ICON,
  };

  players = 0;
  genre = "Unknown";

  serverType = "Public Server";
  privateServerId = null;
}

function endSession() {
  if (leaving) {
    return;
  }

  leaving = true;

  currentState = STATE.SAVING;

  updateRPC();

  tracker.flush();

  setTimeout(() => {
    currentState = STATE.IDLE;

    inSession = false;

    resetGameData();

    if (playerPoll) {
      clearInterval(playerPoll);
    }

    playerPoll = null;

    updateRPC();

    leaving = false;
  }, 1000);
}

function detectServerType(logText) {
  const lower = logText.toLowerCase();

  const privatePatterns = [
    "privateserverid",
    "vipserver",
    "reservedserveraccesscode",
    "accesscode",
  ];

  const friendPatterns = [
    "followuserid",
    "partyid",
    "matchmakingcontext",
  ];

  const isPrivate = privatePatterns.some((p) =>
    lower.includes(p.toLowerCase())
  );

  const privateId =
    logText.match(
      /privateServerId["=: ]+([a-zA-Z0-9-_]+)/i
    )?.[1] ||
    logText.match(
      /reservedServerAccessCode["=: ]+([a-zA-Z0-9-_]+)/i
    )?.[1] ||
    null;

  privateServerId = privateId;

  if (isPrivate) {
    return "Private Server";
  }

  return "Public Server";
}

async function joinGame(pid, name) {
  if (!pid || joinLock) return;
  if (inSession && pid === placeId) return;
  if (joinLock) return;
  joinLock = true;

  placeId = pid;
  game.name = name;

  if (isHoping) {
    currentState = STATE.WAITING_SERVER;
  } else {
    currentState = STATE.LOADING;
  }

  updateRPC();

  game.icon = await getGameIcon(pid);

  universeId = await getUniverseId(pid);

  let info = null;
  if (universeId) {
    info = await getGameInfo(universeId);
  }

  players = info?.players || 0;
  genre = info?.genre || "Unknown";

  await new Promise(r => setTimeout(r, 800));

  inSession = true;
  currentState = STATE.IN_GAME;

  tracker.startGame(name, pid);
  updateRPC();

  isHoping = false;

  if (playerPoll) clearInterval(playerPoll);

  playerPoll = setInterval(async () => {
    if (!inSession || !universeId) return;

    const data = await getGameInfo(universeId);
    if (!data) return;

    players = data.players;
    genre = data.genre;

    updateRPC();
  }, 15000);

  joinLock = false;
}

function leaveGame() {
  if (!inSession || leaving) return;

  leaving = true;
  lastLeaveTime = Date.now();

  inSession = false;
  universeId = null;

  if (playerPoll) {
    clearInterval(playerPoll);
    playerPoll = null;
  }

  currentState = STATE.SAVING;
  updateRPC();

  tracker.endGame();

  setTimeout(() => {
    resetGameData();
    currentState = STATE.MENU;
    updateRPC();

    leaving = false;
  }, 1200);
}

async function processStartupChunk(chunk) {
  const pid =
    chunk.match(/placeId\s*[:=]\s*(\d+)/i)?.[1] ||
    chunk.match(/roblox\.com\/games\/(\d+)/i)?.[1];

  if (!pid) return;

  const joinEvent =
    /GameJoin|ClientGameJoin|PlaceLauncher|Replicator created/i.test(chunk);

  if (!joinEvent) return;

  let gameName = "Unknown Game";

  const uni = await getUniverseId(pid);

  if (uni) {
    universeId = uni;

    const info = await getGameInfo(uni);
    if (info) {
      gameName = info.name;
      players = info.players;
      genre = info.genre;
    }
  }

  placeId = pid;
  game.icon = await getGameIcon(pid);

  if (!inSession) {
    inSession = true;
    currentState = STATE.IN_GAME;

    tracker.startGame(gameName, pid);
  }
  updateRPC();
}

async function startupCheck() {
  const running = await isRobloxRunning();
  if (!running) return;

  robloxRunning = true;
  startSession();

  const latest = getLatestLog();
  if (!latest) return;

  const stats = fs.statSync(latest);

  const start = Math.max(0, stats.size - 80000);

  const data = fs.readFileSync(latest, "utf8").slice(start);

  processStartupChunk(data);
}

async function trackLogs() {
  if (processing) return;
  processing = true;
  setTimeout(() => {
    processing = false;
  }, LOG_INTERVAL - 50);

  try {
    const running = await isRobloxRunning();
    if (!running) {
      processing = false;
      return;
    }

    const latest = getLatestLog();
    if (!latest) {
      processing = false;
      return;
    }

    const stats = fs.statSync(latest);

    if (latest !== currentLog) {
      currentLog = latest;
      logOffsets.set(latest, Math.max(0, stats.size - 5000));
    }

    const lastOffset = logOffsets.get(latest) || 0;

    if (stats.size <= lastOffset) {
      processing = false;
      return;
    }

    const stream = fs.createReadStream(latest, {
      start: lastOffset,
      end: stats.size - 1,
    });

    let chunk = "";

    stream.on("data", (data) => {
      chunk += data.toString();
    });

    stream.on("end", async () => {
      try {
        logOffsets.set(latest, stats.size);

        recentLogBuffer += chunk;

        if (recentLogBuffer.length > 50000) {
          recentLogBuffer = recentLogBuffer.slice(-50000);
        }

        const pid =
          chunk.match(/placeId\s*[:=]\s*(\d+)/i)?.[1] ||
          chunk.match(/roblox\.com\/games\/(\d+)/i)?.[1];

        const serverMatch =
          chunk.match(/serverId:\s*([\d.]+)\|(\d+)/i) ||
          chunk.match(/Connected to server at ([\d.]+):(\d+)/i);

        let serverKey = null;

        if (serverMatch) {
          currentServerIp = serverMatch[1];
          currentServerPort = serverMatch[2];
          serverKey = getServerKey(currentServerIp, currentServerPort);
        }

        const jobId =
          chunk.match(/jobId["=: ]+([a-zA-Z0-9-]+)/i)?.[1] ||
          chunk.match(/JobId["=: ]+([a-zA-Z0-9-]+)/i)?.[1];

        const joinEvent =
          pid &&
          /GameJoin|ClientGameJoin|PlaceLauncher|Replicator created/i.test(chunk);

        if (joinEvent) {
          if (pid && pid === lastPlaceId && inSession) return;
          let gameName = "Unknown Game";

          const isPrivate =
            /privateServerId|reservedServerAccessCode|vipServer|accessCode/i.test(chunk);

          serverType = isPrivate ? "Private Server" : "Public Server";

          privateServerId =
            chunk.match(/privateServerId["=: ]+([a-zA-Z0-9-_]+)/i)?.[1] ||
            chunk.match(/reservedServerAccessCode["=: ]+([a-zA-Z0-9-_]+)/i)?.[1] ||
            null;

          const uni = await getUniverseId(pid);

          if (uni) {
            universeId = uni;

            const info = await getGameInfo(uni);
            if (info) {
              gameName = info.name;
              players = info.players;
              genre = info.genre;
            }
          }

          const now = Date.now();

          const quickRejoin = now - lastLeaveTime < 15000;
          const samePlace = pid === lastPlaceId;

          const jobChanged =
            jobId && lastJobId && jobId !== lastJobId;

          const serverChanged =
            jobId && lastJobId && jobId !== lastJobId;

          const isHop =
            samePlace &&
            quickRejoin &&
            (jobChanged || serverChanged);

          if (isHop) {
            serverHopCount++;

            if (!isHoping) {
              startServerHop();
            }

            console.log(`🚀 Server hop detected (#${serverHopCount})`);
          }

          lastJobId = jobId || lastJobId;
          lastServerKey = serverKey || lastServerKey;
          lastPlaceId = pid;

          await joinGame(pid, gameName);
        }

        const leaveEvent =
          /Connection lost|Client:Disconnect|Replicator destroyed/i.test(chunk);

        if (leaveEvent) {
          leaveGame();
        }
      } catch (err) {
        console.log("trackLogs stream error:", err);
      } finally {
        processing = false;
      }
    });
  } catch (err) {
    console.log("trackLogs error:", err);
    processing = false;
  }
}

setInterval(async () => {
  const running = await isRobloxRunning();

  if (running && !robloxRunning) {
    robloxRunning = true;

    startSession();
  }

  if (!running && robloxRunning) {
    robloxRunning = false;

    endSession();
  }
}, CHECK_INTERVAL);

function printLeaderboard() {
  const top = tracker.getTopGames(10);

  console.clear();

  console.log(`Roblox Tracker v${VERSION}`);

  console.log("\n🏆 TOP GAMES:\n");

  if (!top || top.length === 0) {
    console.log("No data yet\n");
    return;
  }

  top.forEach((g, i) => {
    console.log(
      `${i + 1}. ${g.name} — ` +
      `${tracker.formatTime(g.totalSeconds)}`
    );
  });

  console.log("\n====================\n");
}

setInterval(trackLogs, LOG_INTERVAL);

console.clear();

console.log(`Roblox Tracker v${VERSION}`);

printLeaderboard();
startupCheck();
