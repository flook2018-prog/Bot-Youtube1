require("dotenv").config();
const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

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
  try {
    await ctx.reply("✅ บอททำงานปกติ");
  } catch (err) {
    console.error(err);
  }
});

// ===== LOAD MONITOR =====
require("./monitor")(bot);

// ===== LAUNCH =====
bot.launch().then(async () => {
  console.log("🤖 Bot is running...");

  try {
    await bot.telegram.sendMessage(
      GROUP_CHAT_ID,
      "🚀 Bot Started"
    );
    console.log("ส่งข้อความเข้า Group สำเร็จ");
  } catch (err) {
    console.error("ส่งเข้า Group ไม่สำเร็จ:", err.message);
  }
});

// graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
