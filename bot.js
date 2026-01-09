import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEBAPP_URL = process.env.WEBAPP_URL; // 👈 daga .env

// ================= START COMMAND =================
bot.start(async (ctx) => {
  try {
    // 🔗 Referral code (idan akwai)
    const ref = ctx.startPayload && ctx.startPayload.length > 0
      ? ctx.startPayload
      : null;

    const finalUrl = ref
      ? `${WEBAPP_URL}?ref=${ref}`
      : WEBAPP_URL;

    await ctx.reply(
      "🔥 *TeleTech AI*\n\n" +
      "💰 Earn coins & rewards\n" +
      "🎁 Daily bonus\n" +
      "👥 Invite friends & earn more\n\n" +
      "👇 Open the app to start playing:",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          Markup.button.webApp("🚀 Play & Earn", finalUrl)
        ])
      }
    );
  } catch (err) {
    console.error("BOT START ERROR:", err);
    await ctx.reply("❌ Something went wrong. Please try again.");
  }
});

// ================= FALLBACK =================
bot.on("message", async (ctx) => {
  await ctx.reply(
    "👇 Click *Play & Earn* to open the app",
    {
      parse_mode: "Markdown",
      ...Markup.inlineKeyboard([
        Markup.button.webApp("🚀 Play & Earn", WEBAPP_URL)
      ])
    }
  );
});

// ================= LAUNCH =================
bot.launch().then(() => {
  console.log("🤖 TeleTech AI Bot is running...");
});

// ================= SAFE SHUTDOWN =================
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
