import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// ================= START COMMAND =================
bot.start(async (ctx) => {
  try {
    const ref =
      ctx.startPayload && ctx.startPayload.length > 0
        ? ctx.startPayload
        : null;

    // Mini App URL (Dole ya zama HTTPS)
    const WEBAPP_URL = "https://teletechai.onrender.com";

    const finalUrl = ref
      ? `${WEBAPP_URL}?ref=${ref}`
      : WEBAPP_URL;

    await ctx.reply(
      "🔥 *TeleTech AI*\n\nEarn coins, rewards & future tokens.\n\n👇 Open the app to start playing:",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          Markup.button.webApp("🚀 Open App", finalUrl)
        ])
      }
    );
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Error occurred. Try again later.");
  }
});

// ================= NO INLINE MODE =================
bot.on("inline_query", (ctx) => {
  // muna barin shi babu komai
});

// ================= LAUNCH =================
bot.launch().then(() => {
  console.log("🤖 TeleTech AI Bot is running...");
});

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
