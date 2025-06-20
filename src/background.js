let chessTabId = null;

function sendActivityToBridge(activity, site) {
    fetch("http://localhost:3000/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity, site }),
    })
        .then(() => {
            console.log(`Sent activity: ${activity}, site: ${site}`);
        })
        .catch((err) => {
            console.error("Failed to send activity to bridge:", err);
        });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHESS_PAGE") {
        console.log("Background received activity:", message.data.activity);

        if (sender.tab && sender.tab.id !== undefined) {
            chessTabId = sender.tab.id;
            console.log("Tracking chess tab (from content.js):", chessTabId);
        }

        sendActivityToBridge(message.data.activity, message.data.site);
    }
});

// Detect when chess.com or lichess.org tab is opened
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        if (tab.url.includes("chess.com")) {
            console.log("Chess.com tab detected:", tab.url);
            chessTabId = tabId;
            sendActivityToBridge("Playing Chess", "chesscom");
        } else if (tab.url.includes("lichess.org")) {
            console.log("Lichess.org tab detected:", tab.url);
            chessTabId = tabId;
            sendActivityToBridge("Playing Chess", "lichess");
        }
    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === chessTabId) {
        console.log("Chess tab closed");

        chessTabId = null;

        sendActivityToBridge("CLEAR", "");
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === chessTabId && changeInfo.url) {
        if (!changeInfo.url.includes("chess.com") && !changeInfo.url.includes("lichess.org")) {
            console.log("Tab navigated away:", changeInfo.url);
            chessTabId = null;
            sendActivityToBridge("CLEAR", "");
        }
    }
});
