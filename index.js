require("dotenv").config();
const { Telegraf } = require("telegraf");
const express = require("express");
const db = require("./db");
const { getChannelFullInfo } = require("./youtube");

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 8080;

if (!BOT_TOKEN) {
  console.error("❌ ไม่พบ BOT_TOKEN");
  process.exit(1);
}

const app = express();
const bot = new Telegraf(BOT_TOKEN);

// =========================
// ✅ CHECK
// =========================
bot.command("check", async (ctx) => {
  await ctx.reply("✅ บอททำงานปกติ");
});

// =========================
// ✅ ADD CHANNEL
// =========================
bot.command("add", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const input = args[1];

  if (!input) {
    return ctx.reply("ใช้แบบนี้:\n/add ลิงก์ช่อง หรือ UCxxxx");
  }

  try {
    const info = await getChannelFullInfo(input);

    if (info.status !== "Alive") {
      return ctx.reply("ไม่พบช่อง หรือช่องถูกลบแล้ว");
    }

    const channelId = info.channel_id;
    const groupId = ctx.chat.id;

    // สร้าง user ถ้ายังไม่มี
    await db.query(
      "INSERT IGNORE INTO users (group_id) VALUES (?)",
      [groupId]
    );

    const [user] = await db.query(
      "SELECT id FROM users WHERE group_id = ?",
      [groupId]
    );

    const userId = user[0].id;

    // เช็คซ้ำ
    const [existing] = await db.query(
      "SELECT id FROM channels WHERE channel_id = ? AND user_id = ?",
      [channelId, userId]
    );

    if (existing.length > 0) {
      return ctx.reply("ช่องนี้ถูกเพิ่มแล้ว ⚠️");
    }

    // เพิ่มช่อง
    const [result] = await db.query(
      "INSERT INTO channels (channel_id, user_id, channel_name, last_status) VALUES (?, ?, ?, 'Unknown')",
      [channelId, userId, info.name]
    );

    const insertedId = result.insertId;

    // ใช้ auto increment สร้างรหัส
    const code = "CH" + String(insertedId).padStart(4, "0");

    await db.query(
      "UPDATE channels SET code = ? WHERE id = ?",
      [code, insertedId]
    );

    await ctx.reply(
      `เพิ่มช่องเรียบร้อย ✅\n\nชื่อ: ${info.name}\nรหัส: ${code}`
    );

  } catch (err) {
    console.error(err);
    ctx.reply("เกิดข้อผิดพลาด");
  }
});

// =========================
// ✅ REMOVE
// =========================
bot.command("remove", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const code = args[1];

  if (!code) {
    return ctx.reply("ใช้แบบนี้:\n/remove CH0001");
  }

  try {
    const groupId = ctx.chat.id;

    const [user] = await db.query(
      "SELECT id FROM users WHERE group_id = ?",
      [groupId]
    );

    if (!user.length) {
      return ctx.reply("ไม่พบข้อมูลกลุ่ม");
    }

    const userId = user[0].id;

    const [result] = await db.query(
      "DELETE FROM channels WHERE code = ? AND user_id = ?",
      [code, userId]
    );

    if (result.affectedRows === 0) {
      return ctx.reply("ไม่พบรหัสนี้");
    }

    ctx.reply(`ลบช่อง ${code} เรียบร้อย 🗑️`);

  } catch (err) {
    console.error(err);
    ctx.reply("เกิดข้อผิดพลาด");
  }
});

// =========================
// ✅ LIST
// =========================
bot.command("list", async (ctx) => {
  try {
    const groupId = ctx.chat.id;

    const [user] = await db.query(
      "SELECT id FROM users WHERE group_id = ?",
      [groupId]
    );

    if (!user.length) {
      return ctx.reply("ยังไม่มีช่องที่เพิ่มไว้");
    }

    const userId = user[0].id;

    const [channels] = await db.query(
      "SELECT channel_id, code FROM channels WHERE user_id = ?",
      [userId]
    )
