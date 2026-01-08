// bot.js
import { Telegraf } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN) {
  throw new Error("❌ BOT_TOKEN missing in .env");
}

const bot = new Telegraf(BOT_TOKEN);

export function startBot() {
  // /start command
  bot.start(async (ctx) => {
    try {
      const ref = ctx.startPayload || null;

      const url = ref
        ? `${WEBAPP_URL}?ref=${ref}`
        : WEBAPP_URL;

      await ctx.reply(
        "🔥 *TeleTech AI*\n\n" +
        "💰 Earn coins\n" +
        "🎁 Daily rewards\n" +
        "👥 Referral bonuses\n\n" +
        "👇 Click below to start",
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
      console.error("BOT START ERROR:", err);
      ctx.reply("❌ Error occurred. Try again.");
    }
  });

  // fallback
  bot.on("message", (ctx) => {
    ctx.reply("👇 Click *Play & Earn* button to open the app", {
      parse_mode: "Markdown"
    });
  });

  bot.launch();
  console.log("🤖 Telegram Bot Started");

  // safe shutdown
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
