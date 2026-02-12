require("dotenv").config();
const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

if (!BOT_TOKEN) {
  console.error("❌ ไม่พบ BOT_TOKEN");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.on("text", (ctx) => {
  console.log("MESSAGE:", ctx.message.text);
});

bot.command("check", async (ctx) => {
  console.log("CHECK COMMAND TRIGGERED");
  await ctx.reply("✅ บอททำงานปกติ");
});

// โหลด monitor
require("./monitor")(bot);

async function startBot() {
  try {
    // 🔥 ลบ webhook ก่อนทุกครั้ง
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });

    await bot.launch();
    console.log("🤖 Bot is running...");

    if (GROUP_CHAT_ID) {
      await bot.telegram.sendMessage(
        GROUP_CHAT_ID,
        "🚀 Bot Started"
      );
    }

  } catch (err) {
    console.error("Bot start error:", err);
  }
}

startBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
