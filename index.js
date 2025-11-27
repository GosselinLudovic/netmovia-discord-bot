const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(bodyParser.json());

// ⚠️ Sur Render on mettra ces valeurs en variables d'environnement
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Initialisation du bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on("ready", () => {
    console.log(`NetMovIA Bot connecté en tant que ${client.user.tag}`);
});

// Route appelée par NetMovIA pour envoyer un message vers Discord
app.post("/send", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "No message provided" });
        }

        const channel = await client.channels.fetch(CHANNEL_ID);
        await channel.send(message);

        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to send message" });
    }
});

// Mini serveur HTTP pour Render
app.listen(10000, () => {
    console.log("Webhook Discord actif sur le port 10000");
});

client.login(DISCORD_TOKEN);
