const express = require("express");
const bodyParser = require("body-parser");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(bodyParser.json());

// ⚙️ Variables d'environnement
const DISCORD_BOT_TOKEN        = process.env.DISCORD_BOT_TOKEN;
const CREATOR_CHANNEL_ID       = process.env.DISCORD_CREATORS_CHANNEL_ID;
const SUBSCRIBER_CHANNEL_ID    = process.env.DISCORD_SUBSCRIBERS_CHANNEL_ID;
const PORT                     = process.env.PORT || 10000;

// ➜ pour renvoyer les messages vers NetMovIA (Discord → NetMovIA)
const NETMOVIA_WEBHOOK_URL     = process.env.NETMOVIA_WEBHOOK_URL;
const NETMOVIA_SECRET          = process.env.NETMOVIA_SECRET;

// sécurité : on vérifie le token
if (!DISCORD_BOT_TOKEN || typeof DISCORD_BOT_TOKEN !== "string") {
  console.error("ERREUR: DISCORD_BOT_TOKEN est manquant ou invalide.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`NetMovIA Bot connecté en tant que ${client.user.tag}`);
});

/* ------------------------------------------------------------------
   1) NetMovIA → Discord (on laisse en secours, même si maintenant
      ton site utilise les webhooks directs)
------------------------------------------------------------------ */
app.post("/send", async (req, res) => {
  try {
    const { message, target } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    let channelId;
    if (target === "creator") {
      channelId = CREATOR_CHANNEL_ID;
    } else {
      channelId = SUBSCRIBER_CHANNEL_ID;
    }

    if (!channelId) {
      return res.status(400).json({ error: "No channel configured" });
    }

    const channel = await client.channels.fetch(channelId);
    await channel.send(message);

    return res.json({ success: true });
  } catch (err) {
    console.error("Erreur /send :", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

/* ------------------------------------------------------------------
   2) Discord → NetMovIA
      Quand quelqu'un parle dans #abonnés ou #créateurs,
      on POST vers api/chat_send_from_discord.php
------------------------------------------------------------------ */
client.on("messageCreate", async (message) => {
  try {
    // on ignore les messages du bot lui-même
    if (message.author.bot) return;

    // uniquement les deux salons NetMovIA
    if (
      message.channelId !== CREATOR_CHANNEL_ID &&
      message.channelId !== SUBSCRIBER_CHANNEL_ID
    ) {
      return;
    }

    if (!NETMOVIA_WEBHOOK_URL || !NETMOVIA_SECRET) {
      console.warn("NETMOVIA_WEBHOOK_URL ou NETMOVIA_SECRET manquant");
      return;
    }

    const room =
      message.channelId === CREATOR_CHANNEL_ID ? "creators" : "subscribers";

    const payload = {
      room,
      author: message.author.username,
      message: message.content || ""
    };

    // message vide (juste une image/pièce jointe) → on ignore
    if (!payload.message.trim()) return;

    const resp = await fetch(NETMOVIA_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Discord-Secret": NETMOVIA_SECRET
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error(
        "Discord → NetMovIA : HTTP",
        resp.status,
        resp.statusText,
        text.slice(0, 200)
      );
    }
  } catch (err) {
    console.error("Erreur Discord → NetMovIA :", err);
  }
});
/* ------------------------------------------------------------------
   Petit endpoint de "ping" pour réveiller le bot depuis NetMovIA
------------------------------------------------------------------ */
app.get("/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* ------------------------------------------------------------------
   Serveur HTTP pour Render
------------------------------------------------------------------ */
app.listen(PORT, () => {
  console.log(`Webhook Discord actif sur le port ${PORT}`);
});

client.login(DISCORD_BOT_TOKEN);

