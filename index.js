require("dotenv").config();
const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID;

if (!BOT_TOKEN) {
  console.error("❌ ไม่พบ BOT_TOKEN");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// 👇 ต้องอยู่หลังประกาศ bot
bot.on("text", (ctx) => {
  console.log("MESSAGE:", ctx.message.text);
});

bot.command("check", async (ctx) => {
  try {
    await ctx.reply("✅ บอททำงานปกติ");
  } catch (err) {
    console.error(err);
  }
});

bot.launch().then(() => {
  console.log("🤖 Bot is running...");
  
  if (GROUP_CHAT_ID) {
    bot.telegram.sendMessage(GROUP_CHAT_ID, "🚀 Bot Started");
  }
});
