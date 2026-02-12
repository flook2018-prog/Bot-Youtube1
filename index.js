require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 8080;

if (!BOT_TOKEN) {
  console.error("❌ ไม่พบ BOT_TOKEN");
  process.exit(1);
}

const app = express();
const bot = new Telegraf(BOT_TOKEN);

// ===== COMMANDS =====
bot.command("check", async (ctx) => {
  console.log("CHECK COMMAND TRIGGERED");
  try {
    await ctx.reply("✅ บอททำงานปกติ");
  } catch (err) {
    console.error("Reply error:", err.message);
  }
});

// log ทุกข้อความ
bot.on("text", (ctx) => {
  console.log("MESSAGE:", ctx.message.text);
});

// error handler
bot.catch((err) => {
  console.error("Bot error:", err);
});

// monitor system
require("./monitor")(bot);

// ===== WEBHOOK ROUTE (ตัวที่คุณขาด!) =====
app.use(bot.webhookCallback("/bot"));

// health check
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// ===== START SERVER + SET WEBHOOK =====
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🌐 Web server running on port ${PORT}`);
  console.log("📡 Monitor system started");

  try {
    const WEBHOOK_URL = process.env.WEBHOOK_URL;

    if (!WEBHOOK_URL) {
      throw new Error("WEBHOOK_URL not set");
    }

    await bot.telegram.setWebhook(`${WEBHOOK_URL}/bot`);
    console.log("Webhook set สำเร็จ");

  } catch (err) {
    console.error("Bot start error:", err);
  }
});

// graceful shutdown
process.once("SIGINT", () => {
  console.log("SIGINT received");
  bot.stop("SIGINT");
});

process.once("SIGTERM", () => {
  console.log("SIGTERM received");
  bot.stop("SIGTERM");
});
