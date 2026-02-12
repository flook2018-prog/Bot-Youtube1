require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN) {
  console.error("❌ ไม่พบ BOT_TOKEN");
  process.exit(1);
}

// ===== EXPRESS SERVER =====
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ===== TELEGRAM BOT =====
const bot = new Telegraf(BOT_TOKEN);

bot.on("text", (ctx) => {
  console.log("MESSAGE:", ctx.message.text);
});

bot.command("check", async (ctx) => {
  console.log("CHECK COMMAND TRIGGERED");
  await ctx.reply("✅ บอททำงานปกติ");
});

require("./monitor")(bot);

async function startBot() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    await bot.launch();
    console.log("🤖 Bot is running...");

    if (GROUP_CHAT_ID) {
      await bot.telegram.sendMessage(
        GROUP_CHAT_ID,
        "🚀 Bot Started"
      );
      console.log("ส่งข้อความเข้า Group สำเร็จ");
    }

  } catch (err) {
    console.error("Bot start error:", err.message);
  }
}

startBot();

process.once("SIGINT", () => {
  console.log("SIGIN
