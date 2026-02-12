const axios = require("axios");

const API = "https://www.googleapis.com/youtube/v3";
const YT_KEY = process.env.YT_API_KEY;

// =========================
// 🔎 แปลง input เป็น Channel ID
// =========================
async function resolveChannelId(input) {
  try {
    // ถ้าเป็น UCxxxx ตรง ๆ
    if (input.startsWith("UC")) {
      return input;
    }

    // ดึง handle จาก url หรือ @handle
    const handleMatch = input.match(/@([a-zA-Z0-9._-]+)/);
    if (handleMatch) {
      const handle = handleMatch[1];

      const res = await axios.get(`${API}/search`, {
        params: {
          part: "snippet",
          q: handle,
          type: "channel",
          maxResults: 1,
          key: YT_KEY
        }
      });

      if (res.data.items.length) {
        return res.data.items[0].snippet.channelId;
      }
    }

    // custom url (c/xxx หรือ user/xxx)
    const customMatch = input.match(/youtube\.com\/(c|user)\/([^\/]+)/);
    if (customMatch) {
      const name = customMatch[2];

      const res = await axios.get(`${API}/search`, {
        params: {
          part: "snippet",
          q: name,
          type: "channel",
          maxResults: 1,
          key: YT_KEY
        }
      });

      if (res.data.items.length) {
        return res.data.items[0].snippet.channelId;
      }
    }

    return null;

  } catch (err) {
    console.error("resolveChannelId error:", err.message);
    return null;
  }
}


// =========================
// 📊 ดึงข้อมูลช่องเต็ม
// =========================
async function getChannelFullInfo(input) {
  try {
    const channelId = await resolveChannelId(input);

    if (!channelId) {
      return { status: "Dead" };
    }

    const channelRes = await axios.get(`${API}/channels`, {
      params: {
        part: "snippet,statistics,contentDetails",
        id: channelId,
        key: YT_KEY
      }
    });

    if (!channelRes.data.items.length) {
      return { status: "Dead" };
    }

    const channel = channelRes.data.items[0];

    const name = channel.snippet.title;
    const videoCount = channel.statistics.videoCount;
    const uploadsPlaylist =
      channel.contentDetails.relatedPlaylists.uploads;

    const playlistRes = await axios.get(`${API}/playlistItems`, {
      params: {
        part: "snippet",
        playlistId: uploadsPlaylist,
        maxResults: 3,
        key: YT_KEY
      }
    });

    const videoIds = playlistRes.data.items.map(
      item => item.snippet.resourceId.videoId
    );

    let videos = [];

    if (videoIds.length) {
      const videoRes = await axios.get(`${API}/videos`, {
        params: {
          part: "statistics,snippet",
          id: videoIds.join(","),
          key: YT_KEY
        }
      });

      videos = videoRes.data.items.map(v => ({
        title: v.snippet.title,
        likeCount: v.statistics.likeCount || 0,
        commentCount: v.statistics.commentCount || 0
      }));
    }

    return {
      status: "Alive",
      channel_id: channelId,
      name,
      videoCount,
      videos
    };

  } catch (err) {
    console.error("getChannelFullInfo error:", err.message);
    return { status: "Error" };
  }
}

module.exports = { getChannelFullInfo };
