bot.command("check", async (ctx) => {
  try {
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
      try {
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
      } catch (err) {
        msg += `${index}️⃣ ${ch.name}\n`;
        msg += `❌ เกิดข้อผิดพลาดในการดึงข้อมูล\n\n`;
        index++;
      }
    }

    ctx.reply(msg);

  } catch (err) {
    console.error(err);
    ctx.reply("เกิดข้อผิดพลาดในระบบ");
  }
});
