// src/bridge.js

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const RPC = require("discord-rpc");

const clientId = "1355013849601806516"; // replace with your app ID!

RPC.register(clientId);

const rpc = new RPC.Client({ transport: "ipc" });

const app = express();

app.use(cors());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.json());

const PORT = 3000;

app.post("/update", async (req, res) => {
    const { activity, site } = req.body;

    console.log(`Received activity: ${activity} on ${site}`);

    try {
        if (activity === "CLEAR") {
            await rpc.clearActivity();
            console.log("Cleared Discord Activity.");
        } else {
            // Determine imageKey and state text
            let imageKey = "";
            let siteName = "";

            if (site === "chesscom") {
                imageKey = "chesscom";
                siteName = "Chess.com";
            } else if (site === "lichess") {
                imageKey = "lichess";
                siteName = "Lichess.org";
            } else {
                imageKey = "chesscom"; // fallback
                siteName = "Chess.com";
            }

            await rpc.setActivity({
                details: activity,
                state: `on ${siteName}`,
                startTimestamp: new Date(),
                largeImageKey: imageKey,
                largeImageText: `Playing on ${siteName}`,
                instance: false,
            });

            console.log("Updated Discord Activity.");
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("Error setting activity:", err);
        res.sendStatus(500);
    }
});

rpc.on("ready", () => {
    console.log("Discord RPC ready!");

    app.listen(PORT, () => {
        console.log(`Bridge server running at http://localhost:${PORT}`);
    });
});

rpc.login({ clientId }).catch(console.error);
