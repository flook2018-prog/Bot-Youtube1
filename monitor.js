const cron = require("node-cron");
const db = require("./db");
const { getChannelFullInfo } = require("./youtube");

module.exports = (bot) => {
  console.log("📡 Monitor system started");

  cron.schedule("*/5 * * * *", async () => {
    try {
      const [rows] = await db.query("SELECT * FROM channels");

      for (let ch of rows) {
        try {
          const info = await getChannelFullInfo(ch.channel_id);

          if (info.status !== ch.last_status) {
            await db.query(
              "UPDATE channels SET last_status = ? WHERE id = ?",
              [info.status, ch.id]
            );

            const [user] = await db.query(
              "SELECT group_id FROM users WHERE id = ?",
              [ch.user_id]
            );

            if (user[0]?.group_id) {
              const emoji =
                info.status === "Alive" ? "🟢" : "🔴";

              await bot.telegram.sendMessage(
                user[0].group_id,
                `🚨 สถานะช่องเปลี่ยน!\n\n🎬 ${info.name}\nสถานะใหม่: ${emoji} ${info.status}`
              );
            }
          }
        } catch (err) {
          console.error("Channel monitor error:", err.message);
        }
      }
    } catch (err) {
      console.error("Monitor system error:", err.message);
    }
  });
};
