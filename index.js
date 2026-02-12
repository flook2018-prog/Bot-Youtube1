require("dotenv").config();
const { Telegraf } = require("telegraf");
const db = require("./db");
const { getChannelFullInfo, shortLink } = require("./youtube");
require("./monitor");

const bot = new Telegraf(process.env.BOT_TOKEN);

async function getUser(telegramId) {
  const [rows] = await db.query(
    "SELECT * FROM users WHERE telegram_id = ?",
    [telegramId]
  );

  if (rows.length) return rows[0];

  await db.query(
    "INSERT INTO users (telegram_id) VALUES (?)",
    [telegramId]
  );

  return getUser(telegramId);
}

bot.command("setgroup", async (ctx) => {
  const groupId = ctx.message.text.split(" ")[1];
  const user = await getUser(ctx.from.id);

  await db.query(
    "UPDATE users SET group_id = ? WHERE id = ?",
    [groupId, user.id]
  );

  ctx.reply("ตั้งค่ากลุ่มเรียบร้อย");
});

bot.command("add", async (ctx) => {
  const text = ctx.message.text.replace("/add ", "");
  const [name, url] = text.split("|").map(s => s.trim());

  if (!name || !url) {
    return ctx.reply("รูปแบบ: /add ชื่อ | ลิงก์");
  }

  const channelIdMatch = url.match(/channel\/([^\/]+)/);
  let channelId = channelIdMatch ? channelIdMatch[1] : null;

  if (!channelId) {
    return ctx.reply("กรุณาใช้ลิงก์แบบ /channel/ID");
  }

  const user = await getUser(ctx.from.id);

  await db.query(
    "INSERT INTO channels (user_id, name, url, channel_id) VALUES (?, ?, ?, ?)",
    [user.id, name, url, channelId]
  );

  ctx.reply("เพิ่มช่องเรียบร้อย");
});

bot.command("list", async (ctx) => {
  const user = await getUser(ctx.from.id);

  const [rows] = await db.query(
    "SELECT * FROM channels WHERE user_id = ?",
    [user.id]
  );

  if (!rows.length) {
    return ctx.reply("ยังไม่มีช่องในระบบ");
  }

  let msg = "📋 รายการช่องของคุณ\n\n";

  rows.forEach((ch, index) => {
    msg += `${index + 1}️⃣ ${ch.name}\n`;
  });

  msg += "\nใช้ /delete ลำดับที่ต้องการลบ";

  ctx.reply(msg);
});

bot.command("delete", async (ctx) => {
  const indexToDelete = parseInt(ctx.message.text.split(" ")[1]);

  if (!indexToDelete) {
    return ctx.reply("รูปแบบ: /delete 1");
  }

  const user = await getUser(ctx.from.id);

  const [rows] = await db.query(
    "SELECT * FROM channels WHERE user_id = ?",
    [user.id]
  );

  if (
    indexToDelete < 1 ||
    indexToDelete > rows.length
  ) {
    return ctx.reply("ลำดับไม่ถูกต้อง");
  }

  const channel = rows[indexToDelete - 1];

  await db.query(
    "DELETE FROM channels WHERE id = ?",
    [channel.id]
  );

  ctx.reply(`ลบช่อง ${channel.name} เรียบร้อยแล้ว`);
});

bot.command("check", async (ctx) => {
  const user = await getUser(ctx.from.id);

  const [rows] = await db.query(
    "SELECT * FROM channels WHERE user_id = ?",
    [user.id]
  );

  if (!rows.length) {
    return ctx.reply("ยังไม่มีช่องในระบบ");
  }

  let msg = "📊 รายงานสถานะช่อง YouTube\n\n";
  let index = 1;

  for (let ch of rows) {
    const info = await getChannelFullInfo(ch.channel_id);
    const shortUrl = await shortLink(ch.url);

    if (info.status !== "Alive") {
      msg += `${index}️⃣ ${ch.name}\n`;
      msg += `🔗 ${shortUrl}\n`;
      msg += `Status: ❌ ${info.status}\n\n`;
      index++;
      continue;
    }

    msg += `${index}️⃣ ${info.name}\n`;
    msg += `🔗 ${shortUrl}\n`;
    msg += `Status: ✅ Alive\n`;
    msg += `🎥 จำนวนวิดีโอทั้งหมด: ${info.videoCount}\n\n`;

    info.videos.forEach((v, i) => {
      msg += `🎬 คลิป ${i + 1}: ${v.title}\n`;
      msg += `   👍 ไลค์: ${v.likeCount}\n`;
      msg += `   💬 คอมเมนต์: ${v.commentCount}\n\n`;
    });

    index++;
  }

  ctx.reply(msg);
});

bot.launch();
