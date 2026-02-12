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

const bot = new Telegraf(BOT_TOKEN);

// ===== DEBUG =====
bot.on("text", (ctx) => {
  console.log("MESSAGE:", ctx.message.text);
});

// ===== COMMAND =====
bot.command("check", async (ctx) => {
  console.log("CHECK COMMAND TRIGGERED");
  await ctx.reply("✅ บอททำงานปกติ");
});

// ===== LOAD MONITOR =====
require("./monitor")(bot);

// ===== START FUNCTION =====
async function startBot() {
  try {
    console.log("กำลังลบ webhook...");
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });

    console.log("กำลัง launch bot...");
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

// ===== EXPRESS SERVER (กัน Railway restart) =====
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive");
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ===== GRACEFUL STOP =====
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
