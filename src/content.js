console.log("Chess or Lichess page detected.");

chrome.runtime.sendMessage({
    type: "CHESS_PAGE",
    data: {
        activity: "Playing Chess",
        site: window.location.hostname.includes("lichess.org") ? "lichess" : "chesscom",
    },
});
