const axios = require("axios");

const API = "https://www.googleapis.com/youtube/v3";

async function shortLink(url) {
  try {
    const resp = await axios.get(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );
    return resp.data;
  } catch {
    return url;
  }
}

async function getChannelFullInfo(channelId) {
  try {
    const channelRes = await axios.get(`${API}/channels`, {
      params: {
        part: "snippet,statistics,contentDetails",
        id: channelId,
        key: process.env.YT_API_KEY
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
        key: process.env.YT_API_KEY
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
          key: process.env.YT_API_KEY
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
      name,
      videoCount,
      videos
    };

  } catch {
    return { status: "Error" };
  }
}

module.exports = { getChannelFullInfo, shortLink };
