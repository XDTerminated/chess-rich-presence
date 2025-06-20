# Chess Rich Presence

Discord Rich Presence for [Chess.com](https://www.chess.com/) and [Lichess.org](https://lichess.org) using a Chrome Extension and a local bridge.

---

## How It Works

-   Chrome extension detects when you're using Chess.com or Lichess
-   Sends activity update to a local Express bridge (`http://localhost:3000`)
-   The bridge uses `discord-rpc` to update your Discord status
-   Discord shows correct app name and icon (based on your uploaded assets)

---

## Project Structure

```
images/
  chesscom.png
  lichess.png
src/
  background.js
  bridge.js
  content.js
manifest.json
package.json
README.md
LICENSE
```

---

## Setup

### 1 Install dependencies

```bash
npm install
```

---

### 2 Run the bridge

For normal run:

```bash
npm run bridge
```

For development (auto-restart on file change):

```bash
npm run dev
```

---

### 3 Load the Chrome Extension

1. Go to `chrome://extensions`
2. Enable "Developer Mode"
3. Click "Load unpacked"
4. Select your project folder (where manifest.json is)

---
