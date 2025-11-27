const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(bodyParser.json());

// Variables depuis Render
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CREATOR_CHANNEL_ID = process.env.DISCORD_CREATORS_CHANNEL_ID;
const SUBSCRIBER_CHANNEL_ID = process.env.DISCORD_SUBSCRIBERS_CHANNEL_ID;
const PORT = process.env.PORT || 10000;

if (!DISCORD_BOT_TOKEN) {
  console.error("ERREUR: DISCORD_BOT_TOKEN manquant !");
  process.exit(1);
}

// Bot Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.on("ready", () => {
  console.log(`NetMovIA Bot connecté : ${client.user.tag}`);
});

// Route API appelée par ton site
app.post("/send", async (req, res) => {
  try {
    const { message, target } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message obligatoire" });
    }

    // Choix du salon selon target
    let channelId = null;

    if (target === "creator") channelId = CREATOR_CHANNEL_ID;
    else if (target === "subscriber") channelId = SUBSCRIBER_CHANNEL_ID;
    else return res.status(400).json({ error: "Target incorrect" });

    const channel = await client.channels.fetch(channelId);
    await channel.send(message);

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur envoi Discord" });
  }
});

// Serveur Render
app.listen(PORT, () => {
  console.log("Webhook Discord actif sur le port " + PORT);
});

client.login(DISCORD_BOT_TOKEN);
