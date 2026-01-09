import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const WEBAPP_URL = "https://teletechai.onrender.com";

bot.start(async (ctx) => {
  const ref = ctx.startPayload || "";

  const url = ref
    ? `${WEBAPP_URL}?ref=${ref}`
    : WEBAPP_URL;

  await ctx.reply(
    "🔥 *TeleTech AI*\n\n" +
    "Earn • Play • Invite • Grow\n\n" +
    "👇 Tap below to open the app",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Open App",
              web_app: { url }
            }
          ]
        ]
      }
    }
  );
});

bot.launch();
console.log("🤖 Bot running...");
