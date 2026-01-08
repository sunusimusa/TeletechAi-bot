import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN || !WEBAPP_URL) {
  throw new Error("❌ BOT_TOKEN or WEBAPP_URL missing in .env");
}

const bot = new Telegraf(BOT_TOKEN);

/* ================= START ================= */
bot.start(async (ctx) => {
  try {
    // 🔑 referral code daga /start ABC123
    const ref = ctx.startPayload || "";

    // 🔗 webapp url (Telegram WebApp standard)
    const url = ref
      ? `${WEBAPP_URL}?start=${ref}`
      : `${WEBAPP_URL}`;

    await ctx.reply(
      "🔥 *TeleTap AI — Earn & Grow Together*\n\n" +
      "💰 Earn coins by tapping\n" +
      "🎁 Daily rewards\n" +
      "👥 Referral bonuses\n\n" +
      "👇 Tap the button below to start playing",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Play & Earn",
                web_app: { url }
              }
            ],
            [
              {
                text: "ℹ️ How it works",
                callback_data: "HELP"
              }
            ]
          ]
        }
      }
    );

  } catch (err) {
    console.error("❌ START ERROR:", err);
    ctx.reply("❌ Something went wrong, please try again.");
  }
});

/* ================= PLAY COMMAND ================= */
bot.command("play", (ctx) => {
  ctx.reply(
    "👇 Tap the Play button to open the app",
    Markup.inlineKeyboard([
      Markup.button.webApp("🚀 Play & Earn", WEBAPP_URL)
    ])
  );
});

/* ================= HELP BUTTON ================= */
bot.action("HELP", async (ctx) => {
  await ctx.answerCbQuery();
  ctx.reply(
    "📖 *How TeleTap AI Works*\n\n" +
    "1️⃣ Tap to earn coins\n" +
    "2️⃣ Claim daily rewards\n" +
    "3️⃣ Invite friends & earn bonuses\n" +
    "4️⃣ Upgrade to PRO for more power\n\n" +
    "👇 Tap *Play* to start",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Play & Earn",
              web_app: { url: WEBAPP_URL }
            }
          ]
        ]
      }
    );
});

/* ================= FALLBACK ================= */
bot.on("message", (ctx) => {
  ctx.reply(
    "👇 Please use the *Play* button to open the app",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Play & Earn",
              web_app: { url: WEBAPP_URL }
            }
          ]
        ]
      }
    }
  );
});

/* ================= LAUNCH ================= */
bot.launch();
console.log("🤖 Telegram bot running...");

/* ================= SAFE SHUTDOWN ================= */
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
