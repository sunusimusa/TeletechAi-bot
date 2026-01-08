import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEBAPP_URL = process.env.WEBAPP_URL;

/* ================= START ================= */
bot.start(async (ctx) => {
  try {
    const ref = ctx.startPayload || null;

    const url = ref
      ? `${WEBAPP_URL}?ref=${ref}`
      : `${WEBAPP_URL}`;

    await ctx.reply(
      "🔥 *TeleTap AI — Earn & Grow Together*\n\n" +
        "💰 Earn coins by tapping\n" +
        "🎁 Daily rewards\n" +
        "👥 Referral bonuses\n\n" +
        "👇 Tap below to start playing",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "▶️ Play & Earn",
                web_app: { url }
              }
            ]
          ]
        }
      }
    );

  } catch (err) {
    console.error("START ERROR:", err);
    await ctx.reply("❌ Something went wrong, try again.");
  }
});

/* ================= FALLBACK ================= */
bot.on("message", async (ctx) => {
  await ctx.reply("👇 Use the Play button to open the app");
});

/* ================= LAUNCH ================= */
bot.launch();
console.log("🤖 Telegram bot running...");

/* ================= SAFE SHUTDOWN ================= */
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
