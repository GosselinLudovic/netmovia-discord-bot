const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(bodyParser.json());

// ⚠️ Sur Render on lit les variables d'environnement
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CREATOR_CHANNEL_ID = process.env.DISCORD_CREATORS_CHANNEL_ID;
const SUBSCRIBER_CHANNEL_ID = process.env.DISCORD_SUBSCRIBERS_CHANNEL_ID;
const PORT = process.env.PORT || 10000;

// sécurité : on vérifie que le token existe
if (!DISCORD_BOT_TOKEN || typeof DISCORD_BOT_TOKEN !== "string") {
  console.error("ERREUR: DISCORD_BOT_TOKEN est manquant ou invalide.");
  process.exit(1);
}


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

                // Pour l'instant : on envoie dans le salon abonnés par défaut
        const channelId = SUBSCRIBER_CHANNEL_ID || CREATOR_CHANNEL_ID;
        const channel = await client.channels.fetch(channelId);
        await channel.send(message);


        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to send message" });
    }
});

// Mini serveur HTTP pour Render
app.listen(PORT, () => {
    console.log(`Webhook Discord actif sur le port ${PORT}`);
});

client.login(DISCORD_BOT_TOKEN);


