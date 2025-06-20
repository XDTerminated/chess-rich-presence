// src/content.js

console.log("Chess.com or Lichess.org page detected.");

let startTimestamp = Math.floor(Date.now() / 1000); // In seconds!
let lastState = "";
let lastUrl = "";
let gameStartTimestamp = null; // Separate timestamp for when a game actually starts

// Load persistent timestamps from storage
async function loadTimestamps() {
    try {
        const result = await chrome.storage.local.get(["chessStartTimestamp", "chessGameStartTimestamp", "chessLastState"]);

        if (result.chessStartTimestamp) {
            startTimestamp = result.chessStartTimestamp;
            console.log("Loaded persistent startTimestamp:", startTimestamp);
        }

        if (result.chessGameStartTimestamp) {
            gameStartTimestamp = result.chessGameStartTimestamp;
            console.log("Loaded persistent gameStartTimestamp:", gameStartTimestamp);
        }

        if (result.chessLastState) {
            lastState = result.chessLastState;
            console.log("Loaded persistent lastState:", lastState);
        }
    } catch (error) {
        console.log("Could not load timestamps from storage:", error);
    }
}

// Save timestamps to storage
async function saveTimestamps() {
    try {
        await chrome.storage.local.set({
            chessStartTimestamp: startTimestamp,
            chessGameStartTimestamp: gameStartTimestamp,
            chessLastState: lastState,
        });
    } catch (error) {
        console.log("Could not save timestamps to storage:", error);
    }
}

function detectChessComGame() {
    // Multiple possible selectors for Chess.com boards
    const board = document.querySelector(".board") || document.querySelector("#board-layout-main") || document.querySelector(".game-board") || document.querySelector("[data-chess-board]");

    // Check for game indicators - clocks, game status, or URL patterns
    const playerClock = document.querySelector(".clock-player") || document.querySelector(".clock-top") || document.querySelector(".clock-bottom");
    const opponentClock = document.querySelector(".clock-opponent");
    const gameArea = document.querySelector(".game-area") || document.querySelector("#game-area") || document.querySelector(".game-layout");

    // Check URL patterns that indicate an active game
    const isGameUrl = /\/(game|play|live)\//.test(window.location.pathname) || /\/analysis\//.test(window.location.pathname); // More comprehensive game detection
    const isInGame = (board && (playerClock || opponentClock || gameArea)) || (board && isGameUrl) || document.querySelector(".game-controls") || document.querySelector(".game-buttons");
    const currentState = isInGame ? "In a Game" : "Playing Chess";
    const currentUrl = window.location.href;

    // Only reset timestamp when transitioning TO a game state, not for URL changes within games
    if (currentState === "In a Game" && lastState !== "In a Game") {
        console.log("Started a new game → reset gameStartTimestamp");
        gameStartTimestamp = Math.floor(Date.now() / 1000);
        saveTimestamps(); // Save to storage
    } else if (currentState !== "In a Game" && gameStartTimestamp) {
        console.log("Left game → clear gameStartTimestamp");
        gameStartTimestamp = null;
        saveTimestamps(); // Save to storage
    } // Use game-specific timestamp when in game, general timestamp otherwise
    const timestampToUse = currentState === "In a Game" && gameStartTimestamp ? gameStartTimestamp : startTimestamp;
    if (currentState !== lastState || currentUrl !== lastUrl) {
        console.log(`Chess.com State changed: ${currentState} | URL: ${currentUrl}`);
        console.log(`Board found: ${!!board}, Clock found: ${!!(playerClock || opponentClock)}, Game area: ${!!gameArea}, Game URL: ${isGameUrl}`);

        // Save state changes to storage
        lastState = currentState;
        lastUrl = currentUrl;
        saveTimestamps();

        chrome.runtime.sendMessage({
            type: "CHESS_PAGE",
            data: {
                activity: currentState,
                site: "chesscom",
                url: isInGame ? currentUrl : undefined,
                startTimestamp: timestampToUse,
            },
        });
    }
}

function detectLichessGame() {
    // Multiple possible selectors for Lichess boards
    const board = document.querySelector(".cg-board") || document.querySelector(".board") || document.querySelector("#board") || document.querySelector("[data-chess-board]");

    // Check for game indicators
    const player = document.querySelector(".player.me") || document.querySelector(".ruser") || document.querySelector(".username");
    const gameControls = document.querySelector(".game-control") || document.querySelector(".rmoves") || document.querySelector(".game_control");

    // Check URL patterns that indicate an active game
    const isGameUrl = /^\/[a-zA-Z0-9]{8}$/.test(window.location.pathname) || /\/analysis\//.test(window.location.pathname) || /\/game\//.test(window.location.pathname); // More comprehensive game detection
    const isInGame = (board && (player || gameControls)) || (board && isGameUrl) || document.querySelector(".game-buttons") || document.querySelector(".game_control");

    const currentState = isInGame ? "In a Game" : "Playing Chess";
    const currentUrl = window.location.href; // Only reset timestamp when transitioning TO a game state, not for URL changes within games
    if (currentState === "In a Game" && lastState !== "In a Game") {
        console.log("Started a new game → reset gameStartTimestamp");
        gameStartTimestamp = Math.floor(Date.now() / 1000);
        saveTimestamps(); // Save to storage
    } else if (currentState !== "In a Game" && gameStartTimestamp) {
        console.log("Left game → clear gameStartTimestamp");
        gameStartTimestamp = null;
        saveTimestamps(); // Save to storage
    }

    // Use game-specific timestamp when in game, general timestamp otherwise
    const timestampToUse = currentState === "In a Game" && gameStartTimestamp ? gameStartTimestamp : startTimestamp;
    if (currentState !== lastState || currentUrl !== lastUrl) {
        console.log(`Lichess State changed: ${currentState} | URL: ${currentUrl}`);
        console.log(`Board found: ${!!board}, Player found: ${!!player}, Game controls: ${!!gameControls}, Game URL: ${isGameUrl}`);

        // Save state changes to storage
        lastState = currentState;
        lastUrl = currentUrl;
        saveTimestamps();

        chrome.runtime.sendMessage({
            type: "CHESS_PAGE",
            data: {
                activity: currentState,
                site: "lichess",
                url: isInGame ? currentUrl : undefined,
                startTimestamp: timestampToUse,
            },
        });
    }
}

function detectGame() {
    console.log("Detecting game on:", window.location.hostname);

    if (window.location.hostname.includes("chess.com")) {
        console.log("Running Chess.com detection");
        detectChessComGame();
    } else if (window.location.hostname.includes("lichess.org")) {
        console.log("Running Lichess detection");
        detectLichessGame();
    }
}

// Initial detection - load timestamps first
loadTimestamps().then(() => {
    detectGame();
});

// Improved observer with debouncing
let observerTimeout;
const observer = new MutationObserver(() => {
    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
        detectGame();
    }, 500); // Debounce for 500ms to avoid excessive calls
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-chess-board"],
});

// Also listen for URL changes (for single-page applications)
let currentUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log("URL changed, re-detecting game");
        setTimeout(detectGame, 1000); // Wait a bit for page to load
    }
}, 1000);
