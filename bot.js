// bot.js
import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

export function startBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN);
  const WEBAPP_URL = "https://teletechai.onrender.com";

  bot.start(async (ctx) => {
    const ref = ctx.startPayload || "";

    const url = ref
      ? `${WEBAPP_URL}?ref=${ref}`
      : WEBAPP_URL;

    await ctx.reply(
      "🔥 TeleTech AI\n\n👇 Open the app",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 Open App", web_app: { url } }]
          ]
        }
      }
    );
  });

  bot.launch();
  console.log("🤖 Telegram Bot Started");
}
